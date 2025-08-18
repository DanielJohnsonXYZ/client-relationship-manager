import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface Alert {
  id: string;
  user_id: string;
  client_id: string | null;
  type: 'payment_risk' | 'low_engagement' | 'opportunity' | 'follow_up_needed' | 'contract_renewal';
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
  clients?: {
    name: string;
    company: string | null;
  };
}

interface AlertCardProps {
  alert: Alert;
  onUpdate: (alertId: string, updates: Partial<Alert>) => void;
}

const priorityColors = {
  critical: 'border-red-500 bg-red-50',
  high: 'border-orange-500 bg-orange-50',
  medium: 'border-yellow-500 bg-yellow-50',
  low: 'border-blue-500 bg-blue-50',
};

const priorityTextColors = {
  critical: 'text-red-700',
  high: 'text-orange-700',
  medium: 'text-yellow-700',
  low: 'text-blue-700',
};

const typeLabels = {
  payment_risk: 'Payment Risk',
  low_engagement: 'Low Engagement',
  opportunity: 'Opportunity',
  follow_up_needed: 'Follow-up Needed',
  contract_renewal: 'Contract Renewal',
};

const statusColors = {
  active: 'bg-red-100 text-red-800',
  acknowledged: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
};

export function AlertCard({ alert, onUpdate }: AlertCardProps) {
  const handleAcknowledge = () => {
    onUpdate(alert.id, { status: 'acknowledged' });
  };

  const handleResolve = () => {
    onUpdate(alert.id, { 
      status: 'resolved',
      resolved_at: new Date().toISOString()
    });
  };

  const handleDismiss = () => {
    onUpdate(alert.id, { status: 'dismissed' });
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 bg-white shadow ${priorityColors[alert.priority]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[alert.status]}`}>
              {alert.status}
            </span>
            <span className={`text-xs font-medium ${priorityTextColors[alert.priority]}`}>
              {alert.priority.toUpperCase()} PRIORITY
            </span>
            <span className="text-xs text-gray-500">
              {typeLabels[alert.type]}
            </span>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {alert.title}
          </h3>
          
          {alert.description && (
            <p className="text-sm text-gray-600 mb-2">
              {alert.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              {alert.clients && (
                <span>
                  Client: {alert.clients.name}
                  {alert.clients.company && ` (${alert.clients.company})`}
                </span>
              )}
            </div>
            <span>
              Created {new Date(alert.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {alert.status === 'active' && (
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleAcknowledge}
              className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full"
              title="Acknowledge"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleResolve}
              className="p-2 text-green-600 hover:bg-green-100 rounded-full"
              title="Resolve"
            >
              <CheckCircleIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              title="Dismiss"
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {alert.status === 'acknowledged' && (
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleResolve}
              className="p-2 text-green-600 hover:bg-green-100 rounded-full"
              title="Resolve"
            >
              <CheckCircleIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              title="Dismiss"
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}