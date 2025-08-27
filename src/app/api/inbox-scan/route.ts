import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

interface EmailContact {
  name: string;
  email: string;
  company?: string;
  frequency: number;
  lastContact: string;
  sampleSubjects: string[];
  avgSentiment: number;
  isExternal: boolean;
}

interface ClientSuggestion {
  name: string;
  email: string;
  company?: string;
  reason: string;
  confidence: number;
  emailCount: number;
  lastContact: string;
  sampleSubjects: string[];
  estimatedRevenue?: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has Gmail integration
    const { data: gmailIntegration } = await supabase
      .from('integrations')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('type', 'gmail')
      .eq('status', 'active')
      .single();

    if (!gmailIntegration) {
      return NextResponse.json({ 
        error: 'Gmail integration required',
        message: 'Please connect your Gmail account first to scan for client suggestions.'
      }, { status: 400 });
    }

    // Get access token
    const { data: tokenData } = await supabase
      .from('integration_tokens')
      .select('access_token')
      .eq('integration_id', gmailIntegration.id)
      .single();

    if (!tokenData) {
      return NextResponse.json({ 
        error: 'Gmail access token not found',
        message: 'Please reconnect your Gmail integration.'
      }, { status: 400 });
    }

    // Scan Gmail for potential clients
    const suggestions = await scanGmailForClients(tokenData.access_token, user.id, supabase);

