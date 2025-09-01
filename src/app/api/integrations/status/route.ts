import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

interface IntegrationStatus {
  type: string;
  name: string;
  configured: boolean;
  missingEnvVars: string[];
  canConnect: boolean;
  status: 'ready' | 'needs_config' | 'partially_configured';
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrationStatuses: IntegrationStatus[] = [
      {
        type: 'gmail',
        name: 'Gmail',
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        missingEnvVars: [
          !process.env.GOOGLE_CLIENT_ID && 'GOOGLE_CLIENT_ID',
          !process.env.GOOGLE_CLIENT_SECRET && 'GOOGLE_CLIENT_SECRET'
        ].filter(Boolean) as string[],
        canConnect: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        status: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'ready' : 'needs_config'
      },
      {
        type: 'calendly',
        name: 'Calendly',
        configured: !!(process.env.CALENDLY_CLIENT_ID && process.env.CALENDLY_CLIENT_SECRET),
        missingEnvVars: [
          !process.env.CALENDLY_CLIENT_ID && 'CALENDLY_CLIENT_ID',
          !process.env.CALENDLY_CLIENT_SECRET && 'CALENDLY_CLIENT_SECRET'
        ].filter(Boolean) as string[],
        canConnect: !!(process.env.CALENDLY_CLIENT_ID && process.env.CALENDLY_CLIENT_SECRET),
        status: !!(process.env.CALENDLY_CLIENT_ID && process.env.CALENDLY_CLIENT_SECRET) ? 'ready' : 'needs_config'
      },
      {
        type: 'basecamp',
        name: 'Basecamp',
        configured: !!(process.env.BASECAMP_CLIENT_ID && process.env.BASECAMP_CLIENT_SECRET),
        missingEnvVars: [
          !process.env.BASECAMP_CLIENT_ID && 'BASECAMP_CLIENT_ID',
          !process.env.BASECAMP_CLIENT_SECRET && 'BASECAMP_CLIENT_SECRET'
        ].filter(Boolean) as string[],
        canConnect: !!(process.env.BASECAMP_CLIENT_ID && process.env.BASECAMP_CLIENT_SECRET),
        status: !!(process.env.BASECAMP_CLIENT_ID && process.env.BASECAMP_CLIENT_SECRET) ? 'ready' : 'needs_config'
      },
      {
        type: 'slack',
        name: 'Slack',
        configured: !!(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET),
        missingEnvVars: [
          !process.env.SLACK_CLIENT_ID && 'SLACK_CLIENT_ID',
          !process.env.SLACK_CLIENT_SECRET && 'SLACK_CLIENT_SECRET'
        ].filter(Boolean) as string[],
        canConnect: !!(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET),
        status: !!(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET) ? 'ready' : 'needs_config'
      },
      {
        type: 'zoom',
        name: 'Zoom',
        configured: !!(process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET),
        missingEnvVars: [
          !process.env.ZOOM_CLIENT_ID && 'ZOOM_CLIENT_ID',
          !process.env.ZOOM_CLIENT_SECRET && 'ZOOM_CLIENT_SECRET'
        ].filter(Boolean) as string[],
        canConnect: !!(process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET),
        status: !!(process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET) ? 'ready' : 'needs_config'
      },
      {
        type: 'loom',
        name: 'Loom',
        configured: !!(process.env.LOOM_CLIENT_ID && process.env.LOOM_PRIVATE_KEY),
        missingEnvVars: [
          !process.env.LOOM_CLIENT_ID && 'LOOM_CLIENT_ID',
          !process.env.LOOM_PRIVATE_KEY && 'LOOM_PRIVATE_KEY'
        ].filter(Boolean) as string[],
        canConnect: !!(process.env.LOOM_CLIENT_ID && process.env.LOOM_PRIVATE_KEY),
        status: !!(process.env.LOOM_CLIENT_ID && process.env.LOOM_PRIVATE_KEY) ? 'ready' : 'needs_config'
      },
      {
        type: 'fireflies',
        name: 'Fireflies.ai',
        configured: !!process.env.FIREFLIES_API_KEY,
        missingEnvVars: [
          !process.env.FIREFLIES_API_KEY && 'FIREFLIES_API_KEY'
        ].filter(Boolean) as string[],
        canConnect: !!process.env.FIREFLIES_API_KEY,
        status: !!process.env.FIREFLIES_API_KEY ? 'ready' : 'needs_config'
      }
    ];

    // Get user's active integrations
    const { data: userIntegrations } = await supabase
      .from('integrations')
      .select('type, status, last_sync')
      .eq('user_id', user.id);

    // Enhance status with user's integration data
    const enhancedStatuses = integrationStatuses.map(status => {
      const userIntegration = userIntegrations?.find(ui => ui.type === status.type);
      return {
        ...status,
        userStatus: userIntegration?.status || 'inactive',
        lastSync: userIntegration?.last_sync || null,
        isConnected: userIntegration?.status === 'active'
      };
    });

    return NextResponse.json({ 
      integrations: enhancedStatuses,
      summary: {
        total: integrationStatuses.length,
        configured: integrationStatuses.filter(s => s.configured).length,
        connected: enhancedStatuses.filter(s => s.isConnected).length
      }
    });

  } catch (error) {
    console.error('Integration status error:', error);
    return NextResponse.json(
      { error: 'Failed to get integration status' },
      { status: 500 }
    );
  }
}