'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  CalendarIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'connected' | 'disconnected' | 'error';
  last_sync?: string;
}

export function IntegrationSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Sync email communications and analyze sentiment',
      icon: EnvelopeIcon,
      status: 'disconnected',
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Monitor client communications in Slack channels',
      icon: ChatBubbleLeftRightIcon,
      status: 'disconnected',
    },
    {
      id: 'zoom',
      name: 'Zoom',
      description: 'Track meeting frequency and outcomes',
      icon: VideoCameraIcon,
      status: 'disconnected',
    },
    {
      id: 'calendly',
      name: 'Calendly',
      description: 'Sync scheduled meetings and client interactions',
      icon: CalendarIcon,
      status: 'disconnected',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Monitor payment status and revenue data',
      icon: CreditCardIcon,
      status: 'disconnected',
    },
  ]);

  const handleConnect = async (integrationId: string) => {
    // Mock connection process
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId
          ? { 
              ...integration, 
              status: 'connected',
              last_sync: new Date().toISOString()
            }
          : integration
      )
    );
  };

  const handleDisconnect = async (integrationId: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId
          ? { 
              ...integration, 
              status: 'disconnected',
              last_sync: undefined
            }
          : integration
      )
    );
  };

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

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
          const isConnected = integration.status === 'connected';
          
          return (
            <div
              key={integration.id}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(integration.id)}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleConnect(integration.id)}
                  >
                    Connect
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
              Demo Mode
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Integrations are simulated in this demo. In production, these would connect to actual APIs and sync real data from your connected services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}