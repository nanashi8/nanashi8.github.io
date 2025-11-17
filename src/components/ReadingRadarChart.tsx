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

interface ReadingRadarChartProps {
  labels: string[];
  savedWordsData: number[];
  totalWordsData: number[];
  title?: string;
}

function ReadingRadarChart({ labels, savedWordsData, totalWordsData, title }: ReadingRadarChartProps) {
  const data = {
    labels,
    datasets: [
      {
        label: '保存単語数',
        data: savedWordsData,
        backgroundColor: 'rgba(237, 137, 54, 0.2)',
        borderColor: 'rgba(237, 137, 54, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(237, 137, 54, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(237, 137, 54, 1)',
      },
      {
        label: '全単語数',
        data: totalWordsData,
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        borderColor: 'rgba(156, 163, 175, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(156, 163, 175, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(156, 163, 175, 1)',
      },
    ],
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        ticks: {
          stepSize: 50,
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
            const value = context.parsed.r;
            return `${label}: ${value}`;
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

export default ReadingRadarChart;
