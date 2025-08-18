import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

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

    // Get dashboard metrics
    const [clientsResult, alertsResult, communicationsResult] = await Promise.all([
      // Clients overview
      supabase
        .from('clients')
        .select('status, health_score, total_revenue')
        .eq('user_id', user.id),
      
      // Active alerts
      supabase
        .from('alerts')
        .select('type, priority, status')
        .eq('user_id', user.id)
        .eq('status', 'active'),
      
      // Recent communications
      supabase
        .from('communications')
        .select('type, sentiment_score, communication_date')
        .eq('user_id', user.id)
        .gte('communication_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('communication_date', { ascending: false })
        .limit(100)
    ]);

    if (clientsResult.error || alertsResult.error || communicationsResult.error) {
      return NextResponse.json(
        { error: 'Failed to fetch dashboard data' },
        { status: 500 }
      );
    }

    const clients = clientsResult.data || [];
    const alerts = alertsResult.data || [];
    const communications = communicationsResult.data || [];

    // Calculate metrics
    const totalClients = clients.length;
    const healthyClients = clients.filter(c => c.health_score >= 70).length;
    const atRiskClients = clients.filter(c => c.health_score < 50).length;
    const totalRevenue = clients.reduce((sum, c) => sum + (c.total_revenue || 0), 0);
    
    const averageHealthScore = totalClients > 0 
      ? clients.reduce((sum, c) => sum + c.health_score, 0) / totalClients 
      : 0;

    // Client status breakdown
    const statusBreakdown = {
      active: clients.filter(c => c.status === 'active').length,
      at_risk: clients.filter(c => c.status === 'at_risk').length,
      inactive: clients.filter(c => c.status === 'inactive').length,
      churned: clients.filter(c => c.status === 'churned').length,
    };

    // Alert breakdown
    const alertBreakdown = {
      critical: alerts.filter(a => a.priority === 'critical').length,
      high: alerts.filter(a => a.priority === 'high').length,
      medium: alerts.filter(a => a.priority === 'medium').length,
      low: alerts.filter(a => a.priority === 'low').length,
    };

    // Communication sentiment breakdown
    const sentimentBreakdown = {
      positive: communications.filter(c => c.sentiment_score > 0.1).length,
      neutral: communications.filter(c => c.sentiment_score >= -0.1 && c.sentiment_score <= 0.1).length,
      negative: communications.filter(c => c.sentiment_score < -0.1).length,
    };

    // Health score trend (mock data for now)
    const healthTrend = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      score: Math.floor(averageHealthScore + Math.random() * 20 - 10)
    }));

    const dashboardData = {
      overview: {
        totalClients,
        healthyClients,
        atRiskClients,
        totalRevenue,
        averageHealthScore,
      },
      statusBreakdown,
      alertBreakdown,
      sentimentBreakdown,
      healthTrend,
      recentAlerts: alerts.slice(0, 5),
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}