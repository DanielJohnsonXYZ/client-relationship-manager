'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ClientStatusChartProps {
  data: {
    active: number;
    at_risk: number;
    inactive: number;
    churned: number;
  };
}

export function ClientStatusChart({ data }: ClientStatusChartProps) {
  const chartData = {
    labels: ['Active', 'At Risk', 'Inactive', 'Churned'],
    datasets: [
      {
        data: [data.active, data.at_risk, data.inactive, data.churned],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(156, 163, 175)',
          'rgb(239, 68, 68)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(156, 163, 175)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
}