CREATE TABLE IF NOT EXISTS public.external_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(500),
  description TEXT,
  participants TEXT[],
  duration_minutes INTEGER,
  recording_url TEXT,
  transcript TEXT,
  attachments JSONB,
  metadata JSONB,
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.integration_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE NOT NULL,
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  records_processed INTEGER DEFAULT 0,
  records_added INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);