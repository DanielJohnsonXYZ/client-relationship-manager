'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, ExclamationCircleIcon, PlayIcon } from '@heroicons/react/24/outline';

export function DemoSetupCard() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSetup = async (endpoint: string) => {
    try {
      setLoading(true);
      setStatus('idle');
      setMessage('');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      setStatus('success');
      setMessage(data.message);
      
      // Refresh the page after a delay to show the new data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Setup error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupDemo = () => handleSetup('/api/setup-demo');

  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {status === 'success' ? (
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
          ) : status === 'error' ? (
            <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
          ) : (
            <PlayIcon className="h-6 w-6 text-blue-500" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-gray-900">
            Set Up Demo Data
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {status === 'success' 
              ? 'Demo data created successfully! The page will refresh to show your new data.'
              : status === 'error'
              ? `Error: ${message}`
              : 'Generate comprehensive demo data including Spark Shipping (premium client) plus 3 additional clients with realistic communications, health scores, and alerts.'
            }
          </p>
          
          {status === 'idle' && (
            <div className="mt-4">
              <Button
                onClick={handleSetupDemo}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Creating Demo Data...' : 'Create Demo Data'}
              </Button>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-4 p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-700">
                ✅ {message}
              </p>
              <p className="mt-1 text-sm text-green-600">
                Your dashboard now shows realistic client data including Spark Shipping! Explore the Analytics, Communications, and Clients pages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}