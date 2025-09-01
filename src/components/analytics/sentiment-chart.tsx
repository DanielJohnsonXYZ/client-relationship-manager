'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SentimentChartProps {
  data: {
    labels: string[];
    positive: number[];
    neutral: number[];
    negative: number[];
  };
}

export function SentimentChart({ data }: SentimentChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Positive',
        data: data.positive,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
      {
        label: 'Neutral',
        data: data.neutral,
        backgroundColor: 'rgba(156, 163, 175, 0.8)',
        borderColor: 'rgb(156, 163, 175)',
        borderWidth: 1,
      },
      {
        label: 'Negative',
        data: data.negative,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}