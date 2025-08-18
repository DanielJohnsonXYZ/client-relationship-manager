'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'alerts',
      label: 'Client Alerts',
      description: 'Notifications when important client issues are detected',
      email: true,
      push: true,
    },
    {
      id: 'health_changes',
      label: 'Health Score Changes',
      description: 'When client health scores change significantly',
      email: true,
      push: false,
    },
    {
      id: 'payment_reminders',
      label: 'Payment Reminders',
      description: 'Overdue invoice and payment notifications',
      email: true,
      push: true,
    },
    {
      id: 'follow_ups',
      label: 'Follow-up Reminders',
      description: 'Scheduled client follow-up notifications',
      email: false,
      push: true,
    },
    {
      id: 'insights',
      label: 'Weekly Insights',
      description: 'Weekly summary of AI insights and recommendations',
      email: true,
      push: false,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleToggle = (id: string, type: 'email' | 'push') => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.id === id
          ? { ...pref, [type]: !pref[type] }
          : pref
      )
    );
  };

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMessage('Notification preferences saved successfully!');
    setLoading(false);
    
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
      
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-600 border-b pb-2">
          <span>Notification Type</span>
          <span className="text-center">Email</span>
          <span className="text-center">Push</span>
        </div>

        {preferences.map((pref) => (
          <div key={pref.id} className="grid grid-cols-3 gap-4 items-center py-3 border-b border-gray-100">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{pref.label}</h4>
              <p className="text-xs text-gray-500">{pref.description}</p>
            </div>
            
            <div className="flex justify-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={pref.email}
                  onChange={() => handleToggle(pref.id, 'email')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex justify-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={pref.push}
                  onChange={() => handleToggle(pref.id, 'push')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        ))}

        {message && (
          <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">
            {message}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
}