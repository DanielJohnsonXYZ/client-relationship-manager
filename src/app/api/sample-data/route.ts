import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

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
        message: 'Sample data already exists',
        skipReason: 'User already has clients'
      });
    }

    // Create sample clients
    const sampleClients = [
      {
        user_id: user.id,
        name: 'Sarah Chen',
        email: 'sarah.chen@techcorp.com',
        company: 'TechCorp Solutions',
        phone: '+1-555-0123',
        status: 'active',
        health_score: 85,
        total_revenue: 45000,
        last_contact_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        next_follow_up: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
        total_revenue: 28000,
        last_contact_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        next_follow_up: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
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
        total_revenue: 15000,
        last_contact_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        next_follow_up: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Has been quiet recently. Need to schedule a check-in call to understand their needs.',
        tags: ['consulting', 'at-risk', 'follow-up-needed'],
      },
      {
        user_id: user.id,
        name: 'David Kim',
        email: 'david@ecommercehub.com',
        company: 'E-commerce Hub',
        phone: '+1-555-0321',
        status: 'active',
        health_score: 91,
        total_revenue: 65000,
        last_contact_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        next_follow_up: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Excellent partnership. Always looking for new opportunities to collaborate.',
        tags: ['ecommerce', 'partnership', 'high-value'],
      },
      {
        user_id: user.id,
        name: 'Lisa Thompson',
        email: 'lisa@marketingagency.net',
        company: 'Creative Marketing Agency',
        phone: '+1-555-0654',
        status: 'inactive',
        health_score: 30,
        total_revenue: 8000,
        last_contact_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        next_follow_up: null,
        notes: 'Project completed 2 months ago. Potential for future work if their business grows.',
        tags: ['marketing', 'completed', 'potential'],
      }
    ];

    // Insert sample clients
    const { data: createdClients, error: clientError } = await supabase
      .from('clients')
      .insert(sampleClients)
      .select();

    if (clientError) {
      throw new Error(`Failed to create clients: ${clientError.message}`);
    }

    // Create sample communications for each client
    const sampleCommunications = [];
    const sentimentLabels = ['positive', 'neutral', 'negative'];
    const communicationTypes = ['email', 'call', 'meeting'];
    
    for (const client of createdClients || []) {
      // Create 3-8 communications per client
      const commCount = Math.floor(Math.random() * 6) + 3;
      
      for (let i = 0; i < commCount; i++) {
        const daysAgo = Math.floor(Math.random() * 60) + 1; // Random date within 60 days
        const sentiment = sentimentLabels[Math.floor(Math.random() * sentimentLabels.length)];
        const sentimentScore = sentiment === 'positive' ? Math.random() * 0.5 + 0.5 : 
                              sentiment === 'negative' ? Math.random() * 0.5 - 0.5 : 
                              Math.random() * 0.2 - 0.1;
        
        sampleCommunications.push({
          user_id: user.id,
          client_id: client.id,
          type: communicationTypes[Math.floor(Math.random() * communicationTypes.length)],
          subject: getSampleSubject(client.name),
          content: getSampleContent(sentiment),
          direction: Math.random() > 0.5 ? 'inbound' : 'outbound',
          sentiment_score: sentimentScore,
          sentiment_label: sentiment,
          communication_date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    // Insert sample communications
    const { error: commError } = await supabase
      .from('communications')
      .insert(sampleCommunications);

    if (commError) {
      throw new Error(`Failed to create communications: ${commError.message}`);
    }

    // Create sample alerts
    const sampleAlerts = [
      {
        user_id: user.id,
        client_id: createdClients?.find(c => c.name === 'Jennifer Walsh')?.id,
        type: 'health_decline',
        title: 'Client Health Score Declining',
        description: 'Jennifer Walsh at ConsultingPro LLC has not been in touch for 3 weeks. Health score dropped to 45%.',
        priority: 'high',
        status: 'active',
      },
      {
        user_id: user.id,
        client_id: createdClients?.find(c => c.name === 'Mike Rodriguez')?.id,
        type: 'follow_up',
        title: 'Scheduled Follow-up Due',
        description: 'Follow-up call scheduled with Mike Rodriguez at Startup Venture Inc is due in 2 days.',
        priority: 'medium',
        status: 'active',
      },
      {
        user_id: user.id,
        client_id: createdClients?.find(c => c.name === 'David Kim')?.id,
        type: 'opportunity',
        title: 'Upsell Opportunity',
        description: 'David Kim mentioned interest in additional services during last meeting.',
        priority: 'medium',
        status: 'active',
      }
    ];

    // Insert sample alerts
    const { error: alertError } = await supabase
      .from('alerts')
      .insert(sampleAlerts.filter(alert => alert.client_id)); // Only insert alerts with valid client_id

    if (alertError) {
      console.warn('Failed to create some alerts:', alertError.message);
      // Don't fail the entire request if alerts fail
    }

    // Update client health scores using the real calculation
    if (createdClients) {
      try {
        const { calculateClientHealthScore } = await import('@/lib/health-calculator');
        
        for (const client of createdClients) {
          try {
            const healthData = await calculateClientHealthScore(client.id, user.id);
            await supabase
              .from('clients')
              .update({ health_score: healthData.health_score })
              .eq('id', client.id);
          } catch (error) {
            console.error(`Failed to calculate health score for client ${client.id}:`, error);
          }
        }
      } catch (error) {
        console.error('Failed to import health calculator:', error);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Sample data created successfully!',
      data: {
        clients: createdClients?.length || 0,
        communications: sampleCommunications.length,
        alerts: sampleAlerts.length
      }
    });

  } catch (error) {
    console.error('Sample data creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create sample data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getSampleSubject(clientName: string): string {
  const subjects = [
    `Monthly check-in with ${clientName}`,
    'Project update and next steps',
    'Q4 planning discussion',
    'Invoice and payment follow-up',
    'New service proposal',
    'Meeting recap and action items',
    'Contract renewal discussion',
    'Performance review results',
    'Budget planning for next quarter',
    'Strategic partnership opportunities'
  ];
  
  return subjects[Math.floor(Math.random() * subjects.length)];
}

function getSampleContent(sentiment: string): string {
  const positiveContent = [
    "Thanks for the excellent work on this project! Everything looks great and we're very satisfied with the results.",
    "Really appreciate your quick response and attention to detail. Looking forward to continuing our partnership.",
    "The deliverables exceeded our expectations. We'd like to discuss expanding the scope for next quarter."
  ];
  
  const neutralContent = [
    "Following up on our previous discussion about the project timeline and deliverables.",
    "Please find attached the updated requirements document for your review.",
    "Let's schedule a meeting next week to go over the quarterly performance metrics."
  ];
  
  const negativeContent = [
    "We've encountered some issues with the recent delivery and need to discuss how to resolve them.",
    "The project seems to be falling behind schedule. Can we set up a call to discuss the timeline?",
    "We're not entirely satisfied with the current progress and would like to review our options."
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