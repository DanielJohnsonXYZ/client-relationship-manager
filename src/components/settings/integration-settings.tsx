'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
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
  {
    type: 'basecamp',
    name: 'Basecamp',
    description: 'Sync project communications and client collaboration',
    icon: ChatBubbleLeftRightIcon,
  },
];

export function IntegrationSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [integrationStatuses, setIntegrationStatuses] = useState<any[]>([]);
  const supabase = createClientSupabase();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchIntegrations();
    fetchIntegrationStatuses();
  }, [user]);

  useEffect(() => {
    // Clear connecting state when redirected back from OAuth
    const integrationSuccess = searchParams.get('integration_success');
    const integrationError = searchParams.get('integration_error');
    
    if (integrationSuccess) {
      setConnecting(null);
      setErrorMessage(null);
      fetchIntegrations();
    } else if (integrationError) {
      setConnecting(null);
      const errorMessages = {
        oauth_not_configured: 'OAuth credentials are not configured for this integration. Please contact support.',
        app_url_not_configured: 'Application URL is not configured. Please check your environment settings.',
        token_exchange_failed: 'Failed to exchange authorization code for tokens. Please try again.',
        token_storage_failed: 'Failed to store integration tokens. Please try again.',
        integration_not_found: 'Integration record not found. Please try connecting again.',
        redirect_uri_mismatch: 'Redirect URI mismatch. Please ensure your integration is configured with the correct redirect URI.',
        unexpected_error: 'An unexpected error occurred. Please try again.',
      };
      setErrorMessage(errorMessages[integrationError as keyof typeof errorMessages] || 'Integration error occurred. Please try again.');
      fetchIntegrations();
    }
  }, [searchParams]);

  const fetchIntegrations = useCallback(async () => {
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
  }, [user, supabase]);

  const fetchIntegrationStatuses = useCallback(async () => {
    try {
      const response = await fetch('/api/integrations/status');
      if (response.ok) {
        const data = await response.json();
        setIntegrationStatuses(data.integrations || []);
      }
    } catch (error) {
      console.error('Error fetching integration statuses:', error);
    }
  }, []);

  const handleConnect = async (integrationType: string) => {
    setConnecting(integrationType);
    
    try {
      // Check if user is authenticated
      if (!user) {
        console.error('User not authenticated');
        setConnecting(null);
        return;
      }

      // Check if integration is properly configured
      const status = integrationStatuses.find(s => s.type === integrationType);
      if (status && !status.configured) {
        setErrorMessage(`${status.name} is not properly configured. Missing environment variables: ${status.missingEnvVars.join(', ')}`);
        setConnecting(null);
        return;
      }

      // First create the integration record
      const availableIntegration = AVAILABLE_INTEGRATIONS.find(a => a.type === integrationType);
      if (!availableIntegration) {
        setConnecting(null);
        return;
      }

      // Check if integration already exists
      const { data: existingIntegration } = await supabase
        .from('integrations')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', integrationType)
        .single();

      if (!existingIntegration) {
        // Create new integration only if one doesn't exist
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

        if (error) {
          throw error;
        }
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
      setDisconnecting(integrationId);
      
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;

      await fetchIntegrations();
    } catch (error) {
      console.error('Error disconnecting integration:', error);
    } finally {
      setDisconnecting(null);
    }
  };

  const handleSync = async (integrationId: string, integrationType: string) => {
    setSyncing(integrationId);
    
    try {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Sync failed');
      }

      // Show success message
      console.log(`${integrationType} sync completed:`, result);
      
      // Refresh integrations to show updated last_sync time
      await fetchIntegrations();
      
      // Clear any previous errors
      setErrorMessage(null);
      
    } catch (error) {
      console.error('Error syncing integration:', error);
      setErrorMessage(`Failed to sync ${integrationType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncing(null);
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

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Integration Error</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{errorMessage}</p>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-sm text-red-800 underline hover:text-red-900"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const isConnected = integration.status === 'active';
          const isConnecting = connecting === integration.type;
          const isSyncing = syncing === integration.id;
          const status = integrationStatuses.find(s => s.type === integration.type);
          
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
                  {!status?.configured && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Missing configuration: {status?.missingEnvVars.join(', ')}
                    </p>
                  )}
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
                      onClick={() => handleSync(integration.id!, integration.type)}
                      disabled={isSyncing}
                    >
                      {isSyncing ? 'Syncing...' : 'Sync'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(integration.id!)}
                      disabled={disconnecting === integration.id}
                    >
                      {disconnecting === integration.id ? 'Disconnecting...' : 'Disconnect'}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    disabled={isConnecting || !status?.configured}
                    onClick={() => handleConnect(integration.type)}
                    className={!status?.configured ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    {isConnecting ? 'Connecting...' : !status?.configured ? 'Not Configured' : 'Connect'}
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