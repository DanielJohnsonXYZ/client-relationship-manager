import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { headers } from 'next/headers';

interface IncomingData {
  source: string;
  type: 'email' | 'communication' | 'client_update' | 'unstructured';
  data: any;
  timestamp?: string;
  client_identifier?: string; // email, phone, or name to match existing clients
}

// Helper function to extract client information from unstructured data
function extractClientInfo(data: any): Partial<any> {
  const extracted: any = {};
  
  // Try to extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = JSON.stringify(data).match(emailRegex);
  if (emails && emails.length > 0) {
    extracted.email = emails[0];
  }
  
  // Try to extract phone numbers
  const phoneRegex = /(\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})/g;
  const phones = JSON.stringify(data).match(phoneRegex);
  if (phones && phones.length > 0) {
    extracted.phone = phones[0];
  }
  
  // Try to extract company names (basic patterns)
  if (data.company || data.organization || data.business) {
    extracted.company = data.company || data.organization || data.business;
  }
  
  // Try to extract names
  if (data.name || data.contact_name || data.client_name) {
    extracted.name = data.name || data.contact_name || data.client_name;
  }
  
  return extracted;
}

// Helper function to find existing client
async function findClient(userID: string, identifier: string): Promise<string | null> {
  const { data: clients, error } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('user_id', userID)
    .or(`email.eq.${identifier},phone.eq.${identifier},name.ilike.%${identifier}%`)
    .limit(1);
    
  if (error || !clients || clients.length === 0) return null;
  return clients[0].id;
}

// Helper function to analyze sentiment (basic implementation)
function analyzeSentiment(text: string): { score: number; label: 'positive' | 'neutral' | 'negative' } {
  const positiveWords = ['great', 'excellent', 'good', 'happy', 'satisfied', 'love', 'amazing', 'perfect', 'thank you'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'problem', 'issue', 'complaint'];
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 1;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 1;
  });
  
  // Normalize score to -1 to 1 range
  const normalizedScore = Math.max(-1, Math.min(1, score * 0.1));
  
  let label: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (normalizedScore > 0.2) label = 'positive';
  else if (normalizedScore < -0.2) label = 'negative';
  
  return { score: normalizedScore, label };
}

