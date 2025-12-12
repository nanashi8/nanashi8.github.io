import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ScoreRadarChartProps {
  labels: string[];
  answeredData: number[];
  correctData: number[];
  title?: string;
}

function ScoreRadarChart({ labels, answeredData, correctData, title }: ScoreRadarChartProps) {
  const data = {
    labels,
    datasets: [
      {
        label: '回答数',
        data: answeredData,
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(102, 126, 234, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(102, 126, 234, 1)',
      },
      {
        label: '正答数',
        data: correctData,
        backgroundColor: 'rgba(72, 187, 120, 0.2)',
        borderColor: 'rgba(72, 187, 120, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(72, 187, 120, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(72, 187, 120, 1)',
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
          stepSize: 10,
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
          label: function (context) {
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

export default ScoreRadarChart;