    return NextResponse.json({ 
      suggestions,
      total: suggestions.length,
      message: `Found ${suggestions.length} potential clients from your Gmail inbox.`
    });

  } catch (error) {
    console.error('Inbox scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan inbox', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function scanGmailForClients(accessToken: string, userId: string, supabase: any): Promise<ClientSuggestion[]> {
  try {
    // Get recent emails (last 3 months)
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const query = `after:${Math.floor(threeMonthsAgo.getTime() / 1000)}`;
    
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=200`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const messages = data.messages || [];

    // Get existing clients to avoid duplicates
    const { data: existingClients } = await supabase
      .from('clients')
      .select('email')
      .eq('user_id', userId);

    const existingEmails = new Set(existingClients?.map((c: any) => c.email?.toLowerCase()) || []);

    // Analyze email contacts
    const contactMap = new Map<string, EmailContact>();
    const userDomains = new Set<string>();

    // Process messages in batches to avoid rate limits
    const batchSize = 20;
    for (let i = 0; i < Math.min(messages.length, 100); i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      await Promise.all(batch.map(async (message: any) => {
        try {
          const messageResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            {
              headers: { 'Authorization': `Bearer ${accessToken}` },
            }
          );

          if (messageResponse.ok) {
            const messageData = await messageResponse.json();
            await processMessage(messageData, contactMap, userDomains);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      }));

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Generate client suggestions
    const suggestions: ClientSuggestion[] = [];

    contactMap.forEach((contact, email) => {
      if (existingEmails.has(email.toLowerCase())) return;
      if (!contact.isExternal) return;
      
      const confidence = calculateConfidence(contact);
      
      if (confidence > 30) { // Only suggest contacts with reasonable confidence
        suggestions.push({
          name: contact.name,
          email: contact.email,
          company: contact.company,
          reason: generateReason(contact),
          confidence,
          emailCount: contact.frequency,
          lastContact: contact.lastContact,
          sampleSubjects: contact.sampleSubjects.slice(0, 3),
          estimatedRevenue: estimateRevenue(contact),
        });
      }
    });

    // Sort by confidence score
    suggestions.sort((a, b) => b.confidence - a.confidence);
    
    return suggestions.slice(0, 20); // Return top 20 suggestions

  } catch (error) {
    console.error('Gmail scanning error:', error);
    return [];
  }
}

async function processMessage(messageData: any, contactMap: Map<string, EmailContact>, userDomains: Set<string>) {
  const headers = messageData.payload?.headers || [];
  
  const fromHeader = headers.find((h: any) => h.name === 'From')?.value || '';
  const toHeader = headers.find((h: any) => h.name === 'To')?.value || '';
  const subjectHeader = headers.find((h: any) => h.name === 'Subject')?.value || '';
  const dateHeader = headers.find((h: any) => h.name === 'Date')?.value || '';

  // Extract email addresses
  const fromEmail = extractEmail(fromHeader);
  const toEmails = extractEmails(toHeader);

  // Track user domains
  toEmails.forEach(email => {
    const domain = email.split('@')[1];
    if (domain) userDomains.add(domain.toLowerCase());
  });

  // Process the 'from' contact
  if (fromEmail && !isInternalEmail(fromEmail, userDomains)) {
    const name = extractName(fromHeader) || fromEmail.split('@')[0];
    const company = extractCompany(fromHeader) || inferCompanyFromDomain(fromEmail);
    
    updateContact(contactMap, fromEmail, {
      name,
      email: fromEmail,
      company,
      subject: subjectHeader,
      date: dateHeader,
      isOutbound: false,
    });
  }

  // Process 'to' contacts (outbound emails)
  toEmails.forEach(email => {
    if (!isInternalEmail(email, userDomains)) {
      const name = email.split('@')[0]; // Basic name extraction
      const company = inferCompanyFromDomain(email);
      
      updateContact(contactMap, email, {
        name,
        email,
        company,
        subject: subjectHeader,
        date: dateHeader,
        isOutbound: true,
      });
    }
  });
}

function updateContact(contactMap: Map<string, EmailContact>, email: string, data: any) {
  const existing = contactMap.get(email.toLowerCase());
  
  if (existing) {
    existing.frequency++;
    existing.lastContact = new Date(data.date) > new Date(existing.lastContact) ? data.date : existing.lastContact;
    if (data.subject && !existing.sampleSubjects.includes(data.subject)) {
      existing.sampleSubjects.push(data.subject);
    }
  } else {
    contactMap.set(email.toLowerCase(), {
      name: data.name,
      email: email,
      company: data.company,
      frequency: 1,
      lastContact: data.date,
      sampleSubjects: data.subject ? [data.subject] : [],
      avgSentiment: 0.5, // Neutral default
      isExternal: true,
    });
  }
}

function calculateConfidence(contact: EmailContact): number {
  let score = 0;

  // Frequency score (0-40 points)
  if (contact.frequency >= 10) score += 40;
  else if (contact.frequency >= 5) score += 30;
  else if (contact.frequency >= 3) score += 20;
  else score += 10;

  // Recency score (0-20 points)
  const daysSinceLastContact = Math.floor((Date.now() - new Date(contact.lastContact).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceLastContact <= 7) score += 20;
  else if (daysSinceLastContact <= 30) score += 15;
  else if (daysSinceLastContact <= 60) score += 10;
  else score += 5;

  // Company information (0-20 points)
  if (contact.company) score += 20;
  else score += 0;

  // Professional email patterns (0-20 points)
  const businessKeywords = ['invoice', 'proposal', 'contract', 'meeting', 'project', 'service', 'payment', 'quote'];
  const hasBusinessContent = contact.sampleSubjects.some(subject => 
    businessKeywords.some(keyword => subject.toLowerCase().includes(keyword))
  );
  if (hasBusinessContent) score += 20;

  return Math.min(100, score);
}

function generateReason(contact: EmailContact): string {
  const reasons = [];
  
  if (contact.frequency >= 5) {
    reasons.push(`${contact.frequency} email exchanges`);
  }
  
  if (contact.company) {
    reasons.push(`works at ${contact.company}`);
  }

  const businessKeywords = ['invoice', 'proposal', 'contract', 'meeting', 'project'];
  const hasBusinessContent = contact.sampleSubjects.some(subject => 
    businessKeywords.some(keyword => subject.toLowerCase().includes(keyword))
  );
  
  if (hasBusinessContent) {
    reasons.push('business-related communications');
  }

  const daysSinceLastContact = Math.floor((Date.now() - new Date(contact.lastContact).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceLastContact <= 30) {
    reasons.push('recent contact');
  }

  return reasons.length > 0 ? reasons.join(', ') : 'frequent email contact';
}

function estimateRevenue(contact: EmailContact): number | undefined {
  // Simple revenue estimation based on company size indicators
  const domain = contact.email.split('@')[1];
  if (!domain) return undefined;

  // Fortune 500 domains might indicate larger revenue potential
  const enterprise = ['microsoft.com', 'google.com', 'amazon.com', 'apple.com'];
  if (enterprise.some(e => domain.includes(e))) return 50000;

  // Generic business domains
  if (domain.includes('corp') || domain.includes('inc') || domain.includes('llc')) return 25000;

  // Default estimate for business contacts
  return contact.frequency >= 10 ? 15000 : 5000;
}

// Helper functions
function extractEmail(headerValue: string): string | null {
  const emailMatch = headerValue.match(/<([^>]+)>/) || headerValue.match(/([^\s<>]+@[^\s<>]+)/);
  return emailMatch ? emailMatch[1].trim() : null;
}

function extractEmails(headerValue: string): string[] {
  const emails = headerValue.split(',').map(email => extractEmail(email.trim())).filter(Boolean);
  return emails as string[];
}

function extractName(headerValue: string): string | null {
  const nameMatch = headerValue.match(/^([^<]+)</);
  return nameMatch ? nameMatch[1].trim().replace(/"/g, '') : null;
}

function extractCompany(headerValue: string): string | null {
  // Look for company in parentheses or after "at"
  const companyMatch = headerValue.match(/\(([^)]+)\)/) || headerValue.match(/at\s+([^<]+)/i);
  return companyMatch ? companyMatch[1].trim() : null;
}

function inferCompanyFromDomain(email: string): string | null {
  const domain = email.split('@')[1];
  if (!domain) return null;

  // Skip common email providers
  const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
  if (commonProviders.includes(domain.toLowerCase())) return null;

  // Convert domain to potential company name
  const company = domain.replace(/\.(com|org|net|co\.uk|io)$/i, '')
    .split('.')[0]
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  return company;
}

function isInternalEmail(email: string, userDomains: Set<string>): boolean {
  const domain = email.split('@')[1];
  return domain ? userDomains.has(domain.toLowerCase()) : false;
}