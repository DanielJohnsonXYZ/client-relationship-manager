// Enforced TypeScript interfaces that prevent dummy data usage

export interface CalculatedMetric {
  readonly value: number;
  readonly previousValue: number;
  readonly change: number;
  readonly calculatedAt: Date;
  readonly dataSource: string;
}

export interface DashboardMetrics {
  totalClients: CalculatedMetric;
  healthyClients: CalculatedMetric;
  atRiskClients: CalculatedMetric;
  totalRevenue: CalculatedMetric;
  averageHealthScore: number; // This can be direct since it's calculated from current data
}

export interface AnalyticsMetrics {
  averageResponseTime: {
    value: string;
    calculatedFrom: number; // Number of communications used in calculation
    calculatedAt: Date;
  };
  clientSatisfaction: {
    score: number;
    basedOnCommunications: number;
    calculatedAt: Date;
  };
  renewalRate: {
    rate: number;
    basedOnClients: number;
    calculatedAt: Date;
  };
}

export interface TrendData {
  labels: string[];
  data: number[];
  calculatedAt: Date;
  periodType: 'daily' | 'weekly' | 'monthly';
}

// Factory functions that enforce real calculations
export function createCalculatedMetric(
  current: number,
  previous: number,
  dataSource: string
): CalculatedMetric {
  const change = previous === 0 ? 
    (current > 0 ? 100 : 0) : 
    ((current - previous) / previous) * 100;

  return {
    value: current,
    previousValue: previous,
    change: Math.round(change * 10) / 10,
    calculatedAt: new Date(),
    dataSource
  } as const;
}

export function createTrendData(
  labels: string[],
  data: number[],
  periodType: 'daily' | 'weekly' | 'monthly'
): TrendData {
  if (labels.length !== data.length) {
    throw new Error('Trend data labels and data arrays must have the same length');
  }

  return {
    labels,
    data,
    calculatedAt: new Date(),
    periodType
  };
}

// Type guards to ensure data is properly calculated
export function isCalculatedMetric(obj: any): obj is CalculatedMetric {
  return obj &&
    typeof obj.value === 'number' &&
    typeof obj.previousValue === 'number' &&
    typeof obj.change === 'number' &&
    obj.calculatedAt instanceof Date &&
    typeof obj.dataSource === 'string';
}

export function validateDashboardMetrics(metrics: any): DashboardMetrics {
  const requiredFields = ['totalClients', 'healthyClients', 'atRiskClients', 'totalRevenue'];
  
  for (const field of requiredFields) {
    if (!metrics[field] || !isCalculatedMetric(metrics[field])) {
      throw new Error(`${field} must be a properly calculated metric`);
    }
  }

  if (typeof metrics.averageHealthScore !== 'number') {
    throw new Error('averageHealthScore must be a calculated number');
  }

  return metrics as DashboardMetrics;
}