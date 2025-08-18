'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
}

interface ClientModalProps {
  client: Client | null;
  onSave: (clientData: Partial<Client>) => void;
  onClose: () => void;
}

export function ClientModal({ client, onSave, onClose }: ClientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    status: 'active' as 'active' | 'inactive' | 'at_risk' | 'churned',
    health_score: 70,
    total_revenue: 0,
    next_follow_up: '',
    notes: '',
    tags: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        company: client.company || '',
        phone: client.phone || '',
        status: client.status,
        health_score: client.health_score,
        total_revenue: client.total_revenue,
        next_follow_up: client.next_follow_up ? client.next_follow_up.split('T')[0] : '',
        notes: client.notes || '',
        tags: client.tags ? client.tags.join(', ') : '',
      });
    }
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const clientData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : null,
      next_follow_up: formData.next_follow_up ? new Date(formData.next_follow_up).toISOString() : null,
    };
    
    onSave(clientData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="active">Active</option>
                <option value="at_risk">At Risk</option>
                <option value="inactive">Inactive</option>
                <option value="churned">Churned</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="health_score">Health Score (0-100)</Label>
              <Input
                id="health_score"
                name="health_score"
                type="number"
                min="0"
                max="100"
                value={formData.health_score}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_revenue">Total Revenue ($)</Label>
              <Input
                id="total_revenue"
                name="total_revenue"
                type="number"
                min="0"
                step="0.01"
                value={formData.total_revenue}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_follow_up">Next Follow-up</Label>
              <Input
                id="next_follow_up"
                name="next_follow_up"
                type="date"
                value={formData.next_follow_up}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              name="tags"
              type="text"
              value={formData.tags}
              onChange={handleChange}
              placeholder="important, vip, monthly-retainer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Additional notes about this client..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {client ? 'Update Client' : 'Add Client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}