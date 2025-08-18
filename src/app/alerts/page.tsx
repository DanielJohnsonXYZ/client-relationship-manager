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
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockAlerts: Alert[] = [
      {
        id: '1',
        user_id: 'user1',
        client_id: 'client1',
        type: 'payment_risk',
        title: 'Invoice overdue by 15 days',
        description: 'Client ABC Corp has an overdue invoice worth $5,000',
        priority: 'high',
        status: 'active',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        resolved_at: null,
        clients: { name: 'John Smith', company: 'ABC Corp' }
      },
      {
        id: '2',
        user_id: 'user1',
        client_id: 'client2',
        type: 'low_engagement',
        title: 'No communication in 2 weeks',
        description: 'Client has not responded to recent emails',
        priority: 'medium',
        status: 'active',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        resolved_at: null,
        clients: { name: 'Sarah Johnson', company: 'XYZ Inc' }
      },
      {
        id: '3',
        user_id: 'user1',
        client_id: 'client3',
        type: 'contract_renewal',
        title: 'Contract renewal due soon',
        description: 'Annual contract expires in 30 days',
        priority: 'high',
        status: 'active',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        resolved_at: null,
        clients: { name: 'Mike Wilson', company: 'Tech Solutions' }
      },
      {
        id: '4',
        user_id: 'user1',
        client_id: 'client4',
        type: 'opportunity',
        title: 'Potential upsell opportunity',
        description: 'Client mentioned expanding project scope',
        priority: 'medium',
        status: 'active',
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        resolved_at: null,
        clients: { name: 'Lisa Davis', company: 'Design Studio' }
      }
    ];

    setTimeout(() => {
      setAlerts(mockAlerts);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || alert.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const handleUpdateAlert = async (alertId: string, updates: Partial<Alert>) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, ...updates } : alert
    ));
  };

  const handleCreateAlert = async (alertData: Partial<Alert>) => {
    const newAlert: Alert = {
      id: Math.random().toString(),
      user_id: 'user1',
      client_id: null,
      type: 'follow_up_needed',
      title: '',
      description: null,
      priority: 'medium',
      status: 'active',
      created_at: new Date().toISOString(),
      resolved_at: null,
      ...alertData,
    } as Alert;
    
    setAlerts([newAlert, ...alerts]);
    setShowModal(false);
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