import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client data
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id);

    if (clientsError) {
      console.error('Clients query error:', clientsError);
      return NextResponse.json({ error: 'Failed to fetch client data' }, { status: 500 });
    }

    // Get communications data
    const { data: communications, error: communicationsError } = await supabase
      .from('communications')
      .select('*')
      .eq('user_id', user.id)
      .order('communication_date', { ascending: false })
      .limit(50);

    if (communicationsError) {
      console.error('Communications query error:', communicationsError);
      return NextResponse.json({ error: 'Failed to fetch communication data' }, { status: 500 });
    }

    // Get alerts data
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (alertsError) {
      console.error('Alerts query error:', alertsError);
    }

    // Prepare data summary for AI analysis
    const dataContext = {
      clientCount: clients?.length || 0,
      clients: clients?.map(client => ({
        name: client.name,
        company: client.company,
        healthScore: client.health_score,
        revenue: client.total_revenue,
        status: client.status,
        tags: client.tags,
        lastContact: client.last_contact_date
      })) || [],
      recentCommunications: communications?.slice(0, 10).map(comm => ({
        type: comm.type,
        direction: comm.direction,
        sentimentScore: comm.sentiment_score,
        sentimentLabel: comm.sentiment_label,
        subject: comm.subject,
        date: comm.communication_date
      })) || [],
      totalCommunications: communications?.length || 0,
      avgSentiment: communications?.reduce((acc, comm) => acc + (comm.sentiment_score || 0.5), 0) / (communications?.length || 1) || 0.5,
      alerts: alerts?.map(alert => ({
        type: alert.type,
        title: alert.title,
        priority: alert.priority,
        status: alert.status
      })) || []
    };

    // Generate AI insights and recommendations
    const prompt = `Analyze this client relationship data and provide actionable business insights and recommendations.

    Business Context:
    - Total clients: ${dataContext.clientCount}
    - Total communications: ${dataContext.totalCommunications}  
    - Average sentiment score: ${(dataContext.avgSentiment * 100).toFixed(1)}%

    Client Data Summary:
    ${dataContext.clients.map(client => 
      `- ${client.name} (${client.company}): Health ${client.healthScore}/100, Revenue $${client.revenue}, Status: ${client.status}`
    ).slice(0, 10).join('\n')}

    Recent Communication Patterns:
    ${dataContext.recentCommunications.map(comm => 
      `- ${comm.type} (${comm.direction}): ${comm.sentimentLabel} sentiment (${(comm.sentimentScore * 100).toFixed(0)}%), Subject: "${comm.subject}"`
    ).slice(0, 8).join('\n')}

    Current Alerts:
    ${dataContext.alerts.map(alert => 
      `- ${alert.type}: ${alert.title} (${alert.priority} priority, ${alert.status})`
    ).slice(0, 5).join('\n')}

    Please provide:
    1. 4-6 specific insights about trends, risks, opportunities, or patterns
    2. 3-5 actionable recommendations with priority levels

    Format your response as JSON with this structure:
    {
      "insights": [
        {
          "type": "trend|pattern|risk|opportunity",
          "title": "Brief title",
          "description": "Detailed analysis and implications",
          "impact": "high|medium|low",
          "confidence": 75
        }
      ],
      "recommendations": [
        {
          "title": "Action title", 
          "description": "Detailed recommendation",
          "priority": "high|medium|low",
          "effort": "low|medium|high", 
          "impact": "high|medium|low",
          "category": "communication|retention|revenue|efficiency",
          "action_items": ["Step 1", "Step 2", "Step 3"]
        }
      ]
    }

    Base insights on real patterns in the data. Be specific and actionable.`;

    try {
      const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: prompt
        }]
      });

      const content = message.content[0];
      if (content.type === 'text') {
        // Try to parse the JSON response
        try {
          const aiResponse = JSON.parse(content.text);
          
          // Add IDs and timestamps to insights and recommendations
          const insights = aiResponse.insights?.map((insight: any, index: number) => ({
            id: `ai-insight-${Date.now()}-${index}`,
            ...insight,
            created_at: new Date().toISOString()
          })) || [];

          const recommendations = aiResponse.recommendations?.map((rec: any, index: number) => ({
            id: `ai-rec-${Date.now()}-${index}`,
            ...rec
          })) || [];

          return NextResponse.json({
            insights,
            recommendations
          });

        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          
          // Fallback: Create insights based on data patterns without AI
          const fallbackInsights = generateFallbackInsights(dataContext);
          const fallbackRecommendations = generateFallbackRecommendations(dataContext);
          
          return NextResponse.json({
            insights: fallbackInsights,
            recommendations: fallbackRecommendations
          });
        }
      }
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      
      // Fallback: Create insights based on data patterns
      const fallbackInsights = generateFallbackInsights(dataContext);
      const fallbackRecommendations = generateFallbackRecommendations(dataContext);
      
      return NextResponse.json({
        insights: fallbackInsights,
        recommendations: fallbackRecommendations
      });
    }

  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

