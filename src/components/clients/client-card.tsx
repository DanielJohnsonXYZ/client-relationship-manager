import { 
  BuildingOfficeIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  status: 'active' | 'inactive' | 'at_risk' | 'churned';
  health_score: number;
  total_revenue: number;
  last_contact_date: string | null;
  next_follow_up: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  at_risk: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-gray-100 text-gray-800',
  churned: 'bg-red-100 text-red-800',
};

const getHealthScoreColor = (score: number) => {
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
          {client.company && (
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <BuildingOfficeIcon className="h-4 w-4 mr-1" />
              {client.company}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(client)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(client.id)}
            className="p-1 text-gray-400 hover:text-red-600"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {client.email && (
          <div className="flex items-center text-sm text-gray-600">
            <EnvelopeIcon className="h-4 w-4 mr-2" />
            {client.email}
          </div>
        )}
        {client.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 mr-2" />
            {client.phone}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            statusColors[client.status]
          }`}
        >
          {client.status.replace('_', ' ')}
        </span>
        
        <div className="text-right">
          <div className={`text-sm font-medium ${getHealthScoreColor(client.health_score)}`}>
            Health: {client.health_score}%
          </div>
          <div className="text-xs text-gray-500">
            Revenue: ${client.total_revenue.toLocaleString()}
          </div>
        </div>
      </div>

      {client.last_contact_date && (
        <div className="text-xs text-gray-500 border-t pt-2">
          Last contact: {new Date(client.last_contact_date).toLocaleDateString()}
        </div>
      )}

      {client.tags && client.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {client.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
            >
              {tag}
            </span>
          ))}
          {client.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{client.tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}