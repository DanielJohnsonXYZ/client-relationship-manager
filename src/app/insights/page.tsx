'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { InsightCard } from '@/components/insights/insight-card';
import { RecommendationCard } from '@/components/insights/recommendation-card';
import { DemoSetupCard } from '@/components/setup/demo-setup-card';
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
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations'>('insights');

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/insights');
        if (!response.ok) {
          throw new Error('Failed to fetch insights');
        }
        
        const data = await response.json();
        setInsights(data.insights || []);
        setRecommendations(data.recommendations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching insights:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Error loading AI insights</div>
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
            {insights.length === 0 && !loading ? (
              <div className="space-y-6">
                <DemoSetupCard />
                <div className="text-center py-12">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No insights available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    AI insights will appear here once you have client data to analyze.
                  </p>
                </div>
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