'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, ExclamationCircleIcon, PlayIcon } from '@heroicons/react/24/outline';

export function DemoSetupCard() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSetup = async () => {
    try {
      setLoading(true);
      setStatus('idle');
      setMessage('');

      const response = await fetch('/api/setup-spark-shipping', {
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
            Set Up Demo Client Data
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {status === 'success' 
              ? 'Demo client data created successfully! The page will refresh to show your new data.'
              : status === 'error'
              ? `Error: ${message}`
              : 'Create Charles from Spark Shipping as a demo client with sample communications and alerts to see the platform in action.'
            }
          </p>
          
          {status === 'idle' && (
            <div className="mt-4">
              <Button
                onClick={handleSetup}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Create Demo Data
                  </>
                )}
              </Button>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-4 p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-700">
                ✅ Charles from Spark Shipping has been added with:
              </p>
              <ul className="mt-1 text-sm text-green-600 list-disc list-inside">
                <li>Client profile with 88/100 health score</li>
                <li>Sample communication history</li>
                <li>High-priority opportunity alert</li>
                <li>$45,000 revenue tracking</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}