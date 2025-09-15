import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function getUser(request?: NextRequest) {
  try {
    // Get auth token from request headers or cookies
    let token: string | null = null
    
    if (request) {
      // Try Authorization header first
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }
    
    if (!token) {
      // Try cookies as fallback
      const cookieStore = cookies()
      const authCookie = cookieStore.get('sb-access-token')
      token = authCookie?.value || null
    }
    
    if (!token) {
      return { user: null, error: 'No authentication token found' }
    }

    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid token' }
    }

    return { user, error: null }
  } catch (error) {
    console.error('Auth error:', error)
    return { user: null, error: 'Authentication failed' }
  }
}

export async function requireAuth(request?: NextRequest) {
  const { user, error } = await getUser(request)
  
  if (!user) {
    throw new Error(error || 'Authentication required')
  }
  
  return user
}