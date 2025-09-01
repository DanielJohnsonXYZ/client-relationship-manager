-- Extended integration schema for communication tools
-- Add to existing schema.sql or run separately

-- Update integrations table to support more tools
ALTER TABLE public.integrations 
DROP CONSTRAINT IF EXISTS integrations_type_check;

ALTER TABLE public.integrations 
ADD CONSTRAINT integrations_type_check 
CHECK (type IN ('gmail', 'slack', 'zoom', 'calendly', 'stripe', 'loom', 'fireflies', 'teams', 'hubspot', 'salesforce', 'basecamp'));

-- Add OAuth tokens table for secure token storage
CREATE TABLE public.integration_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add external activities table to track all external interactions
CREATE TABLE public.external_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE NOT NULL,
  external_id VARCHAR(255) NOT NULL, -- External tool's ID for this activity
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('email', 'call', 'meeting', 'video', 'message', 'document')),
  title VARCHAR(500),
  description TEXT,
  participants TEXT[],
  duration_minutes INTEGER,
  recording_url TEXT,
  transcript TEXT,
  attachments JSONB,
  metadata JSONB, -- Tool-specific metadata
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(integration_id, external_id)
);

-- Add integration sync logs for debugging
CREATE TABLE public.integration_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE NOT NULL,
  sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('manual', 'scheduled', 'webhook', 'initial')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  records_processed INTEGER DEFAULT 0,
  records_added INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for integration_tokens
CREATE POLICY "Users can view own integration tokens" ON public.integration_tokens
  FOR SELECT USING (
    integration_id IN (
      SELECT id FROM public.integrations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own integration tokens" ON public.integration_tokens
  FOR ALL USING (
    integration_id IN (
      SELECT id FROM public.integrations WHERE user_id = auth.uid()
    )
  );

-- RLS policies for external_activities
CREATE POLICY "Users can view own external activities" ON public.external_activities
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own external activities" ON public.external_activities
  FOR ALL USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- RLS policies for integration_sync_logs
CREATE POLICY "Users can view own sync logs" ON public.integration_sync_logs
  FOR SELECT USING (
    integration_id IN (
      SELECT id FROM public.integrations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own sync logs" ON public.integration_sync_logs
  FOR INSERT WITH CHECK (
    integration_id IN (
      SELECT id FROM public.integrations WHERE user_id = auth.uid()
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_integration_tokens_updated_at BEFORE UPDATE ON public.integration_tokens
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- Add indexes for performance
CREATE INDEX idx_external_activities_client_date ON public.external_activities(client_id, activity_date DESC);
CREATE INDEX idx_external_activities_integration ON public.external_activities(integration_id);
CREATE INDEX idx_integration_tokens_integration ON public.integration_tokens(integration_id);
CREATE INDEX idx_sync_logs_integration_date ON public.integration_sync_logs(integration_id, created_at DESC);

-- Function to automatically create communication record from external activity
CREATE OR REPLACE FUNCTION public.sync_external_activity_to_communication()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create communication record if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM public.communications 
    WHERE client_id = NEW.client_id 
    AND subject = NEW.title 
    AND communication_date = NEW.activity_date
  ) THEN
    INSERT INTO public.communications (
      client_id,
      user_id,
      type,
      subject,
      content,
      direction,
      communication_date
    )
    SELECT 
      NEW.client_id,
      i.user_id,
      CASE 
        WHEN NEW.activity_type = 'email' THEN 'email'
        WHEN NEW.activity_type IN ('call', 'video') THEN 'call'
        WHEN NEW.activity_type = 'meeting' THEN 'meeting'
        ELSE 'other'
      END,
      NEW.title,
      COALESCE(NEW.description, NEW.transcript),
      'outbound', -- Assume outbound for now, can be refined
      NEW.activity_date
    FROM public.integrations i
    WHERE i.id = NEW.integration_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to sync external activities to communications
CREATE TRIGGER sync_external_to_communication
  AFTER INSERT ON public.external_activities
  FOR EACH ROW EXECUTE PROCEDURE public.sync_external_activity_to_communication();