import { createClientSupabase } from './supabase-client';

export interface HealthFactors {
  communicationFrequency: number; // 0-25 points
  recentActivity: number; // 0-25 points  
  sentimentScore: number; // 0-25 points
  meetingCadence: number; // 0-25 points
}

export interface ClientHealthData {
  client_id: string;
  health_score: number;
  factors: HealthFactors;
  last_calculated: string;
  needs_attention: boolean;
}

export async function calculateClientHealthScore(clientId: string, userId: string): Promise<ClientHealthData> {
  const supabase = createClientSupabase();
  
  // Get client's communication history (last 90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: communications } = await supabase
    .from('communications')
    .select('*')
    .eq('client_id', clientId)
    .eq('user_id', userId)
    .gte('communication_date', ninetyDaysAgo)
    .order('communication_date', { ascending: false });

  // Get external activities from integrations (last 90 days) - handle if table doesn't exist
  let externalActivities = [];
  try {
    const { data } = await supabase
      .from('external_activities')
      .select('*')
      .eq('client_id', clientId)
      .gte('activity_date', ninetyDaysAgo)
      .order('activity_date', { ascending: false });
    externalActivities = data || [];
  } catch (error) {
    // Table might not exist yet, continue with just communications
    console.log('External activities table not found, using communications only');
    externalActivities = [];
  }

  const allActivities = [...(communications || []), ...externalActivities];
  
  // Calculate factors
  const factors = {
    communicationFrequency: calculateCommunicationFrequency(allActivities),
    recentActivity: calculateRecentActivity(allActivities),
    sentimentScore: calculateSentimentScore(communications || []),
    meetingCadence: calculateMeetingCadence(allActivities),
  };

  const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);
  const needsAttention = totalScore < 50 || factors.recentActivity < 10;

  return {
    client_id: clientId,
    health_score: Math.round(totalScore),
    factors,
    last_calculated: new Date().toISOString(),
    needs_attention: needsAttention,
  };
}

function calculateCommunicationFrequency(activities: any[]): number {
  // Score based on communication frequency (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const recentActivities = activities.filter(activity => {
    const activityDate = new Date(activity.communication_date || activity.activity_date);
    return activityDate >= thirtyDaysAgo;
  });

  const commCount = recentActivities.length;
  
  // Score: 25 points for 8+ communications, scaled down
  if (commCount >= 8) return 25;
  if (commCount >= 5) return 20;
  if (commCount >= 3) return 15;
  if (commCount >= 1) return 10;
  return 0;
}

function calculateRecentActivity(activities: any[]): number {
  // Score based on how recent the last activity was
  if (!activities.length) return 0;

  const lastActivityDate = new Date(activities[0].communication_date || activities[0].activity_date);
  const daysSinceLastActivity = (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24);

  // Score: 25 points for activity within 7 days, scaled down
  if (daysSinceLastActivity <= 7) return 25;
  if (daysSinceLastActivity <= 14) return 20;
  if (daysSinceLastActivity <= 30) return 15;
  if (daysSinceLastActivity <= 60) return 10;
  if (daysSinceLastActivity <= 90) return 5;
  return 0;
}

function calculateSentimentScore(communications: any[]): number {
  // Score based on average sentiment of recent communications
  if (!communications.length) return 12.5; // Neutral score when no data

  const sentiments = communications
    .filter(comm => comm.sentiment_score !== null && comm.sentiment_score !== undefined)
    .map(comm => comm.sentiment_score);

  if (!sentiments.length) return 12.5;

  const avgSentiment = sentiments.reduce((sum, sentiment) => sum + sentiment, 0) / sentiments.length;
  
  // Convert sentiment (-1 to +1) to score (0 to 25)
  // Positive sentiment (0.1 to 1) -> 15-25 points
  // Neutral sentiment (-0.1 to 0.1) -> 10-15 points  
  // Negative sentiment (-1 to -0.1) -> 0-10 points
  
  if (avgSentiment >= 0.1) {
    return 15 + (avgSentiment * 10); // 15-25 points
  } else if (avgSentiment >= -0.1) {
    return 12.5; // Neutral
  } else {
    return 10 + ((avgSentiment + 1) * 10); // 0-10 points
  }
}

function calculateMeetingCadence(activities: any[]): number {
  // Score based on meeting frequency (video calls, meetings)
  const meetings = activities.filter(activity => 
    (activity.type === 'meeting' || activity.type === 'call' || 
     activity.activity_type === 'meeting' || activity.activity_type === 'video')
  );

  const meetingCount = meetings.length;
  
  // Score: 25 points for 4+ meetings in 90 days, scaled down
  if (meetingCount >= 4) return 25;
  if (meetingCount >= 2) return 20;
  if (meetingCount >= 1) return 15;
  return 5; // Minimal score even with no meetings
}

export async function updateAllClientHealthScores(userId: string): Promise<number> {
  const supabase = createClientSupabase();
  
  // Get all clients for the user
  const { data: clients } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId);

  if (!clients) return 0;

  let updated = 0;
  for (const client of clients) {
    try {
      const healthData = await calculateClientHealthScore(client.id, userId);
      
      // Update the client's health score
      await supabase
        .from('clients')
        .update({
          health_score: healthData.health_score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', client.id);
      
      updated++;
    } catch (error) {
      console.error(`Failed to update health score for client ${client.id}:`, error);
    }
  }

  return updated;
}

export function getHealthScoreColor(score: number): string {
  if (score >= 75) return 'text-green-600 bg-green-100';
  if (score >= 50) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
}

export function getHealthScoreLabel(score: number): string {
  if (score >= 75) return 'Healthy';
  if (score >= 50) return 'At Risk';
  return 'Critical';
}