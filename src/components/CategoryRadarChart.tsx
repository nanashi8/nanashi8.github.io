import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface CategoryRadarChartProps {
  labels: string[];
  accuracyData: { beginner: number[]; intermediate: number[]; advanced: number[] };
  progressData: { beginner: number[]; intermediate: number[]; advanced: number[] };
  title?: string;
  chartType: 'accuracy' | 'progress';
}

function CategoryRadarChart({ 
  labels, 
  accuracyData, 
  progressData, 
  title, 
  chartType 
}: CategoryRadarChartProps) {
  const dataToUse = chartType === 'accuracy' ? accuracyData : progressData;
  
  const data = {
    labels,
    datasets: [
      {
        label: '初級',
        data: dataToUse.beginner,
        backgroundColor: 'rgba(72, 187, 120, 0.2)',
        borderColor: 'rgba(72, 187, 120, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(72, 187, 120, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(72, 187, 120, 1)',
      },
      {
        label: '中級',
        data: dataToUse.intermediate,
        backgroundColor: 'rgba(237, 137, 54, 0.2)',
        borderColor: 'rgba(237, 137, 54, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(237, 137, 54, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(237, 137, 54, 1)',
      },
      {
        label: '上級',
        data: dataToUse.advanced,
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        borderColor: 'rgba(220, 38, 38, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(220, 38, 38, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(220, 38, 38, 1)',
      },
    ],
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
          },
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.r.toFixed(1);
            return `${label}: ${value}%`;
          },
        },
      },
    },
  };

  return (
    <div className="radar-chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="chart-wrapper">
        <Radar data={data} options={options} />
      </div>
    </div>
  );
}

export default CategoryRadarChart;