export async function POST(request: NextRequest) {
  try {
    // Verify API key or webhook signature
    const headersList = headers();
    const apiKey = headersList.get('x-api-key');
    const webhookSignature = headersList.get('x-webhook-signature');
    
    // Basic API key validation (you should use proper authentication)
    if (!apiKey && !webhookSignature) {
      return NextResponse.json({ error: 'Missing authentication' }, { status: 401 });
    }
    
    const incomingData: IncomingData = await request.json();
    
    if (!incomingData.source || !incomingData.type || !incomingData.data) {
      return NextResponse.json({ 
        error: 'Missing required fields: source, type, data' 
      }, { status: 400 });
    }
    
    // Extract user ID from API key or use provided user_id
    const userID = incomingData.data.user_id || '6cb355ae-b71c-4784-9500-eeb0b89ff8fd'; // Your user ID as fallback
    
    let result: any = { processed: false };
    
    // Process based on data type
    switch (incomingData.type) {
      case 'email':
        result = await processEmail(userID, incomingData);
        break;
        
      case 'communication':
        result = await processCommunication(userID, incomingData);
        break;
        
      case 'client_update':
        result = await processClientUpdate(userID, incomingData);
        break;
        
      case 'unstructured':
        result = await processUnstructuredData(userID, incomingData);
        break;
        
      default:
        return NextResponse.json({ 
          error: `Unsupported data type: ${incomingData.type}` 
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Data processed successfully',
      ...result
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processEmail(userID: string, incomingData: IncomingData) {
  const { data } = incomingData;
  
  // Extract client info
  const clientInfo = extractClientInfo(data);
  let clientId = null;
  
  if (data.from_email || clientInfo.email) {
    clientId = await findClient(userID, data.from_email || clientInfo.email);
  }
  
  // If no client found, create one
  if (!clientId && (data.from_email || clientInfo.email || data.from_name)) {
    const { data: newClient, error } = await supabaseAdmin
      .from('clients')
      .insert([{
        user_id: userID,
        name: data.from_name || clientInfo.name || data.from_email?.split('@')[0] || 'Unknown',
        email: data.from_email || clientInfo.email,
        company: clientInfo.company,
        status: 'active'
      }])
      .select()
      .single();
      
    if (!error && newClient) {
      clientId = newClient.id;
    }
  }
  
  // Analyze sentiment
  const content = data.body || data.content || data.message || '';
  const sentiment = analyzeSentiment(content);
  
  // Create communication record
  if (clientId) {
    await supabaseAdmin
      .from('communications')
      .insert([{
        client_id: clientId,
        user_id: userID,
        type: 'email',
        subject: data.subject,
        content: content,
        direction: 'inbound',
        sentiment_score: sentiment.score,
        sentiment_label: sentiment.label,
        communication_date: data.timestamp || new Date().toISOString()
      }]);
  }
  
  return { 
    processed: true, 
    client_created: !clientId,
    client_id: clientId,
    sentiment: sentiment
  };
}

async function processCommunication(userID: string, incomingData: IncomingData) {
  const { data } = incomingData;
  
  let clientId = null;
  if (incomingData.client_identifier) {
    clientId = await findClient(userID, incomingData.client_identifier);
  }
  
  if (!clientId) {
    return { processed: false, error: 'Client not found' };
  }
  
  const content = data.message || data.content || data.text || '';
  const sentiment = analyzeSentiment(content);
  
  await supabaseAdmin
    .from('communications')
    .insert([{
      client_id: clientId,
      user_id: userID,
      type: data.type || 'other',
      subject: data.subject,
      content: content,
      direction: data.direction || 'inbound',
      sentiment_score: sentiment.score,
      sentiment_label: sentiment.label,
      communication_date: data.timestamp || new Date().toISOString()
    }]);
    
  return { processed: true, client_id: clientId, sentiment: sentiment };
}

async function processClientUpdate(userID: string, incomingData: IncomingData) {
  const { data } = incomingData;
  
  let clientId = null;
  if (incomingData.client_identifier) {
    clientId = await findClient(userID, incomingData.client_identifier);
  }
  
  if (!clientId) {
    // Create new client if identifier provided
    if (data.email || data.name) {
      const { data: newClient, error } = await supabaseAdmin
        .from('clients')
        .insert([{
          user_id: userID,
          name: data.name || data.email?.split('@')[0] || 'Unknown',
          email: data.email,
          company: data.company,
          phone: data.phone,
          status: data.status || 'active',
          health_score: data.health_score || 50,
          total_revenue: data.revenue || 0,
          notes: data.notes
        }])
        .select()
        .single();
        
      if (!error && newClient) {
        clientId = newClient.id;
      }
    }
  } else {
    // Update existing client
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.company) updateData.company = data.company;
    if (data.phone) updateData.phone = data.phone;
    if (data.status) updateData.status = data.status;
    if (data.health_score !== undefined) updateData.health_score = data.health_score;
    if (data.revenue !== undefined) updateData.total_revenue = data.revenue;
    if (data.notes) updateData.notes = data.notes;
    
    await supabaseAdmin
      .from('clients')
      .update(updateData)
      .eq('id', clientId);
  }
  
  return { processed: true, client_id: clientId };
}

async function processUnstructuredData(userID: string, incomingData: IncomingData) {
  const { data } = incomingData;
  
  // Extract structured information from unstructured data
  const extractedInfo = extractClientInfo(data);
  
  // Try to find patterns in the data
  const text = JSON.stringify(data);
  const sentiment = analyzeSentiment(text);
  
  // Look for revenue/payment information
  const revenueRegex = /\$([0-9,]+\.?\d*)/g;
  const revenueMatches = text.match(revenueRegex);
  let revenue = 0;
  if (revenueMatches) {
    revenue = parseFloat(revenueMatches[0].replace(/[$,]/g, ''));
  }
  
  // Find or create client
  let clientId = null;
  if (extractedInfo.email || extractedInfo.phone) {
    clientId = await findClient(userID, extractedInfo.email || extractedInfo.phone);
  }
  
  if (!clientId && (extractedInfo.email || extractedInfo.name)) {
    const { data: newClient, error } = await supabaseAdmin
      .from('clients')
      .insert([{
        user_id: userID,
        name: extractedInfo.name || extractedInfo.email?.split('@')[0] || 'Unknown',
        email: extractedInfo.email,
        company: extractedInfo.company,
        phone: extractedInfo.phone,
        status: 'active',
        total_revenue: revenue
      }])
      .select()
      .single();
      
    if (!error && newClient) {
      clientId = newClient.id;
    }
  }
  
  // Create communication record if we have meaningful content
  if (clientId && text.length > 50) {
    await supabaseAdmin
      .from('communications')
      .insert([{
        client_id: clientId,
        user_id: userID,
        type: 'other',
        subject: `Unstructured data from ${incomingData.source}`,
        content: JSON.stringify(data, null, 2),
        direction: 'inbound',
        sentiment_score: sentiment.score,
        sentiment_label: sentiment.label,
        communication_date: incomingData.timestamp || new Date().toISOString()
      }]);
  }
  
  return {
    processed: true,
    extracted_info: extractedInfo,
    client_id: clientId,
    sentiment: sentiment,
    revenue_detected: revenue
  };
}