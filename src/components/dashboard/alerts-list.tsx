import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Alert {
  id: string;
  title: string;
  priority: string;
  created_at: string;
}

interface AlertsListProps {
  alerts: Alert[];
}

const priorityColors = {
  critical: 'text-red-600 bg-red-100',
  high: 'text-orange-600 bg-orange-100',
  medium: 'text-yellow-600 bg-yellow-100',
  low: 'text-blue-600 bg-blue-100',
};

export function AlertsList({ alerts }: AlertsListProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-6">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
        <p className="mt-1 text-sm text-gray-500">
          Everything looks good! No alerts to review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {alert.title}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(alert.created_at).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              priorityColors[alert.priority as keyof typeof priorityColors]
            }`}
          >
            {alert.priority}
          </span>
        </div>
      ))}
    </div>
  );
}