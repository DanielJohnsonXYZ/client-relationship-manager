// Environment variable validation - prevents app startup with invalid config

export function validateEnvironment(): void {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];

  const optionalEnvVars = [
    'FIREFLIES_API_KEY',
    'LOOM_CLIENT_ID', 
    'SLACK_CLIENT_ID',
    'CALENDLY_CLIENT_ID',
    'ZOOM_CLIENT_ID'
  ];

  // Check required variables
  const missingRequired = requiredEnvVars.filter(key => {
    const value = process.env[key];
    return !value || isPlaceholderValue(value);
  });

  if (missingRequired.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingRequired.forEach(key => {
      console.error(`   ${key}: ${process.env[key] || 'not set'}`);
    });
    throw new Error(
      `Missing required environment variables: ${missingRequired.join(', ')}\n` +
      'Create a .env.local file with real values before starting the application.\n' +
      'See .env.example for the required format.'
    );
  }

  // Warn about missing optional variables
  const missingOptional = optionalEnvVars.filter(key => {
    const value = process.env[key];
    return !value || isPlaceholderValue(value);
  });

  if (missingOptional.length > 0) {
    console.warn('⚠️  Optional environment variables not configured:');
    missingOptional.forEach(key => {
      console.warn(`   ${key}: integration will be disabled`);
    });
  }

  // Validate specific formats
  validateSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  validateGoogleClientId(process.env.GOOGLE_CLIENT_ID!);

  console.log('✅ Environment validation passed');
}

function isPlaceholderValue(value: string): boolean {
  const placeholderPatterns = [
    'placeholder',
    'your-',
    'undefined',
    'null',
    'example',
    'demo',
    'test-key',
    'fake-'
  ];

  return placeholderPatterns.some(pattern => 
    value.toLowerCase().includes(pattern.toLowerCase())
  );
}

function validateSupabaseUrl(url: string): void {
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    throw new Error(
      `Invalid Supabase URL format: ${url}\n` +
      'Expected format: https://your-project.supabase.co'
    );
  }
}

function validateGoogleClientId(clientId: string): void {
  // Google Client IDs have a specific format
  if (!clientId.includes('.apps.googleusercontent.com')) {
    throw new Error(
      `Invalid Google Client ID format: ${clientId}\n` +
      'Expected format: xxxxx.apps.googleusercontent.com'
    );
  }
}

// Call this at application startup
if (typeof window === 'undefined') { // Server-side only
  try {
    validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
}