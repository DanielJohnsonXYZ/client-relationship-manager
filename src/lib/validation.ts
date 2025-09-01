// Data validation layer to prevent dummy data regression

const KNOWN_DUMMY_VALUES = {
  percentageChanges: [5.2, 2.1, -1.3, 12.3, -2.5, 8.7, 15.2],
  responseTimes: ['2.1 hours', '3.2 hours', '4.5 hours', '1.5 hours'],
  healthScores: [88, 92, 75, 63] // Common dummy health scores
};

export class DummyDataError extends Error {
  constructor(field: string, value: any, source: string) {
    super(`Dummy data detected in ${source}.${field}: ${value}. Use calculated values instead.`);
    this.name = 'DummyDataError';
  }
}

export function validateMetricChange(change: number, source: string): number {
  if (KNOWN_DUMMY_VALUES.percentageChanges.includes(Math.abs(change))) {
    throw new DummyDataError('change', change, source);
  }
  return change;
}

export function validateResponseTime(responseTime: string, source: string): string {
  if (KNOWN_DUMMY_VALUES.responseTimes.includes(responseTime)) {
    throw new DummyDataError('responseTime', responseTime, source);
  }
  return responseTime;
}

export function validateEnvironmentVariables(): void {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];

  const missingOrPlaceholder = requiredEnvVars.filter(key => {
    const value = process.env[key];
    return !value || 
           value.includes('placeholder') || 
           value.includes('your-') ||
           value === 'undefined';
  });

  if (missingOrPlaceholder.length > 0) {
    throw new Error(
      `Missing or placeholder environment variables: ${missingOrPlaceholder.join(', ')}\n` +
      'Set real values in your .env.local file before starting the application.'
    );
  }
}

export function validateCalculatedMetric<T>(
  value: T, 
  fieldName: string, 
  source: string,
  validator?: (val: T) => boolean
): T {
  if (value === null || value === undefined) {
    throw new Error(`${source}.${fieldName} cannot be null or undefined. Ensure proper calculation.`);
  }

  if (validator && !validator(value)) {
    throw new Error(`${source}.${fieldName} failed custom validation: ${value}`);
  }

  return value;
}

// Utility to ensure percentage changes are calculated, not hardcoded
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  const change = ((current - previous) / previous) * 100;
  return Math.round(change * 10) / 10; // Round to 1 decimal place
}

// Utility to calculate response time from communication timestamps
export function calculateAverageResponseTime(communications: Array<{
  communication_date: string;
  response_date?: string;
}>): string {
  const responseTimes = communications
    .filter(comm => comm.response_date)
    .map(comm => {
      const sent = new Date(comm.communication_date).getTime();
      const responded = new Date(comm.response_date!).getTime();
      return responded - sent;
    });

  if (responseTimes.length === 0) {
    return 'No responses tracked';
  }

  const avgMs = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const avgHours = avgMs / (1000 * 60 * 60);

  if (avgHours < 1) {
    return `${Math.round(avgMs / (1000 * 60))} minutes`;
  }

  return `${Math.round(avgHours * 10) / 10} hours`;
}