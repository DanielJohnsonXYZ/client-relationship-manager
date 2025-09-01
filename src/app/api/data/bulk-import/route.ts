import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dataType = formData.get('type') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const content = await file.text();
    let data: any;
    
    // Parse different file formats
    try {
      if (file.name.endsWith('.json')) {
        data = JSON.parse(content);
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(content);
      } else if (file.name.endsWith('.txt')) {
        data = parseText(content);
      } else {
        return NextResponse.json({ 
          error: 'Unsupported file format. Use JSON, CSV, or TXT files.' 
        }, { status: 400 });
      }
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Failed to parse file content' 
      }, { status: 400 });
    }
    
    // Process the data
    const result = await processData(user.id, data, dataType);
    
    return NextResponse.json({
      success: true,
      message: 'Data processed successfully',
      ...result
    });
    
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function parseCSV(content: string) {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',');
    const record: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim().replace(/"/g, '');
      record[header] = value;
    });
    
    return record;
  });
}

function parseText(content: string): any[] {
  // Split text into chunks and extract information
  const chunks = content.split('\n\n').filter(chunk => chunk.trim());
  
  return chunks.map(chunk => ({
    content: chunk.trim(),
    type: 'text',
    timestamp: new Date().toISOString()
  }));
}

async function processData(userId: string, data: any[], dataType?: string) {
  const results = {
    processed: 0,
    clients_created: 0,
    communications_created: 0,
    errors: [] as string[]
  };
  
  for (const item of data) {
    try {
      // Extract client information
      const clientInfo = extractClientInfo(item);
      
      // Find or create client
      let clientId = await findOrCreateClient(userId, clientInfo);
      
      if (clientId) {
        // Create communication if there's meaningful content
        const content = extractContent(item);
        if (content && content.length > 10) {
          const sentiment = analyzeSentiment(content);
          
          const { error } = await supabaseAdmin
            .from('communications')
            .insert({
              client_id: clientId,
              user_id: userId,
              type: determineType(item),
              subject: extractSubject(item),
              content: content,
              direction: 'inbound' as 'inbound',
              sentiment_score: sentiment.score,
              sentiment_label: sentiment.label as 'positive' | 'neutral' | 'negative',
              communication_date: item.timestamp || item.date || new Date().toISOString()
            });
            
          if (!error) {
            results.communications_created++;
          }
        }
        
        results.processed++;
      }
      
    } catch (error) {
      results.errors.push(`Failed to process item: ${error}`);
    }
  }
  
  return results;
}

function extractClientInfo(item: any) {
  const info: any = {};
  
  // Email extraction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const content = JSON.stringify(item);
  const emails = content.match(emailRegex);
  if (emails) info.email = emails[0];
  
  // Phone extraction
  const phoneRegex = /(\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})/g;
  const phones = content.match(phoneRegex);
  if (phones) info.phone = phones[0];
  
  // Name extraction - try multiple fields
  info.name = item.name || item.client_name || item.contact_name || 
             item.from_name || item.sender || item.customer;
             
  // Company extraction
  info.company = item.company || item.organization || item.business;
  
  // If no name but have email, use email prefix
  if (!info.name && info.email) {
    info.name = info.email.split('@')[0];
  }
  
  return info;
}

function extractContent(item: any): string {
  return item.content || item.message || item.body || item.text || 
         item.description || item.notes || JSON.stringify(item);
}

function extractSubject(item: any): string {
  return item.subject || item.title || item.topic || 
         `Import from ${item.source || 'bulk upload'}`;
}

function determineType(item: any): string {
  if (item.type) return item.type;
  if (item.email || item.message?.includes('@')) return 'email';
  if (item.call || item.phone) return 'call';
  if (item.meeting) return 'meeting';
  return 'other';
}

async function findOrCreateClient(userId: string, clientInfo: any): Promise<string | null> {
  if (!clientInfo.email && !clientInfo.phone && !clientInfo.name) {
    return null;
  }
  
  // Try to find existing client
  let query = supabaseAdmin
    .from('clients')
    .select('id')
    .eq('user_id', userId);
    
  if (clientInfo.email) {
    query = query.eq('email', clientInfo.email);
  } else if (clientInfo.phone) {
    query = query.eq('phone', clientInfo.phone);
  } else if (clientInfo.name) {
    query = query.ilike('name', `%${clientInfo.name}%`);
  }
  
  const { data: existing } = await query.limit(1);
  
  if (existing && existing.length > 0) {
    return existing[0].id;
  }
  
  // Create new client
  const { data: newClient, error } = await supabaseAdmin
    .from('clients')
    .insert([{
      user_id: userId,
      name: clientInfo.name || 'Unknown',
      email: clientInfo.email,
      company: clientInfo.company,
      phone: clientInfo.phone,
      status: 'active',
      health_score: 50
    }])
    .select('id')
    .single();
    
  if (error || !newClient) return null;
  
  return newClient.id;
}

function analyzeSentiment(text: string): { score: number; label: 'positive' | 'neutral' | 'negative' } {
  const positiveWords = ['great', 'excellent', 'good', 'happy', 'satisfied', 'love', 'amazing', 'perfect', 'thank you', 'thanks', 'appreciate'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'problem', 'issue', 'complaint', 'disappointed'];
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  positiveWords.forEach(word => {
    const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
    score += matches;
  });
  
  negativeWords.forEach(word => {
    const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
    score -= matches;
  });
  
  // Normalize score
  const normalizedScore = Math.max(-1, Math.min(1, score * 0.1));
  
  let label: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (normalizedScore > 0.2) label = 'positive';
  else if (normalizedScore < -0.2) label = 'negative';
  
  return { score: normalizedScore, label };
}