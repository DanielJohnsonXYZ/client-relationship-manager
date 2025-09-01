'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EnvelopeIcon, BuildingOfficeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ClientSuggestion {
  name: string;
  email: string;
  company?: string;
  reason: string;
  confidence: number;
  emailCount: number;
  lastContact: string;
  sampleSubjects: string[];
  estimatedRevenue?: number;
}

interface ClientSuggestionsProps {
  onAddClient: (clientData: any) => Promise<void>;
}

export function ClientSuggestions({ onAddClient }: ClientSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [addingClients, setAddingClients] = useState<Set<string>>(new Set());

  const scanInbox = async () => {
    setScanning(true);
    setError(null);
    
    try {
      const response = await fetch('/api/inbox-scan', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to scan inbox');
      }

      setSuggestions(data.suggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan inbox');
    } finally {
      setScanning(false);
    }
  };

  const addSuggestedClient = async (suggestion: ClientSuggestion) => {
    setAddingClients(prev => new Set(prev).add(suggestion.email));
    
    try {
      await onAddClient({
        name: suggestion.name,
        email: suggestion.email,
        company: suggestion.company,
        total_revenue: suggestion.estimatedRevenue || 0,
        notes: `Auto-discovered from email communications. ${suggestion.reason}`,
        tags: ['email-discovered'],
        status: 'active',
      });

      // Remove from suggestions after successful add
      setSuggestions(prev => prev.filter(s => s.email !== suggestion.email));
    } catch (err) {
      console.error('Failed to add client:', err);
      setError('Failed to add client. Please try again.');
    } finally {
      setAddingClients(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.email);
        return newSet;
      });
    }
  };

  const dismissSuggestion = (email: string) => {
    setSuggestions(prev => prev.filter(s => s.email !== email));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-blue-100 text-blue-800';
    if (confidence >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Email Client Discovery</h3>
          <p className="text-sm text-gray-500">
            Automatically find potential clients from your email communications
          </p>
        </div>
        <Button
          onClick={scanInbox}
          disabled={scanning}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <EnvelopeIcon className="h-4 w-4 mr-2" />
          {scanning ? 'Scanning...' : 'Scan Inbox'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {suggestions.length === 0 && !scanning && !error && (
        <div className="text-center py-8 text-gray-500">
          <EnvelopeIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>No client suggestions yet.</p>
          <p className="text-sm">Click &quot;Scan Inbox&quot; to discover potential clients from your emails.</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Found {suggestions.length} potential clients from your email communications
          </div>
          
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.email}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {suggestion.name}
                    </h4>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(
                        suggestion.confidence
                      )}`}
                    >
                      {suggestion.confidence}% match
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      {suggestion.email}
                    </div>
                    
                    {suggestion.company && (
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                        {suggestion.company}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      {suggestion.emailCount} emails • Last: {formatDate(suggestion.lastContact)}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Reason: {suggestion.reason}
                    </div>
                    
                    {suggestion.estimatedRevenue && (
                      <div className="text-xs text-green-600">
                        Estimated value: ${suggestion.estimatedRevenue.toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  {suggestion.sampleSubjects.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Recent subjects:</div>
                      <div className="space-y-1">
                        {suggestion.sampleSubjects.map((subject, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded truncate"
                          >
                            {subject}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => addSuggestedClient(suggestion)}
                    disabled={addingClients.has(suggestion.email)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    {addingClients.has(suggestion.email) ? 'Adding...' : 'Add'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dismissSuggestion(suggestion.email)}
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}