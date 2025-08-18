'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { InsightCard } from '@/components/insights/insight-card';
import { RecommendationCard } from '@/components/insights/recommendation-card';
import { LightBulbIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface Insight {
  id: string;
  type: 'trend' | 'pattern' | 'risk' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  created_at: string;
  data?: any;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'high' | 'medium' | 'low';
  category: 'communication' | 'retention' | 'revenue' | 'efficiency';
  action_items: string[];
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations'>('insights');

  // Mock AI-generated insights
  useEffect(() => {
    const mockInsights: Insight[] = [
      {
        id: '1',
        type: 'trend',
        title: 'Communication Response Times Improving',
        description: 'Your average response time to client emails has improved by 23% over the last month. Clients with faster response times show 15% higher satisfaction scores.',
        impact: 'medium',
        confidence: 85,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'risk',
        title: 'Client Health Score Declining',
        description: 'Three high-value clients show declining health scores. Common factors include reduced communication frequency and delayed project deliverables.',
        impact: 'high',
        confidence: 92,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        type: 'opportunity',
        title: 'Upselling Potential Identified',
        description: 'Five clients have mentioned expansion or additional services in recent communications. Combined potential value: $45,000.',
        impact: 'high',
        confidence: 78,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        type: 'pattern',
        title: 'Friday Communications Peak',
        description: 'Client communications peak on Fridays at 2-4 PM. Consider scheduling important updates during this window for better engagement.',
        impact: 'low',
        confidence: 88,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const mockRecommendations: Recommendation[] = [
      {
        id: '1',
        title: 'Implement Weekly Check-ins',
        description: 'Establish regular weekly check-ins with your top 5 clients to maintain engagement and catch issues early.',
        priority: 'high',
        effort: 'medium',
        impact: 'high',
        category: 'communication',
        action_items: [
          'Schedule recurring calendar invites',
          'Create check-in agenda template',
          'Set up follow-up task reminders',
          'Track meeting outcomes'
        ]
      },
      {
        id: '2',
        title: 'Automate Invoice Reminders',
        description: 'Set up automated email reminders for overdue invoices to improve cash flow and reduce payment delays.',
        priority: 'medium',
        effort: 'low',
        impact: 'medium',
        category: 'revenue',
        action_items: [
          'Configure email automation tool',
          'Create reminder email templates',
          'Set escalation schedule',
          'Monitor payment response rates'
        ]
      },
      {
        id: '3',
        title: 'Create Client Health Dashboard',
        description: 'Build a visual dashboard to track client health metrics and identify at-risk relationships proactively.',
        priority: 'medium',
        effort: 'high',
        impact: 'high',
        category: 'retention',
        action_items: [
          'Define key health metrics',
          'Set up data collection',
          'Design visual indicators',
          'Create alert thresholds'
        ]
      },
    ];

    setTimeout(() => {
      setInsights(mockInsights);
      setRecommendations(mockRecommendations);
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
          <p className="mt-1 text-sm text-gray-500">
            AI-powered analysis of your client relationships and business patterns
          </p>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('insights')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'insights'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChartBarIcon className="h-5 w-5 inline mr-2" />
              Insights ({insights.length})
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recommendations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <LightBulbIcon className="h-5 w-5 inline mr-2" />
              Recommendations ({recommendations.length})
            </button>
          </nav>
        </div>

        {activeTab === 'insights' && (
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-center py-12">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No insights available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  AI insights will appear here as we analyze your client data.
                </p>
              </div>
            ) : (
              insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="text-center py-12">
                <LightBulbIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recommendations available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  AI recommendations will appear here based on your client data analysis.
                </p>
              </div>
            ) : (
              recommendations.map((recommendation) => (
                <RecommendationCard key={recommendation.id} recommendation={recommendation} />
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}