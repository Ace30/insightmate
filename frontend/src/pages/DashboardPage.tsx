import React from 'react';
import { motion } from 'framer-motion';
import { ChartBarIcon, ArrowTrendingUpIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';
import { useData } from '../contexts/DataContext';

const DashboardPage: React.FC = () => {
  const { state } = useData();
  const { analysisResults, currentFile } = state;

  // Helper function to format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(2);
  };

  // Get insights from analysis results
  const getInsights = () => {
    if (!analysisResults) return [];
    return analysisResults.insights || [];
  };

  // Get data summary
  const getDataSummary = () => {
    if (!analysisResults) return null;
    return analysisResults.data_summary;
  };

  // Get trends
  const getTrends = () => {
    if (!analysisResults?.analysis_results?.trends) return {};
    return analysisResults.analysis_results.trends;
  };

  const insights = getInsights();
  const dataSummary = getDataSummary();
  const trends = getTrends();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            {currentFile ? `Analyzing: ${currentFile.filename}` : 'View your data insights and analytics'}
          </p>
        </motion.div>

        {!analysisResults ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Data</h3>
              <p className="text-gray-600">
                Upload a file and run analysis to see insights here
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Analytics Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <ChartBarIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
                    <p className="text-sm text-gray-500">Data insights</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Records</span>
                    <span className="font-semibold">{dataSummary?.total_rows || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Columns</span>
                    <span className="font-semibold">{dataSummary?.total_columns || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Missing Values</span>
                    <span className="font-semibold">
                      {dataSummary?.missing_values ? 
                        Object.values(dataSummary.missing_values as Record<string, number>).reduce((a: number, b: number) => a + b, 0) : 
                        'N/A'
                      }
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Trends Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Trends</h3>
                    <p className="text-sm text-gray-500">Pattern analysis</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {Object.entries(trends).slice(0, 3).map(([key, trend]: [string, any]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{key}</span>
                      <span className={`font-semibold ${
                        trend.direction === 'increasing' ? 'text-green-600' : 
                        trend.direction === 'decreasing' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {trend.direction === 'increasing' ? '+' : ''}{formatNumber(trend.strength)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Insights Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <DocumentChartBarIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Insights</h3>
                    <p className="text-sm text-gray-500">Key findings</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Insights</span>
                    <span className="font-semibold">{insights.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data Quality</span>
                    <span className="font-semibold text-green-600">Good</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Analysis Status</span>
                    <span className="font-semibold text-green-600">Complete</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Insights Section */}
            {insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((insight: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
                      <p className="text-gray-600 text-sm">{insight.description}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Chart Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Visualization</h3>
              <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
                <p className="text-gray-500">Charts and visualizations will appear here</p>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage; 