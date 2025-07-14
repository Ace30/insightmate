import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface InteractiveChartProps {
  data: any[];
  selectedColumns: string[];
  chartType: string;
  title?: string;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  selectedColumns,
  chartType,
  title = 'Data Visualization'
}) => {
  if (!data || data.length === 0 || selectedColumns.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
          <p className="text-gray-500">No data available for visualization</p>
        </div>
      </div>
    );
  }

  const isNumericColumn = (column: string) => {
    const sampleValues = data.slice(0, 100).map(row => row[column]).filter(val => val !== null && val !== undefined);
    return sampleValues.length > 0 && sampleValues.every(val => !isNaN(Number(val)));
  };

  const getColumnTypes = () => {
    return selectedColumns.map(col => ({
      name: col,
      type: isNumericColumn(col) ? 'numeric' : 'categorical'
    }));
  };

  const columnTypes = getColumnTypes();
  const numericColumns = columnTypes.filter(col => col.type === 'numeric');
  const categoricalColumns = columnTypes.filter(col => col.type === 'categorical');

  const generateChartData = () => {
    switch (chartType) {
      case 'bar':
        return generateBarChartData();
      case 'line':
        return generateLineChartData();
      case 'scatter':
        return generateScatterChartData();
      case 'pie':
        return generatePieChartData();
      case 'histogram':
        return generateHistogramData();
      default:
        return generateBarChartData();
    }
  };

  const generateBarChartData = () => {
    if (selectedColumns.length === 0) return null;

    const xColumn = categoricalColumns.length > 0 ? categoricalColumns[0].name : selectedColumns[0];
    const yColumn = numericColumns.length > 0 ? numericColumns[0].name : selectedColumns[1] || selectedColumns[0];

    // Group data by x-axis column
    const groupedData = data.reduce((acc, row) => {
      const xValue = String(row[xColumn] || 'Unknown');
      const yValue = Number(row[yColumn]) || 0;
      
      if (!acc[xValue]) {
        acc[xValue] = 0;
      }
      acc[xValue] += yValue;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(groupedData).slice(0, 20); // Limit to 20 categories
    const values = labels.map(label => groupedData[label]);

    return {
      labels,
      datasets: [
        {
          label: yColumn,
          data: values,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
      ],
    };
  };

  const generateLineChartData = () => {
    if (numericColumns.length === 0) return null;

    const xColumn = selectedColumns[0];
    const yColumn = numericColumns[0].name;

    // Sort data by x-axis if numeric
    const sortedData = isNumericColumn(xColumn) 
      ? data.sort((a, b) => Number(a[xColumn]) - Number(b[xColumn]))
      : data;

    const labels = sortedData.map(row => String(row[xColumn] || '')).slice(0, 50);
    const values = sortedData.map(row => Number(row[yColumn]) || 0).slice(0, 50);

    return {
      labels,
      datasets: [
        {
          label: yColumn,
          data: values,
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const generateScatterChartData = () => {
    if (numericColumns.length < 2) return null;

    const xColumn = numericColumns[0].name;
    const yColumn = numericColumns[1].name;

    const points = data
      .filter(row => row[xColumn] !== null && row[xColumn] !== undefined && 
                     row[yColumn] !== null && row[yColumn] !== undefined)
      .map(row => ({
        x: Number(row[xColumn]),
        y: Number(row[yColumn])
      }))
      .slice(0, 100); // Limit to 100 points for performance

    return {
      datasets: [
        {
          label: `${xColumn} vs ${yColumn}`,
          data: points,
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgba(239, 68, 68, 1)',
          pointRadius: 4,
        },
      ],
    };
  };

  const generatePieChartData = () => {
    if (selectedColumns.length === 0) return null;

    const column = selectedColumns[0];
    const isNumeric = isNumericColumn(column);

    if (isNumeric) {
      // For numeric data, create ranges
      const values = data.map(row => Number(row[column]) || 0).filter(val => val > 0);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      const bucketSize = range / 5;

      const buckets: Record<string, number> = {};
      values.forEach(value => {
        const bucket = Math.floor((value - min) / bucketSize);
        const bucketLabel = `${(min + bucket * bucketSize).toFixed(1)}-${(min + (bucket + 1) * bucketSize).toFixed(1)}`;
        buckets[bucketLabel] = (buckets[bucketLabel] || 0) + 1;
      });

      return {
        labels: Object.keys(buckets),
        datasets: [
          {
            data: Object.values(buckets),
            backgroundColor: [
              'rgba(239, 68, 68, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(139, 92, 246, 0.8)',
            ],
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      };
    } else {
      // For categorical data, count occurrences
      const counts: Record<string, number> = {};
      data.forEach(row => {
        const value = String(row[column] || 'Unknown');
        counts[value] = (counts[value] || 0) + 1;
      });

      const sortedEntries = Object.entries(counts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8); // Limit to top 8 categories

      return {
        labels: sortedEntries.map(([label]) => label),
        datasets: [
          {
            data: sortedEntries.map(([,count]) => count),
            backgroundColor: [
              'rgba(239, 68, 68, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(236, 72, 153, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(168, 85, 247, 0.8)',
            ],
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      };
    }
  };

  const generateHistogramData = () => {
    if (numericColumns.length === 0) return null;

    const column = numericColumns[0].name;
    const values = data.map(row => Number(row[column]) || 0).filter(val => val !== 0);

    if (values.length === 0) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const bucketCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
    const bucketSize = range / bucketCount;

    const buckets: Record<string, number> = {};
    for (let i = 0; i < bucketCount; i++) {
      const bucketStart = min + i * bucketSize;
      const bucketEnd = min + (i + 1) * bucketSize;
      const bucketLabel = `${bucketStart.toFixed(1)}-${bucketEnd.toFixed(1)}`;
      buckets[bucketLabel] = 0;
    }

    values.forEach(value => {
      const bucketIndex = Math.min(Math.floor((value - min) / bucketSize), bucketCount - 1);
      const bucketStart = min + bucketIndex * bucketSize;
      const bucketEnd = min + (bucketIndex + 1) * bucketSize;
      const bucketLabel = `${bucketStart.toFixed(1)}-${bucketEnd.toFixed(1)}`;
      buckets[bucketLabel]++;
    });

    return {
      labels: Object.keys(buckets),
      datasets: [
        {
          label: `Distribution of ${column}`,
          data: Object.values(buckets),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
      ],
    };
  };

  const chartData = generateChartData();
  if (!chartData) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
          <p className="text-gray-500">Unable to generate chart with selected data</p>
        </div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: chartType === 'scatter' ? {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
      },
      y: {
        type: 'linear' as const,
      },
    } : undefined,
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return <Bar data={chartData} options={chartOptions} />;
      case 'line':
        return <Line data={chartData} options={chartOptions} />;
      case 'scatter':
        return <Scatter data={chartData} options={chartOptions} />;
      case 'pie':
        return <Doughnut data={chartData} options={chartOptions} />;
      case 'histogram':
        return <Bar data={chartData} options={chartOptions} />;
      default:
        return <Bar data={chartData} options={chartOptions} />;
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-96">
        {renderChart()}
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Chart Type: {chartType.charAt(0).toUpperCase() + chartType.slice(1)}</p>
        <p>Data Points: {data.length}</p>
        <p>Selected Columns: {selectedColumns.join(', ')}</p>
      </div>
    </div>
  );
};

export default InteractiveChart; 