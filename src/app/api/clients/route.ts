import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { calculateClientHealthScore } from '@/lib/health-calculator';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    
    const supabase = createServerSupabase();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: clients, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clients });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }
    
    const supabase = createServerSupabase();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, company, phone, notes, tags, setupSpark } = body;

    // Special handling for Spark Shipping setup
    if (setupSpark === true) {
      // Check if Spark Shipping already exists
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('email', 'contact@sparkshipping.com')
        .single();

      if (existingClient) {
        return NextResponse.json({ 
          message: 'Spark Shipping already exists', 
          client: existingClient,
          alreadyExists: true 
        });
      }

      // Create Spark Shipping with full data
      const { data: sparkClient, error: sparkError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: 'Spark Shipping',
          email: 'contact@sparkshipping.com',
          company: 'Spark Shipping Inc',
          phone: '+1-555-SPARK',
          status: 'active',
          health_score: 0, // Will be calculated after client creation
          total_revenue: 45000.00,
          last_contact_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          next_follow_up: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Leading logistics company, excellent communication, potential for expansion',
          tags: ['logistics', 'shipping', 'enterprise', 'high-value'],
        })
        .select()
        .single();

      if (sparkError) {
        return NextResponse.json({ error: 'Failed to create Spark Shipping', details: sparkError }, { status: 500 });
      }

      // Add communication record
      await supabase.from('communications').insert({
        client_id: sparkClient.id,
        user_id: user.id,
        type: 'email',
        subject: 'Q1 Logistics Partnership Review',
        content: 'Thank you for the excellent service this quarter. Our shipping volumes have increased 25% and your team has handled everything perfectly. Looking forward to discussing expansion opportunities.',
        direction: 'inbound',
        sentiment_score: 0.9,
        sentiment_label: 'positive',
        communication_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      });

      // Add opportunity alert
      await supabase.from('alerts').insert({
        user_id: user.id,
        client_id: sparkClient.id,
        type: 'opportunity',
        title: 'Expansion Opportunity - Spark Shipping',
        description: 'Client mentioned 25% volume increase and interest in discussing expansion. Schedule follow-up meeting.',
        priority: 'high',
        status: 'active',
      });

      // Calculate and update health score
      try {
        const healthData = await calculateClientHealthScore(sparkClient.id, user.id);
        await supabase
          .from('clients')
          .update({ health_score: healthData.health_score })
          .eq('id', sparkClient.id);
        sparkClient.health_score = healthData.health_score;
      } catch (error) {
        console.error('Failed to calculate health score for Spark Shipping:', error);
      }

      return NextResponse.json({ 
        success: true,
        message: 'Spark Shipping created successfully!',
        client: sparkClient,
        userId: user.id
      }, { status: 201 });
    }

    // Regular client creation
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const { data: client, error } = await supabase
      .from('clients')
      .insert([
        {
          user_id: user.id,
          name,
          email,
          company,
          phone,
          notes,
          tags,
          status: 'active',
          health_score: 0, // Will be calculated after client creation
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate and update health score
    try {
      const healthData = await calculateClientHealthScore(client.id, user.id);
      await supabase
        .from('clients')
        .update({ health_score: healthData.health_score })
        .eq('id', client.id);
      client.health_score = healthData.health_score;
    } catch (error) {
      console.error('Failed to calculate health score for new client:', error);
    }

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}