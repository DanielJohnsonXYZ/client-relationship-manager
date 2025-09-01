import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  timePeriod?: string; // e.g., "last month", "last quarter", "last 30 days"
}

export function MetricCard({ title, value, change, changeType, timePeriod = "last month" }: MetricCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
      <dd className="mt-1 text-3xl font-semibold text-gray-900">{value}</dd>
      <div className="mt-2 flex items-center text-sm">
        {changeType === 'neutral' || change === 0 ? (
          <span className="text-gray-500">No change</span>
        ) : (
          <>
            {changeType === 'positive' ? (
              <ArrowUpIcon className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-500" />
            )}
            <span
              className={`ml-1 ${
                changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {Math.abs(change)}%
            </span>
            <span className="ml-1 text-gray-500">from {timePeriod}</span>
          </>
        )}
      </div>
    </div>
  );
}