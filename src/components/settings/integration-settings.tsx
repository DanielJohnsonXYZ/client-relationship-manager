'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  CalendarIcon,
  CreditCardIcon,
  FilmIcon,
  MicrophoneIcon,
} from '@heroicons/react/24/outline';
import { createClientSupabase } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';

interface Integration {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: any;
  status: 'active' | 'inactive' | 'error';
  last_sync?: string;
  created_at?: string;
}

const AVAILABLE_INTEGRATIONS = [
  {
    type: 'gmail',
    name: 'Gmail',
    description: 'Sync email communications and analyze sentiment',
    icon: EnvelopeIcon,
  },
  {
    type: 'loom',
    name: 'Loom',
    description: 'Import video recordings and transcripts from meetings',
    icon: FilmIcon,
  },
  {
    type: 'fireflies',
    name: 'Fireflies.ai',
    description: 'Sync meeting transcripts and call summaries',
    icon: MicrophoneIcon,
  },
  {
    type: 'zoom',
    name: 'Zoom',
    description: 'Track meeting frequency and outcomes',
    icon: VideoCameraIcon,
  },
  {
    type: 'slack',
    name: 'Slack',
    description: 'Monitor client communications in Slack channels',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    type: 'calendly',
    name: 'Calendly',
    description: 'Sync scheduled meetings and client interactions',
    icon: CalendarIcon,
  },
];

export function IntegrationSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const supabase = createClientSupabase();
  const { user } = useAuth();

  useEffect(() => {
    fetchIntegrations();
  }, [user]);

  const fetchIntegrations = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Merge with available integrations to show all options
      const mergedIntegrations = AVAILABLE_INTEGRATIONS.map(available => {
        const existing = data?.find(d => d.type === available.type);
        return existing ? { ...existing, ...available } : { ...available, status: 'inactive' as const };
      });

      setIntegrations(mergedIntegrations);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (integrationType: string) => {
    setConnecting(integrationType);
    
    try {
      // Check if user is authenticated
      if (!user) {
        console.error('User not authenticated');
        setConnecting(null);
        return;
      }

      // First create the integration record
      const availableIntegration = AVAILABLE_INTEGRATIONS.find(a => a.type === integrationType);
      if (!availableIntegration) {
        setConnecting(null);
        return;
      }

      const { data: integration, error } = await supabase
        .from('integrations')
        .insert({
          type: integrationType,
          name: availableIntegration.name,
          status: 'inactive',
          user_id: user.id
        })
        .select()
        .single();

      if (error && error.code !== '23505') { // Ignore duplicate key error
        throw error;
      }

      // Redirect to OAuth flow
      window.location.href = `/api/integrations/oauth/${integrationType}?action=authorize`;
    } catch (error) {
      console.error('Error connecting integration:', error);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;

      await fetchIntegrations();
    } catch (error) {
      console.error('Error disconnecting integration:', error);
    }
  };

  const handleSync = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Sync failed');

      await fetchIntegrations();
    } catch (error) {
      console.error('Error syncing integration:', error);
    }
  };

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Integrations</h3>
        <p className="text-sm text-gray-500 mt-1">
          Connect your tools to automatically sync client data and communications.
        </p>
      </div>
      
      <div className="space-y-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const isConnected = integration.status === 'active';
          const isConnecting = connecting === integration.type;
          
          return (
            <div
              key={integration.type}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <Icon className="h-6 w-6 text-gray-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900">
                    {integration.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {integration.description}
                  </p>
                  {integration.last_sync && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last synced: {new Date(integration.last_sync).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(integration.status)}`}>
                  {integration.status}
                </span>
                
                {isConnected ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(integration.id!)}
                    >
                      Sync
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(integration.id!)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    disabled={isConnecting}
                    onClick={() => handleConnect(integration.type)}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Getting Started
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Click "Connect" to authenticate with your tools via OAuth. Once connected, we'll automatically sync your client communications and activities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}