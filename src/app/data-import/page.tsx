'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { UnstructuredImport } from '@/components/data/unstructured-import';
import { CSVImport } from '@/components/clients/csv-import';

export default function DataImportPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Import</h1>
          <p className="mt-1 text-sm text-gray-500">
            Import client data from various sources including APIs, files, and unstructured data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Structured Data Import</h2>
              <CSVImport />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Unstructured Data & APIs</h2>
              <UnstructuredImport />
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Integration Examples</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border rounded p-4">
              <h3 className="font-semibold">Email Integration</h3>
              <p className="text-sm text-gray-600 mt-2">
                Connect your email provider to automatically import client communications and extract sentiment.
              </p>
              <div className="mt-3 text-xs">
                <strong>Supports:</strong> Gmail API, Outlook, IMAP
              </div>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-semibold">CRM Webhooks</h3>
              <p className="text-sm text-gray-600 mt-2">
                Receive real-time updates from your existing CRM or sales tools via webhooks.
              </p>
              <div className="mt-3 text-xs">
                <strong>Supports:</strong> Salesforce, HubSpot, Custom APIs
              </div>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-semibold">Chat & Messaging</h3>
              <p className="text-sm text-gray-600 mt-2">
                Import conversations from Slack, Teams, or support chat platforms.
              </p>
              <div className="mt-3 text-xs">
                <strong>Supports:</strong> Slack API, Teams, Intercom
              </div>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-semibold">Document Processing</h3>
              <p className="text-sm text-gray-600 mt-2">
                Extract client information from PDFs, Word documents, and other files.
              </p>
              <div className="mt-3 text-xs">
                <strong>Supports:</strong> PDF, DOCX, TXT files
              </div>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-semibold">Social Media</h3>
              <p className="text-sm text-gray-600 mt-2">
                Monitor social media mentions and interactions with your clients.
              </p>
              <div className="mt-3 text-xs">
                <strong>Supports:</strong> Twitter API, LinkedIn, Facebook
              </div>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-semibold">Custom Integrations</h3>
              <p className="text-sm text-gray-600 mt-2">
                Build custom integrations using our flexible API endpoints.
              </p>
              <div className="mt-3 text-xs">
                <strong>Features:</strong> REST API, Webhooks, Real-time
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}