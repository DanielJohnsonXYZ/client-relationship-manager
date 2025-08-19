import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { z } from 'zod';

const createIntegrationSchema = z.object({
  type: z.enum(['gmail', 'loom', 'fireflies', 'zoom', 'calendly', 'slack', 'teams', 'hubspot', 'salesforce']),
  name: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: integrations, error } = await supabase
      .from('integrations')
      .select(`
        *,
        integration_sync_logs (
          status,
          sync_completed_at,
          records_processed
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    return NextResponse.json({ integrations });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createIntegrationSchema.parse(body);

    // Check if integration already exists
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', validatedData.type)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Integration already exists' }, { status: 409 });
    }

    const { data: integration, error } = await supabase
      .from('integrations')
      .insert({
        user_id: user.id,
        type: validatedData.type,
        name: validatedData.name,
        status: 'inactive', // Will be activated after OAuth
        config: {}
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 });
    }

    return NextResponse.json({ integration });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}