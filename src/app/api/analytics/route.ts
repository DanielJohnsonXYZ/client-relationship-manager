import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate date range
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Get revenue data by month from clients
    const { data: revenueData, error: revenueError } = await supabase
      .from('clients')
      .select('total_revenue, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    if (revenueError) {
      console.error('Revenue query error:', revenueError);
    }

    // Get communication data
    const { data: communicationsData, error: commError } = await supabase
      .from('communications')
      .select('type, sentiment_score, sentiment_label, communication_date')
      .eq('user_id', user.id)
      .gte('communication_date', startDate.toISOString());

    if (commError) {
      console.error('Communications query error:', commError);
    }

    // Get health score distribution
    const { data: healthData, error: healthError } = await supabase
      .from('clients')
      .select('health_score')
      .eq('user_id', user.id);

    if (healthError) {
      console.error('Health query error:', healthError);
    }

    // Process revenue data into monthly buckets
    const revenueByMonth = {};
    const monthLabels = [];
    for (let i = daysAgo === 365 ? 12 : 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
      revenueByMonth[monthKey] = 0;
      monthLabels.push(monthLabel);
    }

    // Aggregate revenue data
    revenueData?.forEach(client => {
      const monthKey = client.created_at.slice(0, 7);
      if (revenueByMonth[monthKey] !== undefined) {
        revenueByMonth[monthKey] += client.total_revenue || 0;
      }
    });

    // Process communication types
    const communicationTypes = {
      'email': 0,
      'call': 0, 
      'meeting': 0,
      'slack': 0,
      'other': 0
    };

    communicationsData?.forEach(comm => {
      const type = comm.type || 'other';
      if (communicationTypes[type] !== undefined) {
        communicationTypes[type]++;
      } else {
        communicationTypes['other']++;
      }
    });

    // Process sentiment data by month
    const sentimentByMonth = {};
    monthLabels.forEach(month => {
      sentimentByMonth[month] = { positive: 0, neutral: 0, negative: 0, total: 0 };
    });

    communicationsData?.forEach(comm => {
      const commDate = new Date(comm.communication_date);
      const monthLabel = commDate.toLocaleDateString('en-US', { month: 'short' });
      if (sentimentByMonth[monthLabel]) {
        const sentiment = comm.sentiment_label || 'neutral';
        sentimentByMonth[monthLabel][sentiment]++;
        sentimentByMonth[monthLabel].total++;
      }
    });

    // Convert to percentages
    const sentimentPercentages = {
      positive: [],
      neutral: [],
      negative: []
    };

    monthLabels.forEach(month => {
      const data = sentimentByMonth[month];
      const total = data.total || 1; // Avoid division by zero
      sentimentPercentages.positive.push(Math.round((data.positive / total) * 100));
      sentimentPercentages.neutral.push(Math.round((data.neutral / total) * 100));
      sentimentPercentages.negative.push(Math.round((data.negative / total) * 100));
    });

    // Process health score distribution
    const healthBuckets = [0, 0, 0, 0, 0]; // 0-20, 21-40, 41-60, 61-80, 81-100
    healthData?.forEach(client => {
      const score = client.health_score || 0;
      const bucket = Math.min(4, Math.floor(score / 20));
      healthBuckets[bucket]++;
    });

    // Calculate metrics
    const totalCommunications = communicationsData?.length || 0;
    const avgSentiment = communicationsData?.reduce((acc, comm) => acc + (comm.sentiment_score || 0.5), 0) / totalCommunications || 0.5;
    const clientSatisfaction = Math.round(avgSentiment * 100);
    const avgHealthScore = healthData?.reduce((acc, client) => acc + (client.health_score || 0), 0) / (healthData?.length || 1);
    const renewalRate = Math.min(100, Math.round(avgHealthScore * 1.2)); // Estimated based on health score

    // Calculate average response time (mock for now, would need actual response time tracking)
    const avgResponseTime = totalCommunications > 10 ? '2.1 hours' : totalCommunications > 5 ? '3.2 hours' : '4.5 hours';

    const analyticsData = {
      revenue: {
        labels: monthLabels,
        data: Object.values(revenueByMonth)
      },
      communications: {
        labels: ['Email', 'Calls', 'Meetings', 'Slack', 'Other'],
        data: [
          communicationTypes.email,
          communicationTypes.call,
          communicationTypes.meeting,
          communicationTypes.slack,
          communicationTypes.other
        ]
      },
      sentiment: {
        labels: monthLabels,
        positive: sentimentPercentages.positive,
        neutral: sentimentPercentages.neutral,
        negative: sentimentPercentages.negative
      },
      healthDistribution: {
        labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
        data: healthBuckets
      },
      metrics: {
        avgResponseTime,
        clientSatisfaction: `${clientSatisfaction}%`,
        renewalRate: `${renewalRate}%`,
        totalCommunications
      }
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}