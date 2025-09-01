'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AlertCard } from '@/components/alerts/alert-card';
import { AlertModal } from '@/components/alerts/alert-modal';
import { Button } from '@/components/ui/button';
import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Alert {
  id: string;
  user_id: string;
  client_id: string | null;
  type: 'payment_risk' | 'low_engagement' | 'opportunity' | 'follow_up_needed' | 'contract_renewal';
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
  clients?: {
    name: string;
    company: string | null;
  };
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      
      const response = await fetch(`/api/alerts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, priorityFilter]);

  // No need to filter on client side since server does it
  const filteredAlerts = alerts;

  const handleUpdateAlert = async (alertId: string, updates: Partial<Alert>) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: alertId,
          ...updates,
          resolved_at: updates.status === 'resolved' ? new Date().toISOString() : updates.resolved_at,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update alert');
      }

      const data = await response.json();
      
      // Update local state
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, ...data.alert } : alert
      ));
    } catch (err) {
      console.error('Error updating alert:', err);
      setError('Failed to update alert');
    }
  };

  const handleCreateAlert = async (alertData: Partial<Alert>) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        throw new Error('Failed to create alert');
      }

      const data = await response.json();
      setAlerts([data.alert, ...alerts]);
      setShowModal(false);
    } catch (err) {
      console.error('Error creating alert:', err);
      setError('Failed to create alert');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg" />
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
          <div className="text-red-600 mb-4">Error loading alerts</div>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={() => fetchAlerts()} 
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage important client notifications
            </p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Alert
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All Status</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter === 'active' 
                ? "Great! You don't have any active alerts right now."
                : `No ${statusFilter} alerts found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onUpdate={handleUpdateAlert}
              />
            ))}
          </div>
        )}

        {showModal && (
          <AlertModal
            onSave={handleCreateAlert}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}