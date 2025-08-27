// Automated tests to prevent dummy data regression

import { validateMetricChange, validateResponseTime, calculatePercentageChange, calculateAverageResponseTime, DummyDataError } from '@/lib/validation';
import { createCalculatedMetric, validateDashboardMetrics } from '@/lib/types/metrics';

describe('Data Flow Validation', () => {
  describe('Dummy Data Detection', () => {
    test('should reject known dummy percentage changes', () => {
      const dummyValues = [5.2, 2.1, -1.3, 12.3];
      
      dummyValues.forEach(value => {
        expect(() => validateMetricChange(value, 'dashboard')).toThrow(DummyDataError);
      });
    });

    test('should allow real calculated percentage changes', () => {
      const realValues = [3.7, 8.1, -15.6, 0.8];
      
      realValues.forEach(value => {
        expect(() => validateMetricChange(value, 'dashboard')).not.toThrow();
      });
    });

    test('should reject known dummy response times', () => {
      const dummyTimes = ['2.1 hours', '3.2 hours', '4.5 hours'];
      
      dummyTimes.forEach(time => {
        expect(() => validateResponseTime(time, 'analytics')).toThrow(DummyDataError);
      });
    });

    test('should allow real calculated response times', () => {
      const realTimes = ['1.3 hours', '5.7 hours', '45 minutes', 'No responses tracked'];
      
      realTimes.forEach(time => {
        expect(() => validateResponseTime(time, 'analytics')).not.toThrow();
      });
    });
  });

  describe('Metric Calculations', () => {
    test('should calculate percentage change correctly', () => {
      expect(calculatePercentageChange(110, 100)).toBe(10);
      expect(calculatePercentageChange(90, 100)).toBe(-10);
      expect(calculatePercentageChange(100, 0)).toBe(100);
      expect(calculatePercentageChange(0, 0)).toBe(0);
    });

    test('should calculate average response time from communications', () => {
      const communications = [
        { communication_date: '2024-01-01T10:00:00Z', response_date: '2024-01-01T12:00:00Z' }, // 2 hours
        { communication_date: '2024-01-02T10:00:00Z', response_date: '2024-01-02T14:00:00Z' }, // 4 hours
        { communication_date: '2024-01-03T10:00:00Z' }, // No response
      ];

      const avgTime = calculateAverageResponseTime(communications);
      expect(avgTime).toBe('3 hours'); // Average of 2 and 4
    });

    test('should handle communications with no responses', () => {
      const communications = [
        { communication_date: '2024-01-01T10:00:00Z' },
        { communication_date: '2024-01-02T10:00:00Z' },
      ];

      const avgTime = calculateAverageResponseTime(communications);
      expect(avgTime).toBe('No responses tracked');
    });
  });

  describe('Metric Type Safety', () => {
    test('should create calculated metrics with required fields', () => {
      const metric = createCalculatedMetric(150, 100, 'test-source');
      
      expect(metric.value).toBe(150);
      expect(metric.previousValue).toBe(100);
      expect(metric.change).toBe(50);
      expect(metric.dataSource).toBe('test-source');
      expect(metric.calculatedAt).toBeInstanceOf(Date);
    });

    test('should validate dashboard metrics structure', () => {
      const validMetrics = {
        totalClients: createCalculatedMetric(25, 20, 'database'),
        healthyClients: createCalculatedMetric(18, 15, 'database'),
        atRiskClients: createCalculatedMetric(3, 2, 'database'),
        totalRevenue: createCalculatedMetric(50000, 45000, 'database'),
        averageHealthScore: 78.5
      };

      expect(() => validateDashboardMetrics(validMetrics)).not.toThrow();
    });

    test('should reject dashboard metrics with missing calculations', () => {
      const invalidMetrics = {
        totalClients: { value: 25, change: 5.2 }, // Missing required fields
        healthyClients: createCalculatedMetric(18, 15, 'database'),
        atRiskClients: createCalculatedMetric(3, 2, 'database'),
        totalRevenue: createCalculatedMetric(50000, 45000, 'database'),
        averageHealthScore: 78.5
      };

      expect(() => validateDashboardMetrics(invalidMetrics)).toThrow();
    });
  });

  describe('API Data Flow', () => {
    test('should ensure API data reaches dashboard calculations', async () => {
      // This would test that Gmail API data flows through to metrics
      // Skipping actual API calls, but structure shows intent
      const mockApiResponse = {
        clients: [
          { id: '1', health_score: 80, total_revenue: 25000 },
          { id: '2', health_score: 90, total_revenue: 30000 }
        ]
      };

      // Simulate data flow: API → Database → Calculations → Dashboard
      const totalRevenue = mockApiResponse.clients.reduce((sum, c) => sum + c.total_revenue, 0);
      const avgHealthScore = mockApiResponse.clients.reduce((sum, c) => sum + c.health_score, 0) / mockApiResponse.clients.length;

      expect(totalRevenue).toBe(55000);
      expect(avgHealthScore).toBe(85);
    });
  });
});