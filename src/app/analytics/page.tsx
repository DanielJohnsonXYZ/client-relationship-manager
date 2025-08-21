'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RevenueChart } from '@/components/analytics/revenue-chart';
import { CommunicationChart } from '@/components/analytics/communication-chart';
import { SentimentChart } from '@/components/analytics/sentiment-chart';
import { HealthScoreDistribution } from '@/components/analytics/health-score-distribution';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/analytics?timeRange=${timeRange}`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Error loading analytics data</div>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!analyticsData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-gray-600">No analytics data available</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">
              Insights into your client relationships and communication patterns
            </p>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Avg Response Time</h3>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.metrics.avgResponseTime}</p>
            <p className="text-xs text-green-600 mt-1">↓ 12% from last month</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Client Satisfaction</h3>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.metrics.clientSatisfaction}</p>
            <p className="text-xs text-green-600 mt-1">↑ 3% from last month</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Renewal Rate</h3>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.metrics.renewalRate}</p>
            <p className="text-xs text-green-600 mt-1">↑ 2% from last month</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Communications</h3>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.metrics.totalCommunications.toLocaleString()}</p>
            <p className="text-xs text-blue-600 mt-1">↑ 15% from last month</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
            <RevenueChart data={analyticsData.revenue} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Types</h3>
            <CommunicationChart data={analyticsData.communications} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sentiment Analysis</h3>
            <SentimentChart data={analyticsData.sentiment} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Health Score Distribution</h3>
            <HealthScoreDistribution data={analyticsData.healthDistribution} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}