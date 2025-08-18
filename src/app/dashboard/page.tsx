'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MetricCard } from '@/components/dashboard/metric-card';
import { HealthTrendChart } from '@/components/dashboard/health-trend-chart';
import { AlertsList } from '@/components/dashboard/alerts-list';
import { ClientStatusChart } from '@/components/dashboard/client-status-chart';

interface DashboardData {
  overview: {
    totalClients: number;
    healthyClients: number;
    atRiskClients: number;
    totalRevenue: number;
    averageHealthScore: number;
  };
  statusBreakdown: {
    active: number;
    at_risk: number;
    inactive: number;
    churned: number;
  };
  alertBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  healthTrend: Array<{
    date: string;
    score: number;
  }>;
  recentAlerts: Array<{
    id: string;
    title: string;
    priority: string;
    created_at: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load dashboard data</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your client relationships and key metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Clients"
            value={data.overview.totalClients}
            change={+5.2}
            changeType="positive"
          />
          <MetricCard
            title="Healthy Clients"
            value={data.overview.healthyClients}
            change={+2.1}
            changeType="positive"
          />
          <MetricCard
            title="At Risk"
            value={data.overview.atRiskClients}
            change={-1.3}
            changeType="negative"
          />
          <MetricCard
            title="Total Revenue"
            value={`$${data.overview.totalRevenue.toLocaleString()}`}
            change={+12.3}
            changeType="positive"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Health Score Trend
            </h3>
            <HealthTrendChart data={data.healthTrend} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Client Status
            </h3>
            <ClientStatusChart data={data.statusBreakdown} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Recent Alerts
              </h3>
              <AlertsList alerts={data.recentAlerts} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Alert Summary
            </h3>
            <div className="space-y-3">
              {Object.entries(data.alertBreakdown).map(([priority, count]) => (
                <div key={priority} className="flex justify-between">
                  <span className="capitalize text-sm text-gray-600">
                    {priority}
                  </span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}