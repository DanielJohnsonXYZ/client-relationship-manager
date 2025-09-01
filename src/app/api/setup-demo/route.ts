import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { updateAllClientHealthScores } from '@/lib/health-calculator';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has clients
    const { data: existingClients } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (existingClients && existingClients.length > 0) {
      return NextResponse.json({ 
        success: true,
        message: 'Demo data already exists',
        skipReason: 'User already has clients'
      });
    }

    // Create comprehensive sample data including Spark Shipping
    const sampleClients = [
      // Spark Shipping - the premium client
      {
        user_id: user.id,
        name: 'Charles Spark',
        email: 'charles@sparkshipping.com',
        company: 'Spark Shipping Inc',
        phone: '+1-555-SPARK',
        status: 'active',
        health_score: 88,
        total_revenue: 45000,
        last_contact_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        next_follow_up: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Leading logistics company, excellent communication, potential for expansion. Mentioned 25% volume increase.',
        tags: ['logistics', 'shipping', 'enterprise', 'high-value'],
      },
      // Other sample clients
      {
        user_id: user.id,
        name: 'Sarah Chen',
        email: 'sarah.chen@techcorp.com',
        company: 'TechCorp Solutions',
        phone: '+1-555-0123',
        status: 'active',
        health_score: 85,
        total_revenue: 32000,
        last_contact_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        next_follow_up: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Great client, always responsive and pays on time. Looking to expand their service package.',
        tags: ['enterprise', 'tech', 'high-value'],
      },
      {
        user_id: user.id,
        name: 'Mike Rodriguez',
        email: 'mike@startupventure.io',
        company: 'Startup Venture Inc',
        phone: '+1-555-0456',
        status: 'active',
        health_score: 72,
        total_revenue: 18000,
        last_contact_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        next_follow_up: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Fast-growing startup, occasional payment delays but good long-term potential.',
        tags: ['startup', 'growth', 'potential'],
      },
      {
        user_id: user.id,
        name: 'Jennifer Walsh',
        email: 'j.walsh@consultingpro.com',
        company: 'ConsultingPro LLC',
        phone: '+1-555-0789',
        status: 'at_risk',
        health_score: 45,
        total_revenue: 12000,
        last_contact_date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        next_follow_up: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Has been quiet recently. Need to schedule a check-in call to understand their needs.',
        tags: ['consulting', 'at-risk', 'follow-up-needed'],
      },
    ];

    // Insert sample clients
    const { data: createdClients, error: clientError } = await supabase
      .from('clients')
      .insert(sampleClients)
      .select();

    if (clientError) {
      throw new Error(`Failed to create clients: ${clientError.message}`);
    }

    // Get the Spark Shipping client
    const sparkClient = createdClients?.find(c => c.company === 'Spark Shipping Inc');

    // Create detailed communications for better metrics
    const sampleCommunications = [
      // Spark Shipping communications (multiple for good health score)
      {
        user_id: user.id,
        client_id: sparkClient?.id,
        type: 'email',
        subject: 'Q1 Logistics Partnership Review',
        content: 'Thank you for the excellent service this quarter. Our shipping volumes have increased 25% and your team has handled everything perfectly. Looking forward to discussing expansion opportunities.',
        direction: 'inbound',
        sentiment_score: 0.9,
        sentiment_label: 'positive',
        communication_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: user.id,
        client_id: sparkClient?.id,
        type: 'call',
        subject: 'Weekly Check-in Call',
        content: 'Great call today! Charles confirmed the 25% volume increase and expressed interest in expanding to West Coast operations. Scheduled follow-up for next week.',
        direction: 'outbound',
        sentiment_score: 0.8,
        sentiment_label: 'positive',
        communication_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: user.id,
        client_id: sparkClient?.id,
        type: 'meeting',
        subject: 'Quarterly Business Review',
        content: 'Excellent QBR session. Reviewed performance metrics, discussed expansion plans, and alignment on Q2 goals. Very positive feedback on our service quality.',
        direction: 'outbound',
        sentiment_score: 0.85,
        sentiment_label: 'positive',
        communication_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Add communications for other clients
    for (const client of createdClients || []) {
      if (client.id === sparkClient?.id) continue; // Already handled Spark Shipping
      
      const commCount = client.status === 'at_risk' ? 2 : Math.floor(Math.random() * 4) + 3;
      
      for (let i = 0; i < commCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30) + 1;
        const sentiment = client.status === 'at_risk' ? 'neutral' : 
                         Math.random() > 0.7 ? 'positive' : 
                         Math.random() > 0.8 ? 'negative' : 'neutral';
        const sentimentScore = sentiment === 'positive' ? Math.random() * 0.5 + 0.5 : 
                              sentiment === 'negative' ? Math.random() * 0.5 - 0.5 : 
                              Math.random() * 0.2 - 0.1;
        
        sampleCommunications.push({
          user_id: user.id,
          client_id: client.id,
          type: ['email', 'call', 'meeting'][Math.floor(Math.random() * 3)],
          subject: getSampleSubject(client.name),
          content: getSampleContent(sentiment),
          direction: Math.random() > 0.5 ? 'inbound' : 'outbound',
          sentiment_score: sentimentScore,
          sentiment_label: sentiment,
          communication_date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    // Insert all communications
    const { error: commError } = await supabase
      .from('communications')
      .insert(sampleCommunications);

    if (commError) {
      throw new Error(`Failed to create communications: ${commError.message}`);
    }

    // Create sample alerts including Spark Shipping opportunity
    const sampleAlerts = [
      {
        user_id: user.id,
        client_id: sparkClient?.id,
        type: 'opportunity',
        title: 'Expansion Opportunity - Spark Shipping',
        description: 'Client mentioned 25% volume increase and interest in West Coast expansion. High-value opportunity worth $15K+ additional revenue.',
        priority: 'high',
        status: 'active',
      },
      {
        user_id: user.id,
        client_id: createdClients?.find(c => c.name === 'Jennifer Walsh')?.id,
        type: 'low_engagement',
        title: 'Client Health Score Declining',
        description: 'Jennifer Walsh at ConsultingPro LLC has not been in touch for 18 days. Health score dropped below 50%.',
        priority: 'high',
        status: 'active',
      },
      {
        user_id: user.id,
        client_id: createdClients?.find(c => c.name === 'Mike Rodriguez')?.id,
        type: 'follow_up_needed',
        title: 'Scheduled Follow-up Due',
        description: 'Follow-up call with Mike Rodriguez at Startup Venture Inc is due soon. Great growth potential.',
        priority: 'medium',
        status: 'active',
      },
    ];

    // Insert sample alerts
    const { error: alertError } = await supabase
      .from('alerts')
      .insert(sampleAlerts.filter(alert => alert.client_id));

    if (alertError) {
      console.warn('Failed to create some alerts:', alertError.message);
    }

    // Calculate and update health scores for all clients
    try {
      await updateAllClientHealthScores(user.id);
    } catch (error) {
      console.error('Failed to update health scores:', error);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Demo data created successfully! You now have sample clients with realistic data.',
      data: {
        clients: createdClients?.length || 0,
        communications: sampleCommunications.length,
        alerts: sampleAlerts.length,
        sparkShippingIncluded: true
      }
    });

  } catch (error) {
    console.error('Demo setup error:', error);
    return NextResponse.json(
      { error: 'Failed to create demo data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getSampleSubject(clientName: string): string {
  const subjects = [
    `Monthly check-in with ${clientName}`,
    'Project update and next steps',
    'Q1 planning discussion', 
    'Performance review results',
    'New service proposal',
    'Meeting recap and action items',
    'Budget planning session',
    'Strategic partnership discussion'
  ];
  
  return subjects[Math.floor(Math.random() * subjects.length)];
}

function getSampleContent(sentiment: string): string {
  const positiveContent = [
    "Thanks for the excellent work on this project! Everything looks great and we're very satisfied with the results.",
    "Really appreciate your quick response and attention to detail. Looking forward to continuing our partnership.",
    "The deliverables exceeded our expectations. We'd like to discuss expanding the scope."
  ];
  
  const neutralContent = [
    "Following up on our previous discussion about the project timeline and deliverables.",
    "Please find attached the updated requirements document for your review.",
    "Let's schedule a meeting next week to go over the quarterly performance metrics."
  ];
  
  const negativeContent = [
    "We've encountered some issues with the recent delivery and need to discuss how to resolve them.",
    "The project seems to be falling behind schedule. Can we set up a call to discuss?",
    "We need to review our current arrangement and discuss some concerns we have."
  ];
  
  let contentArray;
  switch (sentiment) {
    case 'positive':
      contentArray = positiveContent;
      break;
    case 'negative':
      contentArray = negativeContent;
      break;
    default:
      contentArray = neutralContent;
  }
  
  return contentArray[Math.floor(Math.random() * contentArray.length)];
}