function generateFallbackInsights(dataContext: any) {
  const insights = [];
  
  // Health score analysis
  const avgHealthScore = dataContext.clients.reduce((acc: number, client: any) => acc + (client.healthScore || 0), 0) / dataContext.clients.length || 0;
  
  if (avgHealthScore > 80) {
    insights.push({
      id: `insight-${Date.now()}-1`,
      type: 'trend',
      title: 'Strong Client Health Scores',
      description: `Your clients maintain an average health score of ${avgHealthScore.toFixed(1)}/100, indicating strong relationships and satisfaction levels.`,
      impact: 'medium',
      confidence: 90,
      created_at: new Date().toISOString()
    });
  } else if (avgHealthScore < 60) {
    insights.push({
      id: `insight-${Date.now()}-1`,
      type: 'risk',
      title: 'Low Client Health Scores Detected',
      description: `Average client health score is ${avgHealthScore.toFixed(1)}/100. Consider implementing proactive engagement strategies.`,
      impact: 'high',
      confidence: 85,
      created_at: new Date().toISOString()
    });
  }

  // Revenue analysis
  const totalRevenue = dataContext.clients.reduce((acc: number, client: any) => acc + (client.revenue || 0), 0);
  if (totalRevenue > 50000) {
    insights.push({
      id: `insight-${Date.now()}-2`,
      type: 'opportunity',
      title: 'Strong Revenue Base',
      description: `Total client revenue of $${totalRevenue.toLocaleString()} indicates a solid foundation for growth and expansion opportunities.`,
      impact: 'high',
      confidence: 95,
      created_at: new Date().toISOString()
    });
  }

  // Communication sentiment
  if (dataContext.avgSentiment > 0.7) {
    insights.push({
      id: `insight-${Date.now()}-3`,
      type: 'trend',
      title: 'Positive Communication Sentiment',
      description: `Communications maintain ${(dataContext.avgSentiment * 100).toFixed(1)}% positive sentiment, indicating strong client satisfaction.`,
      impact: 'medium',
      confidence: 80,
      created_at: new Date().toISOString()
    });
  }

  return insights;
}

function generateFallbackRecommendations(dataContext: any) {
  const recommendations = [];
  
  // Communication frequency recommendation
  if (dataContext.totalCommunications < dataContext.clientCount * 5) {
    recommendations.push({
      id: `rec-${Date.now()}-1`,
      title: 'Increase Communication Frequency',
      description: 'Regular communication helps maintain strong client relationships and identify opportunities early.',
      priority: 'high',
      effort: 'medium',
      impact: 'high',
      category: 'communication',
      action_items: [
        'Schedule weekly check-ins with top clients',
        'Set up automated follow-up reminders',
        'Create communication templates',
        'Track communication frequency metrics'
      ]
    });
  }

  // Health monitoring recommendation
  recommendations.push({
    id: `rec-${Date.now()}-2`,
    title: 'Implement Proactive Health Monitoring',
    description: 'Set up automated alerts for declining client health scores to address issues before they become problems.',
    priority: 'medium',
    effort: 'medium',
    impact: 'high',
    category: 'retention',
    action_items: [
      'Define health score thresholds',
      'Create automated alert rules',
      'Develop intervention playbooks',
      'Monitor health score trends'
    ]
  });

  return recommendations;
}