import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'high' | 'medium' | 'low';
  category: 'communication' | 'retention' | 'revenue' | 'efficiency';
  action_items: string[];
}

interface RecommendationCardProps {
  recommendation: Recommendation;
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200',
};

const effortColors = {
  high: 'text-red-600',
  medium: 'text-yellow-600',
  low: 'text-green-600',
};

const impactColors = {
  high: 'text-green-600',
  medium: 'text-yellow-600',
  low: 'text-gray-600',
};

const categoryColors = {
  communication: 'bg-blue-100 text-blue-800',
  retention: 'bg-purple-100 text-purple-800',
  revenue: 'bg-green-100 text-green-800',
  efficiency: 'bg-orange-100 text-orange-800',
};

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const toggleCheckedItem = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  return (
    <div className={`rounded-lg border p-6 bg-white shadow ${priorityColors[recommendation.priority]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryColors[recommendation.category]}`}>
              {recommendation.category}
            </span>
            <span className={`text-xs font-medium ${priorityColors[recommendation.priority].split(' ')[1]}`}>
              {recommendation.priority.toUpperCase()} PRIORITY
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {recommendation.title}
          </h3>
          
          <p className="text-gray-700 mb-3">
            {recommendation.description}
          </p>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">Effort:</span>
              <span className={`font-medium ${effortColors[recommendation.effort]}`}>
                {recommendation.effort}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">Impact:</span>
              <span className={`font-medium ${impactColors[recommendation.impact]}`}>
                {recommendation.impact}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-4 p-2 text-gray-400 hover:text-gray-600"
        >
          {isExpanded ? (
            <ChevronDownIcon className="h-5 w-5" />
          ) : (
            <ChevronRightIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Action Items:</h4>
          <div className="space-y-2">
            {recommendation.action_items.map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <button
                  onClick={() => toggleCheckedItem(index)}
                  className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                    checkedItems.has(index)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {checkedItems.has(index) && (
                    <CheckIcon className="h-3 w-3" />
                  )}
                </button>
                <span className={`text-sm ${checkedItems.has(index) ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                  {item}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
            <span>
              {checkedItems.size} of {recommendation.action_items.length} completed
            </span>
            {checkedItems.size === recommendation.action_items.length && (
              <span className="text-green-600 font-medium">✓ Complete</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}