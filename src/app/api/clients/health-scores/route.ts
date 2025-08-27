import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { updateAllClientHealthScores } from '@/lib/health-calculator';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Recalculate health scores for all user's clients
    const updatedCount = await updateAllClientHealthScores(user.id);

    return NextResponse.json({ 
      message: 'Health scores updated successfully',
      updatedCount 
    });

  } catch (error) {
    console.error('Error updating health scores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to manually trigger health score calculation for a specific client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    
    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId parameter' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Import the calculateClientHealthScore function
    const { calculateClientHealthScore } = await import('@/lib/health-calculator');
    const healthData = await calculateClientHealthScore(clientId, user.id);

    // Update the client's health score in the database
    await supabase
      .from('clients')
      .update({
        health_score: healthData.health_score,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)
      .eq('user_id', user.id);

    return NextResponse.json(healthData);

  } catch (error) {
    console.error('Error calculating health score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}