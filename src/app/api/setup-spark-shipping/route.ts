import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Spark Shipping already exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .eq('email', 'contact@sparkshipping.com')
      .single();

    if (existingClient) {
      return NextResponse.json({ message: 'Spark Shipping already exists', clientId: existingClient.id });
    }

    // Add Spark Shipping client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: 'Spark Shipping',
        email: 'contact@sparkshipping.com',
        company: 'Spark Shipping Inc',
        phone: '+1-555-SPARK',
        status: 'active',
        health_score: 88,
        total_revenue: 45000.00,
        last_contact_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        next_follow_up: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Leading logistics company, excellent communication, potential for expansion',
        tags: ['logistics', 'shipping', 'enterprise', 'high-value'],
      })
      .select()
      .single();

    if (clientError) {
      return NextResponse.json({ error: 'Failed to create client', details: clientError }, { status: 500 });
    }

    // Add communication record
    const { error: commError } = await supabase
      .from('communications')
      .insert({
        client_id: client.id,
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
    const { error: alertError } = await supabase
      .from('alerts')
      .insert({
        user_id: user.id,
        client_id: client.id,
        type: 'opportunity',
        title: 'Expansion Opportunity - Spark Shipping',
        description: 'Client mentioned 25% volume increase and interest in discussing expansion. Schedule follow-up meeting.',
        priority: 'high',
        status: 'active',
      });

    return NextResponse.json({
      success: true,
      message: 'Spark Shipping client created successfully',
      client: client,
      hasCommError: !!commError,
      hasAlertError: !!alertError,
      userId: user.id
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}