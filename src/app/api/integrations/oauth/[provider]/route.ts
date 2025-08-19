import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

// Handle API key based integrations
async function handleApiKeyIntegration(provider: string, config: any) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
    }

    if (!config.clientId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?integration_error=api_key_missing`);
    }

    // Find the integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', provider)
      .single();

    if (integrationError || !integration) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?integration_error=integration_not_found`);
    }

    // Store API key as access token
    const { error: tokenError } = await supabase
      .from('integration_tokens')
      .upsert({
        integration_id: integration.id,
        access_token: config.clientId, // API key stored as access token
        refresh_token: null,
        expires_at: null, // API keys don't expire
        scope: config.scopes,
      });

    if (tokenError) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?integration_error=token_storage_failed`);
    }

    // Update integration status
    await supabase
      .from('integrations')
      .update({ 
        status: 'active',
        last_sync: new Date().toISOString()
      })
      .eq('id', integration.id);

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?integration_success=${provider}`);
  } catch (error) {
    console.error('API key integration error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?integration_error=unexpected_error`);
  }
}

// OAuth configuration for different providers
const OAUTH_CONFIGS = {
  gmail: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  loom: {
    authUrl: null, // API key based, no OAuth
    tokenUrl: null,
    scopes: ['read:videos', 'read:workspace'],
    clientId: process.env.LOOM_CLIENT_ID,
    clientSecret: process.env.LOOM_PRIVATE_KEY,
  },
  fireflies: {
    authUrl: null, // API key based, no OAuth
    tokenUrl: null,
    scopes: ['read:meetings', 'read:transcripts'],
    clientId: process.env.FIREFLIES_API_KEY,
    clientSecret: null,
  },
  slack: {
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['channels:read', 'chat:write', 'users:read'],
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
  },
  calendly: {
    authUrl: 'https://auth.calendly.com/oauth/authorize',
    tokenUrl: 'https://auth.calendly.com/oauth/token',
    scopes: ['default'],
    clientId: process.env.CALENDLY_CLIENT_ID,
    clientSecret: process.env.CALENDLY_CLIENT_SECRET,
  },
  zoom: {
    authUrl: 'https://zoom.us/oauth/authorize',
    tokenUrl: 'https://zoom.us/oauth/token',
    scopes: ['meeting:read', 'recording:read', 'user:read'],
    clientId: process.env.ZOOM_CLIENT_ID,
    clientSecret: process.env.ZOOM_CLIENT_SECRET,
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const provider = params.provider as keyof typeof OAUTH_CONFIGS;

    if (!OAUTH_CONFIGS[provider]) {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    const config = OAUTH_CONFIGS[provider];

    if (action === 'authorize') {
      // Special handling for API key based integrations (like Fireflies)
      if (!config.authUrl) {
        return handleApiKeyIntegration(provider, config);
      }

      // Step 1: Redirect to OAuth provider
      const state = crypto.randomUUID();
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/${provider}`;
      
      const authUrl = new URL(config.authUrl);
      authUrl.searchParams.set('client_id', config.clientId!);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', config.scopes.join(' '));
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('access_type', 'offline'); // For refresh tokens

      // Store state in session or database for validation
      return NextResponse.redirect(authUrl.toString());
    }

    // Step 2: Handle OAuth callback
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?integration_error=${error}`);
    }

    if (!code) {
      return NextResponse.json({ error: 'Authorization code not provided' }, { status: 400 });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId!,
        client_secret: config.clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/${provider}`,
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?integration_error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();

    // Get user info to identify the integration
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
    }

    // Store tokens securely
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', provider)
      .single();

    if (integrationError || !integration) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?integration_error=integration_not_found`);
    }

    // Store tokens
    const { error: tokenError } = await supabase
      .from('integration_tokens')
      .upsert({
        integration_id: integration.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_in 
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
        scope: config.scopes,
      });

    if (tokenError) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?integration_error=token_storage_failed`);
    }

    // Update integration status
    await supabase
      .from('integrations')
      .update({ 
        status: 'active',
        last_sync: new Date().toISOString()
      })
      .eq('id', integration.id);

    // Trigger initial sync
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/${integration.id}/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?integration_success=${provider}`);
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?integration_error=unexpected_error`);
  }
}