"use client";

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function DataCard({ title, description, fetchData }) {
  const [metric, setMetric] = useState({});
  // ✅ Initialize with null instead of {} to prevent Chart.js errors
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await fetchData();
        setMetric(data.metric);
        setChartData(data.chart);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="bg-white rounded-lg shadow p-4 flex-1 min-w-[550px] max-w-sm">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-2">{description}</p>
      
      {/* Show metrics */}
      <div className="mb-2 flex space-x-4">
        {Object.entries(metric).map(([k, v]) => (
          <div key={k} className="flex-1">
            <div className="text-xs text-gray-400">{k}</div>
            <div className="text-xl font-bold">{v}</div>
          </div>
        ))}
      </div>
      
      {/* ✅ Only render chart when chartData exists and has proper structure */}
      <div className="chart-container" style={{ height: '150px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span>Loading chart...</span>
          </div>
        ) : chartData && chartData.datasets && chartData.datasets.length > 0 ? (
          <Line 
            data={chartData} 
            options={{ 
              responsive: true, 
              maintainAspectRatio: false,
              plugins: { legend: { display: false } } 
            }} 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No chart data available
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ Updated mock function with proper error handling
async function fetchMockData() {
  try {
    const metric = {
      value1: (Math.random() * 100).toFixed(2),
      value2: (Math.random() * 50).toFixed(2)
    };
    const labels = Array.from({ length: 10 }, (_, i) => `T-${i}`);
    const chart = {
      labels,
      datasets: [{
        data: labels.map(() => Math.random() * 100),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: false,
        tension: 0.1
      }]
    };
    return { metric, chart };
  } catch (error) {
    console.error('Error in fetchMockData:', error);
    return { 
      metric: {}, 
      chart: {
        labels: [],
        datasets: []
      }
    };
  }
}

export default function DashboardCards() {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 mx-18">
      <DataCard
        title="Stock Price"
        description="Live stock price updates"
        fetchData={fetchMockData}
      />
      <DataCard
        title="Crypto Metrics"  
        description="Real-time crypto data"
        fetchData={fetchMockData}
      />
      <DataCard
        title="Market Index"
        description="Index trends"
        fetchData={fetchMockData}
      />
    </div>
  );
}