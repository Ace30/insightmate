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
import { Bar } from 'react-chartjs-2';

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

interface DataVisualizationProps {
  analysisData: any;
  dataSummary: any;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ analysisData, dataSummary }) => {
  if (!analysisData || !dataSummary) {
    return (
      <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
        <p className="text-gray-500">No data available for visualization</p>
      </div>
    );
  }

  // Generate basic statistics chart
  const generateBasicStatsChart = () => {
    if (!analysisData.basic_stats) return null;

    const labels = Object.keys(analysisData.basic_stats).slice(0, 5);
    const means = labels.map(key => analysisData.basic_stats[key]?.mean || 0);
    const stds = labels.map(key => analysisData.basic_stats[key]?.std || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Mean',
          data: means,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
        {
          label: 'Standard Deviation',
          data: stds,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
        },
      ],
    };
  };

  // Generate correlation heatmap data
  const generateCorrelationChart = () => {
    if (!analysisData.correlations?.strong_correlations) return null;

    const correlations = analysisData.correlations.strong_correlations.slice(0, 6);
    const labels = correlations.map((corr: any) => `${corr.variable1} ↔ ${corr.variable2}`);
    const values = correlations.map((corr: any) => Math.abs(corr.correlation));

    return {
      labels,
      datasets: [
        {
          label: 'Correlation Strength',
          data: values,
          backgroundColor: values.map((val: number) => 
            val > 0.7 ? 'rgba(239, 68, 68, 0.8)' :
            val > 0.5 ? 'rgba(245, 158, 11, 0.8)' :
            'rgba(59, 130, 246, 0.8)'
          ),
          borderColor: values.map((val: number) => 
            val > 0.7 ? 'rgba(239, 68, 68, 1)' :
            val > 0.5 ? 'rgba(245, 158, 11, 1)' :
            'rgba(59, 130, 246, 1)'
          ),
          borderWidth: 1,
        },
      ],
    };
  };

  // Generate data quality chart
  const generateDataQualityChart = () => {
    if (!dataSummary.missing_values) return null;

    const columns = Object.keys(dataSummary.missing_values);
    const missingCounts = Object.values(dataSummary.missing_values as Record<string, number>);
    const totalRows = dataSummary.total_rows || 1;
    const missingPercentages = missingCounts.map((count: number) => (count / totalRows) * 100);

    return {
      labels: columns.slice(0, 6),
      datasets: [
        {
          label: 'Missing Values (%)',
          data: missingPercentages,
          backgroundColor: missingPercentages.map((pct: number) => 
            pct > 20 ? 'rgba(239, 68, 68, 0.8)' :
            pct > 10 ? 'rgba(245, 158, 11, 0.8)' :
            'rgba(16, 185, 129, 0.8)'
          ),
          borderColor: missingPercentages.map((pct: number) => 
            pct > 20 ? 'rgba(239, 68, 68, 1)' :
            pct > 10 ? 'rgba(245, 158, 11, 1)' :
            'rgba(16, 185, 129, 1)'
          ),
          borderWidth: 1,
        },
      ],
    };
  };

  // Generate trends chart
  const generateTrendsChart = () => {
    if (!analysisData.trends) return null;

    const trends = Object.entries(analysisData.trends).slice(0, 5);
    const labels = trends.map(([key]) => key);
    const strengths = trends.map(([, trend]: [string, any]) => Math.abs(trend.strength));
    const directions = trends.map(([, trend]: [string, any]) => trend.direction);

    return {
      labels,
      datasets: [
        {
          label: 'Trend Strength',
          data: strengths,
          backgroundColor: directions.map((dir: string) => 
            dir === 'increasing' ? 'rgba(16, 185, 129, 0.8)' :
            dir === 'decreasing' ? 'rgba(239, 68, 68, 0.8)' :
            'rgba(156, 163, 175, 0.8)'
          ),
          borderColor: directions.map((dir: string) => 
            dir === 'increasing' ? 'rgba(16, 185, 129, 1)' :
            dir === 'decreasing' ? 'rgba(239, 68, 68, 1)' :
            'rgba(156, 163, 175, 1)'
          ),
          borderWidth: 2,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const basicStatsData = generateBasicStatsChart();
  const correlationData = generateCorrelationChart();
  const dataQualityData = generateDataQualityChart();
  const trendsData = generateTrendsChart();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Statistics Chart */}
        {basicStatsData && (
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Statistics</h3>
            <div className="h-64">
              <Bar data={basicStatsData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Correlation Chart */}
        {correlationData && (
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Strong Correlations</h3>
            <div className="h-64">
              <Bar data={correlationData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Data Quality Chart */}
        {dataQualityData && (
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Quality (Missing Values)</h3>
            <div className="h-64">
              <Bar data={dataQualityData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Trends Chart */}
        {trendsData && (
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Analysis</h3>
            <div className="h-64">
              <Bar data={trendsData} options={chartOptions} />
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <h4 className="font-semibold">Total Records</h4>
          <p className="text-2xl font-bold">{dataSummary.total_rows || 0}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
          <h4 className="font-semibold">Columns</h4>
          <p className="text-2xl font-bold">{dataSummary.total_columns || 0}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <h4 className="font-semibold">Data Quality Score</h4>
          <p className="text-2xl font-bold">
            {dataSummary.missing_values ? 
              Math.round(((dataSummary.total_rows - Object.values(dataSummary.missing_values as Record<string, number>).reduce((a: number, b: number) => a + b, 0)) / dataSummary.total_rows) * 100) : 
              100}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataVisualization; 