'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClientCard } from '@/components/clients/client-card';
import { ClientModal } from '@/components/clients/client-modal';
import { CSVImport } from '@/components/clients/csv-import';
import { ClientSuggestions } from '@/components/clients/client-suggestions';
import { DemoSetupCard } from '@/components/setup/demo-setup-card';
import { PlusIcon, MagnifyingGlassIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  status: 'active' | 'inactive' | 'at_risk' | 'churned';
  health_score: number;
  total_revenue: number;
  last_contact_date: string | null;
  next_follow_up: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const fetchClients = async () => {
    try {
      const url = new URL('/api/clients', window.location.origin);
      if (statusFilter !== 'all') {
        url.searchParams.set('status', statusFilter);
      }
      
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [statusFilter]);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddClient = () => {
    setEditingClient(null);
    setShowModal(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setClients(clients.filter(client => client.id !== clientId));
      }
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        const { client } = await response.json();
        if (editingClient) {
          setClients(clients.map(c => c.id === client.id ? client : c));
        } else {
          setClients([client, ...clients]);
        }
        setShowModal(false);
        setEditingClient(null);
      }
    } catch (error) {
      console.error('Failed to save client:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-lg" />
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
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your client relationships and track their health
            </p>
          </div>
          <Button onClick={handleAddClient}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Client
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="at_risk">At Risk</option>
              <option value="inactive">Inactive</option>
              <option value="churned">Churned</option>
            </select>
          </div>
          
          <CSVImport />
        </div>

        {/* Client suggestions (only show if no search filter) */}
        {clients.length === 0 && !searchTerm && (
          <div className="space-y-8">
            <DemoSetupCard />
            <ClientSuggestions onAddClient={handleSaveClient} />
          </div>
        )}

        {filteredClients.length === 0 && searchTerm ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <UserGroupIcon className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No matching clients</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search terms or add a new client.
            </p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <UserGroupIcon className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clients yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add your first client manually or use the email discovery feature above.
            </p>
            <div className="mt-6">
              <Button onClick={handleAddClient}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Client
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={handleEditClient}
                onDelete={handleDeleteClient}
              />
            ))}
          </div>
        )}

        {showModal && (
          <ClientModal
            client={editingClient}
            onSave={handleSaveClient}
            onClose={() => {
              setShowModal(false);
              setEditingClient(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}