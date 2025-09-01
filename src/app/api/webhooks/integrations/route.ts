import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, supabaseAdmin } from '@/lib/supabase-server';
import { z } from 'zod';
import crypto from 'crypto';

// Webhook payload schemas for different providers
const gmailWebhookSchema = z.object({
  message: z.object({
    data: z.string(),
    messageId: z.string(),
    publishTime: z.string(),
  }),
  subscription: z.string(),
});

const loomWebhookSchema = z.object({
  event: z.string(),
  video: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    share_url: z.string(),
    created_at: z.string(),
    duration: z.number(),
  }),
});

const firefliesWebhookSchema = z.object({
  event: z.string(),
  transcript: z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string(),
    duration: z.number(),
    date: z.string(),
    participants: z.array(z.object({
      name: z.string(),
      email: z.string().optional(),
    })),
  }),
});

// Verify webhook signatures
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): boolean {
  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  
  // Handle different signature formats
  const normalizedSignature = signature.startsWith('sha256=') 
    ? signature.slice(7)
    : signature.startsWith('sha1=')
    ? signature.slice(5)
    : signature;

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(normalizedSignature, 'hex')
  );
}

// Gmail webhook handler
async function handleGmailWebhook(payload: any, integrationId: string, userId: string) {
  const supabase = supabaseAdmin;
  
  try {
    // Decode the Pub/Sub message
    const decodedData = JSON.parse(Buffer.from(payload.message.data, 'base64').toString());
    
    // Gmail webhook doesn't provide full message data, just notification
    // Trigger a sync instead
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/${integrationId}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to trigger sync');
    }

    return { success: true, action: 'sync_triggered' };
  } catch (error) {
    console.error('Gmail webhook error:', error);
    throw error;
  }
}

// Loom webhook handler
async function handleLoomWebhook(payload: any, integrationId: string, userId: string) {
  const supabase = supabaseAdmin;
  
  try {
    if (payload.event !== 'video.created' && payload.event !== 'video.updated') {
      return { success: true, action: 'ignored' };
    }

    // Get user's clients to match against
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, email')
      .eq('user_id', userId);

    // Simple client matching based on video name
    let clientId = null;
    const videoName = payload.video.name.toLowerCase();
    
    for (const client of clients || []) {
      if (client.name && videoName.includes(client.name.toLowerCase())) {
        clientId = client.id;
        break;
      }
      if (client.email && videoName.includes(client.email.toLowerCase())) {
        clientId = client.id;
        break;
      }
    }

    if (clientId) {
      // Check if activity already exists
      const { data: existing } = await supabase
        .from('external_activities')
        .select('id')
        .eq('integration_id', integrationId)
        .eq('external_id', payload.video.id)
        .single();

      if (!existing) {
        // Create new activity
        await supabase.from('external_activities').insert({
          client_id: clientId,
          integration_id: integrationId,
          external_id: payload.video.id,
          activity_type: 'video',
          title: payload.video.name,
          description: payload.video.description || '',
          duration_minutes: Math.round(payload.video.duration / 60),
          recording_url: payload.video.share_url,
          metadata: {
            videoId: payload.video.id,
            event: payload.event,
          },
          activity_date: new Date(payload.video.created_at).toISOString(),
        });

        return { success: true, action: 'activity_created' };
      } else {
        // Update existing activity
        await supabase
          .from('external_activities')
          .update({
            title: payload.video.name,
            description: payload.video.description || '',
            duration_minutes: Math.round(payload.video.duration / 60),
            recording_url: payload.video.share_url,
            metadata: {
              videoId: payload.video.id,
              event: payload.event,
            },
          })
          .eq('id', existing.id);

        return { success: true, action: 'activity_updated' };
      }
    }

    return { success: true, action: 'no_client_match' };
  } catch (error) {
    console.error('Loom webhook error:', error);
    throw error;
  }
}

// Fireflies webhook handler
async function handleFirefliesWebhook(payload: any, integrationId: string, userId: string) {
  const supabase = supabaseAdmin;
  
  try {
    if (payload.event !== 'transcript.completed') {
      return { success: true, action: 'ignored' };
    }

    // Get user's clients
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, email')
      .eq('user_id', userId);

    // Match by participant emails or names
    let clientId = null;
    for (const participant of payload.transcript.participants) {
      if (participant.email) {
        const client = clients?.find(c => c.email?.toLowerCase() === participant.email.toLowerCase());
        if (client) {
          clientId = client.id;
          break;
        }
      }
      if (participant.name) {
        const client = clients?.find(c => 
          c.name?.toLowerCase().includes(participant.name.toLowerCase()) ||
          participant.name.toLowerCase().includes(c.name?.toLowerCase())
        );
        if (client) {
          clientId = client.id;
          break;
        }
      }
    }

    if (clientId) {
      const { data: existing } = await supabase
        .from('external_activities')
        .select('id')
        .eq('integration_id', integrationId)
        .eq('external_id', payload.transcript.id)
        .single();

      if (!existing) {
        await supabase.from('external_activities').insert({
          client_id: clientId,
          integration_id: integrationId,
          external_id: payload.transcript.id,
          activity_type: 'call',
          title: payload.transcript.title,
          description: payload.transcript.summary,
          participants: payload.transcript.participants.map((p: any) => p.email || p.name).filter(Boolean),
          duration_minutes: Math.round(payload.transcript.duration / 60),
          metadata: {
            transcriptId: payload.transcript.id,
            event: payload.event,
          },
          activity_date: new Date(payload.transcript.date).toISOString(),
        });

        return { success: true, action: 'activity_created' };
      }
    }

    return { success: true, action: 'no_client_match' };
  } catch (error) {
    console.error('Fireflies webhook error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const integrationId = searchParams.get('integration_id');

    if (!provider || !integrationId) {
      return NextResponse.json({ error: 'Missing provider or integration_id' }, { status: 400 });
    }

    // Get request body and headers
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || 
                     request.headers.get('x-loom-signature') || 
                     request.headers.get('x-fireflies-signature') || '';

    // Get integration details for verification
    const supabase = supabaseAdmin;
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('user_id, config')
      .eq('id', integrationId)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Verify webhook signature (if configured)
    const webhookSecret = integration.config?.webhook_secret;
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(body);
    let result;

    // Route to appropriate handler
    switch (provider) {
      case 'gmail':
        const gmailPayload = gmailWebhookSchema.parse(payload);
        result = await handleGmailWebhook(gmailPayload, integrationId, integration.user_id);
        break;
        
      case 'loom':
        const loomPayload = loomWebhookSchema.parse(payload);
        result = await handleLoomWebhook(loomPayload, integrationId, integration.user_id);
        break;
        
      case 'fireflies':
        const firefliesPayload = firefliesWebhookSchema.parse(payload);
        result = await handleFirefliesWebhook(firefliesPayload, integrationId, integration.user_id);
        break;
        
      default:
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Webhook error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payload format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}