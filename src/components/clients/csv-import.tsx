'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClientSupabase } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';

interface ImportResult {
  success: number;
  errors: string[];
}

export function CSVImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert('Please select a CSV file');
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(',');
      const record: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim().replace(/"/g, '');
        
        // Map common CSV headers to our database fields
        switch (header) {
          case 'name':
          case 'client_name':
          case 'company_name':
            record.name = value;
            break;
          case 'email':
          case 'email_address':
            record.email = value;
            break;
          case 'company':
          case 'organization':
            record.company = value;
            break;
          case 'phone':
          case 'phone_number':
            record.phone = value;
            break;
          case 'status':
            record.status = ['active', 'inactive', 'at_risk', 'churned'].includes(value) ? value : 'active';
            break;
          case 'health_score':
          case 'score':
            record.health_score = Math.min(100, Math.max(0, parseInt(value) || 50));
            break;
          case 'revenue':
          case 'total_revenue':
            record.total_revenue = parseFloat(value) || 0;
            break;
          case 'notes':
          case 'description':
            record.notes = value;
            break;
        }
      });
      
      return record;
    });
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setImporting(true);
    const supabase = createClientSupabase();
    
    try {
      const text = await file.text();
      const records = parseCSV(text);
      
      const results: ImportResult = { success: 0, errors: [] };
      
      for (const record of records) {
        if (!record.name) {
          results.errors.push('Missing required field: name');
          continue;
        }
        
        const { error } = await supabase
          .from('clients')
          .insert([{
            user_id: user.id,
            ...record
          }]);
          
        if (error) {
          results.errors.push(`Error importing ${record.name}: ${error.message}`);
        } else {
          results.success++;
        }
      }
      
      setResult(results);
    } catch (error) {
      setResult({ success: 0, errors: ['Failed to parse CSV file'] });
    }
    
    setImporting(false);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Import Clients from CSV</h3>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          CSV should include columns: name, email, company, phone, status, health_score, total_revenue, notes
        </p>
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={importing}
        />
      </div>
      
      {file && (
        <Button onClick={handleImport} disabled={importing}>
          {importing ? 'Importing...' : `Import ${file.name}`}
        </Button>
      )}
      
      {result && (
        <div className="mt-4 p-3 border rounded">
          <p className="font-medium">Import Results:</p>
          <p className="text-green-600">{result.success} clients imported successfully</p>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-red-600">{result.errors.length} errors:</p>
              <ul className="text-sm text-red-500 ml-4">
                {result.errors.slice(0, 5).map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
                {result.errors.length > 5 && (
                  <li>• ... and {result.errors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}