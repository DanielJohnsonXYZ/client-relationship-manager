'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EnvelopeIcon, PhoneIcon, VideoCameraIcon, UserGroupIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface Communication {
  id: string;
  client_id: string;
  client_name: string;
  client_company: string | null;
  type: 'email' | 'call' | 'meeting' | 'slack' | 'other';
  subject: string | null;
  content: string | null;
  direction: 'inbound' | 'outbound';
  communication_date: string;
  sentiment_score: number | null;
  sentiment_label: 'positive' | 'negative' | 'neutral' | null;
}

const COMMUNICATION_ICONS = {
  email: EnvelopeIcon,
  call: PhoneIcon,
  meeting: VideoCameraIcon,
  slack: ChatBubbleLeftRightIcon,
  other: UserGroupIcon,
};

const SENTIMENT_COLORS = {
  positive: 'text-green-600 bg-green-100',
  negative: 'text-red-600 bg-red-100', 
  neutral: 'text-gray-600 bg-gray-100',
};

export default function CommunicationsPage() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');

  useEffect(() => {
    fetchCommunications();
  }, [typeFilter, directionFilter]);

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (directionFilter !== 'all') params.set('direction', directionFilter);
      
      const response = await fetch(`/api/communications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCommunications(data.communications || []);
      }
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSentimentBadge = (sentiment: string | null) => {
    if (!sentiment) return null;
    
    const colorClass = SENTIMENT_COLORS[sentiment as keyof typeof SENTIMENT_COLORS];
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
        {sentiment}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-20 rounded-lg" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track all your client interactions and communications
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="email">Email</option>
            <option value="call">Call</option>
            <option value="meeting">Meeting</option>
            <option value="slack">Slack</option>
            <option value="other">Other</option>
          </select>

          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>
        </div>

        {/* Communications List */}
        {communications.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No communications</h3>
            <p className="mt-1 text-sm text-gray-500">
              Connect your integrations to start tracking communications automatically.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {communications.map((comm) => {
                const IconComponent = COMMUNICATION_ICONS[comm.type];
                return (
                  <li key={comm.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <IconComponent className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {comm.client_name}
                              </p>
                              {comm.client_company && (
                                <p className="text-sm text-gray-500">
                                  ({comm.client_company})
                                </p>
                              )}
                            </div>
                            <p className="text-sm text-gray-900 font-medium">
                              {comm.subject || `${comm.type.charAt(0).toUpperCase() + comm.type.slice(1)} communication`}
                            </p>
                            {comm.content && (
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {comm.content.length > 100 ? `${comm.content.substring(0, 100)}...` : comm.content}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getSentimentBadge(comm.sentiment_label)}
                          <div className="text-right">
                            <p className="text-sm text-gray-900">
                              {formatDate(comm.communication_date)}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              {comm.direction}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}