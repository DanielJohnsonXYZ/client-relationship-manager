import { 
  ChartBarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface Insight {
  id: string;
  type: 'trend' | 'pattern' | 'risk' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  created_at: string;
  data?: any;
}

interface InsightCardProps {
  insight: Insight;
}

const typeConfig = {
  trend: {
    icon: ArrowTrendingUpIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  pattern: {
    icon: ChartBarIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  risk: {
    icon: ExclamationTriangleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  opportunity: {
    icon: LightBulbIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
};

const impactColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800',
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'text-green-600';
  if (confidence >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

export function InsightCard({ insight }: InsightCardProps) {
  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-6`}>
      <div className="flex items-start space-x-4">
        <div className={`p-2 rounded-full ${config.bgColor}`}>
          <Icon className={`h-6 w-6 ${config.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              {insight.title}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${impactColors[insight.impact]}`}>
                {insight.impact} impact
              </span>
              <span className={`text-sm font-medium ${getConfidenceColor(insight.confidence)}`}>
                {insight.confidence}% confidence
              </span>
            </div>
          </div>
          
          <p className="text-gray-700 mb-3">
            {insight.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="capitalize">
              {insight.type} insight
            </span>
            <span>
              Generated {new Date(insight.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}