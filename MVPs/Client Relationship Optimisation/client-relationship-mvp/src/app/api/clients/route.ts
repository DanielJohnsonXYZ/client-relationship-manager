import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { getUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUser(request)
    
    if (!user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    const { data: clients, error: dbError } = await supabase
      .from('clients')
      .select('id, name, company, email, status, health_score, last_communication')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    return NextResponse.json(clients || [])
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUser(request)
    
    if (!user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
    }

    // For MVP, client creation is disabled - clients are created from communications automatically
    return NextResponse.json({ 
      error: 'Client creation via API is not available in MVP. Clients are created automatically from communications.' 
    }, { status: 501 })

  } catch (error) {
    console.error('Error in client POST endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}