// Environment variable validation
export interface EnvironmentConfig {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  ANTHROPIC_API_KEY: string
  NEXT_PUBLIC_BASE_URL: string
  SLACK_CLIENT_ID?: string
  SLACK_CLIENT_SECRET?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
}

export function validateEnvironment(): EnvironmentConfig {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
    'NEXT_PUBLIC_BASE_URL'
  ] as const

  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`
    
    // In development, warn but continue with dummy values
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️  ${errorMessage}`)
      console.warn('Using dummy values for development. Set proper values in .env.local for full functionality.')
    } else {
      // In production, this should fail
      throw new Error(errorMessage)
    }
  }

  // Check if integrations are configured
  const hasSlackConfig = process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET
  const hasGoogleConfig = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET

  if (!hasSlackConfig && !hasGoogleConfig) {
    console.warn('⚠️  No integration credentials found. Slack and Gmail integrations will not work.')
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-key',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'dummy-api-key',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
    SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  }
}

// Validate on module load
export const env = validateEnvironment()

// Helper to check if a service is configured
export const isSlackConfigured = () => !!(env.SLACK_CLIENT_ID && env.SLACK_CLIENT_SECRET)
export const isGmailConfigured = () => !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
export const isAnthropicConfigured = () => env.ANTHROPIC_API_KEY !== 'dummy-api-key'