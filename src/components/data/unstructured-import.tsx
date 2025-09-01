'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ImportResult {
  processed: number;
  clients_created: number;
  communications_created: number;
  errors: string[];
}

export function UnstructuredImport() {
  const [file, setFile] = useState<File | null>(null);
  const [textData, setTextData] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [activeTab, setActiveTab] = useState<'file' | 'text' | 'api'>('file');

  const handleFileImport = async () => {
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/data/bulk-import', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        const error = await response.json();
        setResult({ 
          processed: 0, 
          clients_created: 0, 
          communications_created: 0, 
          errors: [error.error || 'Import failed'] 
        });
      }
    } catch (error) {
      setResult({ 
        processed: 0, 
        clients_created: 0, 
        communications_created: 0, 
        errors: ['Network error during import'] 
      });
    }

    setImporting(false);
  };

  const handleTextImport = async () => {
    if (!textData.trim()) return;

    setImporting(true);
    
    try {
      // Convert text to structured data
      const lines = textData.split('\n').filter(line => line.trim());
      const jsonData = lines.map((line, index) => ({
        content: line,
        timestamp: new Date().toISOString(),
        source: 'manual_text_import',
        index
      }));

      const response = await fetch('/api/webhooks/data-ingestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'manual-import',
        },
        body: JSON.stringify({
          source: 'manual_text',
          type: 'unstructured',
          data: jsonData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult({
          processed: 1,
          clients_created: data.client_created ? 1 : 0,
          communications_created: 1,
          errors: []
        });
      }
    } catch (error) {
      setResult({ 
        processed: 0, 
        clients_created: 0, 
        communications_created: 0, 
        errors: ['Failed to process text data'] 
      });
    }

    setImporting(false);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('file')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'file'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            File Upload
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'text'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Text Data
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'api'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            API Integration
          </button>
        </nav>
      </div>

      {activeTab === 'file' && (
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold">Import Unstructured Data Files</h3>
          <p className="text-sm text-gray-600">
            Upload JSON, CSV, or TXT files containing client communications, emails, or other unstructured data.
          </p>
          
          <Input
            type="file"
            accept=".json,.csv,.txt"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setResult(null);
            }}
            disabled={importing}
          />
          
          {file && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
              <Button onClick={handleFileImport} disabled={importing}>
                {importing ? 'Processing...' : 'Import File'}
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'text' && (
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold">Import Text Data</h3>
          <p className="text-sm text-gray-600">
            Paste unstructured text data (emails, messages, notes) and we&apos;ll extract client information automatically.
          </p>
          
          <textarea
            value={textData}
            onChange={(e) => {
              setTextData(e.target.value);
              setResult(null);
            }}
            placeholder="Paste your text data here... 

Example:
From: contact@sparkshipping.com
Subject: Project Update
Hi, thanks for the great work on the project! The client TechCorp is very happy.

From: sarah@company.com  
We had issues with the delivery but overall satisfied with service."
            className="w-full h-64 p-3 border rounded-md text-sm"
            disabled={importing}
          />
          
          {textData.trim() && (
            <Button onClick={handleTextImport} disabled={importing}>
              {importing ? 'Processing...' : 'Process Text Data'}
            </Button>
          )}
        </div>
      )}

      {activeTab === 'api' && (
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold">API Integration</h3>
          <p className="text-sm text-gray-600">
            Use these endpoints to send data programmatically from other systems.
          </p>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Webhook Endpoint:</h4>
              <code className="block p-2 bg-gray-100 rounded text-sm mt-1">
                POST {window.location.origin}/api/webhooks/data-ingestion
              </code>
            </div>
            
            <div>
              <h4 className="font-medium">Headers:</h4>
              <code className="block p-2 bg-gray-100 rounded text-sm mt-1">
                Content-Type: application/json<br/>
                x-api-key: YOUR_API_KEY
              </code>
            </div>
            
            <div>
              <h4 className="font-medium">Example Payload:</h4>
              <pre className="p-2 bg-gray-100 rounded text-sm mt-1 overflow-x-auto">
{`{
  "source": "your_system",
  "type": "email",
  "client_identifier": "contact@sparkshipping.com",
  "data": {
    "from_email": "contact@sparkshipping.com",
    "from_name": "John Smith", 
    "subject": "Project Update",
    "body": "Thanks for the excellent work!",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}`}
              </pre>
            </div>
            
            <div className="text-xs text-gray-500">
              <p><strong>Supported types:</strong> email, communication, client_update, unstructured</p>
              <p><strong>Auto-extraction:</strong> Emails, phone numbers, names, companies, sentiment</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 border rounded-lg">
          <h4 className="font-semibold text-lg mb-2">Import Results</h4>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{result.processed}</div>
              <div className="text-sm text-gray-600">Items Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{result.clients_created}</div>
              <div className="text-sm text-gray-600">Clients Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{result.communications_created}</div>
              <div className="text-sm text-gray-600">Communications</div>
            </div>
          </div>
          
          {result.errors.length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-red-600">Errors ({result.errors.length}):</p>
              <ul className="text-sm text-red-500 ml-4 mt-1">
                {result.errors.slice(0, 3).map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
                {result.errors.length > 3 && (
                  <li>• ... and {result.errors.length - 3} more errors</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}