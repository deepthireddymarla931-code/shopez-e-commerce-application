import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PriceChart = ({ history = [], symbol = '' }) => {
  const chartRef = useRef(null);

  if (history.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100 min-vh-25 glass-panel p-5 text-muted">
        No historical price data available.
      </div>
    );
  }

  // Format labels and prices
  const labels = history.map((h) => {
    const d = new Date(h.timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const dataPoints = history.map((h) => h.price);

  // Check if stock is up/down over this history window to set chart color
  const firstPrice = dataPoints[0] || 0;
  const lastPrice = dataPoints[dataPoints.length - 1] || 0;
  const isUp = lastPrice >= firstPrice;
  const strokeColor = isUp ? '#10b981' : '#f43f5e';
  
  // Custom Area Gradient
  const getGradient = (ctx, chartArea) => {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, 'rgba(7, 11, 19, 0)');
    gradient.addColorStop(1, isUp ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)');
    return gradient;
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: `${symbol} Price`,
        data: dataPoints,
        borderColor: strokeColor,
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 6,
        pointBackgroundColor: strokeColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        fill: true,
        backgroundColor: function(context) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          return getGradient(ctx, chartArea);
        },
        tension: 0.2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#121b2e',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: function (context) {
            return `Price: $${context.raw.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 10,
          },
          maxTicksLimit: 6,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 10,
          },
          callback: function (value) {
            return '$' + value;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: '300px', position: 'relative' }}>
      <Line ref={chartRef} data={chartData} options={chartOptions} />
    </div>
  );
};

export default PriceChart;
