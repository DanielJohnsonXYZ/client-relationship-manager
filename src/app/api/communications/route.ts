import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const direction = searchParams.get('direction');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Base query - join communications with clients to get client info
    let query = supabase
      .from('communications')
      .select(`
        id,
        client_id,
        type,
        subject,
        content,
        direction,
        communication_date,
        sentiment_score,
        sentiment_label,
        clients!inner(
          name,
          company
        )
      `)
      .eq('user_id', user.id)
      .order('communication_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (direction && direction !== 'all') {
      query = query.eq('direction', direction);
    }

    const { data: communications, error } = await query;

    if (error) {
      console.error('Communications query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to flatten client info
    const formattedCommunications = communications?.map(comm => ({
      id: comm.id,
      client_id: comm.client_id,
      client_name: (comm.clients as any)?.name || 'Unknown Client',
      client_company: (comm.clients as any)?.company || null,
      type: comm.type,
      subject: comm.subject,
      content: comm.content,
      direction: comm.direction,
      communication_date: comm.communication_date,
      sentiment_score: comm.sentiment_score,
      sentiment_label: comm.sentiment_label,
    })) || [];

    return NextResponse.json({ 
      communications: formattedCommunications,
      total: formattedCommunications.length 
    });

  } catch (error) {
    console.error('Communications API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      client_id, 
      type, 
      subject, 
      content, 
      direction,
      communication_date,
      sentiment_score,
      sentiment_label 
    } = body;

    // Validate required fields
    if (!client_id || !type || !direction) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id, type, direction' },
        { status: 400 }
      );
    }

    // Create the communication record
    const { data: communication, error } = await supabase
      .from('communications')
      .insert({
        user_id: user.id,
        client_id,
        type,
        subject,
        content,
        direction,
        communication_date: communication_date || new Date().toISOString(),
        sentiment_score,
        sentiment_label,
      })
      .select(`
        id,
        client_id,
        type,
        subject,
        content,
        direction,
        communication_date,
        sentiment_score,
        sentiment_label,
        clients!inner(
          name,
          company
        )
      `)
      .single();

    if (error) {
      console.error('Communication creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format response
    const formattedCommunication = {
      id: communication.id,
      client_id: communication.client_id,
      client_name: (communication.clients as any)?.name || 'Unknown Client',
      client_company: (communication.clients as any)?.company || null,
      type: communication.type,
      subject: communication.subject,
      content: communication.content,
      direction: communication.direction,
      communication_date: communication.communication_date,
      sentiment_score: communication.sentiment_score,
      sentiment_label: communication.sentiment_label,
    };

    return NextResponse.json({ communication: formattedCommunication }, { status: 201 });

  } catch (error) {
    console.error('Communication creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}