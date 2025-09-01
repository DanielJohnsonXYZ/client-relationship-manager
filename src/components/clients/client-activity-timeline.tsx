'use client';

import { useState, useEffect } from 'react';
import { createClientSupabase } from '@/lib/supabase-client';
import {
  EnvelopeIcon,
  PhoneIcon,
  VideoCameraIcon,
  CalendarIcon,
  FilmIcon,
  MicrophoneIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { format, isToday, isYesterday } from 'date-fns';

interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'video' | 'message' | 'document';
  source: 'manual' | 'gmail' | 'loom' | 'fireflies' | 'zoom' | 'slack';
  title: string;
  description?: string;
  participants?: string[];
  duration_minutes?: number;
  recording_url?: string;
  transcript?: string;
  activity_date: string;
  metadata?: any;
}

interface ClientActivityTimelineProps {
  clientId: string;
}

const ACTIVITY_ICONS = {
  email: EnvelopeIcon,
  call: PhoneIcon,
  meeting: CalendarIcon,
  video: VideoCameraIcon,
  message: DocumentTextIcon,
  document: DocumentTextIcon,
};

const SOURCE_COLORS = {
  manual: 'bg-gray-100 text-gray-800',
  gmail: 'bg-red-100 text-red-800',
  loom: 'bg-purple-100 text-purple-800',
  fireflies: 'bg-orange-100 text-orange-800',
  zoom: 'bg-blue-100 text-blue-800',
  slack: 'bg-green-100 text-green-800',
};

export function ClientActivityTimeline({ clientId }: ClientActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'email' | 'call' | 'video' | 'meeting'>('all');
  const supabase = createClientSupabase();

  useEffect(() => {
    fetchActivities();
  }, [clientId, filter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Fetch both manual communications and external activities
      const [communicationsResult, externalResult] = await Promise.all([
        supabase
          .from('communications')
          .select('*')
          .eq('client_id', clientId)
          .order('communication_date', { ascending: false }),
        
        supabase
          .from('external_activities')
          .select(`
            *,
            integrations!inner(name, type)
          `)
          .eq('client_id', clientId)
          .order('activity_date', { ascending: false })
      ]);

      const communications = communicationsResult.data || [];
      const externalActivities = externalResult.data || [];

      // Transform and combine data
      const allActivities: Activity[] = [
        // Manual communications
        ...communications.map(comm => ({
          id: comm.id,
          type: comm.type as Activity['type'],
          source: 'manual' as const,
          title: comm.subject || `${comm.type} communication`,
          description: comm.content,
          activity_date: comm.communication_date,
          metadata: { direction: comm.direction, sentiment: comm.sentiment_label },
        })),
        
        // External activities
        ...externalActivities.map(ext => ({
          id: ext.id,
          type: ext.activity_type as Activity['type'],
          source: ext.integrations.type as Activity['source'],
          title: ext.title,
          description: ext.description,
          participants: ext.participants,
          duration_minutes: ext.duration_minutes,
          recording_url: ext.recording_url,
          transcript: ext.transcript,
          activity_date: ext.activity_date,
          metadata: ext.metadata,
        })),
      ];

      // Sort by date and apply filter
      let filteredActivities = allActivities.sort((a, b) => 
        new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
      );

      if (filter !== 'all') {
        filteredActivities = filteredActivities.filter(activity => activity.type === filter);
      }

      setActivities(filteredActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatActivityDate = (dateStr: string) => {
    const date = new Date(dateStr);
    
    if (isToday(date)) {
      return `Today at ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, yyyy at HH:mm');
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    return ACTIVITY_ICONS[type] || DocumentTextIcon;
  };

  const getSourceBadge = (source: Activity['source']) => {
    const colorClass = SOURCE_COLORS[source] || 'bg-gray-100 text-gray-800';
    const displayName = source === 'manual' ? 'Manual' : source.charAt(0).toUpperCase() + source.slice(1);
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
        {displayName}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter buttons */}
      <div className="flex space-x-2 overflow-x-auto">
        {(['all', 'email', 'call', 'video', 'meeting'] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap ${
              filter === filterType
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="flow-root">
        <ul className="-mb-8">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const isLast = index === activities.length - 1;

            return (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {!isLast && (
                    <span
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  
                  <div className="relative flex items-start space-x-3">
                    {/* Icon */}
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white">
                        <Icon className="h-5 w-5 text-gray-500" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </h3>
                          {getSourceBadge(activity.source)}
                        </div>
                        <p className="text-xs text-gray-500 whitespace-nowrap">
                          {formatActivityDate(activity.activity_date)}
                        </p>
                      </div>

                      {/* Description */}
                      {activity.description && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-3">
                          {activity.description}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {activity.duration_minutes && (
                          <span className="inline-flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {activity.duration_minutes}min
                          </span>
                        )}
                        
                        {activity.participants && activity.participants.length > 0 && (
                          <span className="inline-flex items-center">
                            <span className="mr-1">👥</span>
                            {activity.participants.slice(0, 2).join(', ')}
                            {activity.participants.length > 2 && ` +${activity.participants.length - 2} more`}
                          </span>
                        )}

                        {activity.metadata?.sentiment && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full ${
                            activity.metadata.sentiment === 'positive' 
                              ? 'bg-green-100 text-green-800'
                              : activity.metadata.sentiment === 'negative'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.metadata.sentiment}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      {(activity.recording_url || activity.transcript) && (
                        <div className="mt-2 flex space-x-2">
                          {activity.recording_url && (
                            <a
                              href={activity.recording_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                            >
                              <FilmIcon className="h-3 w-3 mr-1" />
                              View Recording
                              <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                            </a>
                          )}
                          
                          {activity.transcript && (
                            <a
                              href={activity.transcript}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                            >
                              <DocumentTextIcon className="h-3 w-3 mr-1" />
                              View Transcript
                              <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {activities.length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activities</h3>
            <p className="mt-1 text-sm text-gray-500">
              Connect your tools or add manual communications to see client activity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}