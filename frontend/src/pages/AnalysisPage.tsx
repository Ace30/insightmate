import React from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useData } from '../contexts/DataContext';

const AnalysisPage: React.FC = () => {
  const { state } = useData();
  const { analysisResults, currentFile } = state;

  // Get insights from analysis results
  const getInsights = () => {
    if (!analysisResults) return [];
    return analysisResults.insights || [];
  };

  // Get cleaning report
  const getCleaningReport = () => {
    if (!analysisResults) return null;
    return analysisResults.cleaning_report;
  };

  // Get analysis results
  const getAnalysisResults = () => {
    if (!analysisResults) return null;
    return analysisResults.analysis_results;
  };

  const insights = getInsights();
  const cleaningReport = getCleaningReport();
  const analysisData = getAnalysisResults();

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
            Data Analysis
          </h1>
          <p className="text-lg text-gray-600">
            {currentFile ? `Analyzing: ${currentFile.filename}` : 'Deep insights and pattern recognition'}
          </p>
        </motion.div>

        {!analysisResults ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <MagnifyingGlassIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Data</h3>
              <p className="text-gray-600">
                Upload a file and run analysis to see detailed insights here
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Analysis Tools */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Analysis Tools</h2>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-blue-50 rounded-xl">
                    <MagnifyingGlassIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Data Cleaning</h3>
                      <p className="text-sm text-gray-600">
                        {cleaningReport?.summary?.total_issues_found || 0} issues found and resolved
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-green-50 rounded-xl">
                    <ChartBarIcon className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Statistical Analysis</h3>
                      <p className="text-sm text-gray-600">
                        {analysisData?.basic_stats ? Object.keys(analysisData.basic_stats).length : 0} variables analyzed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-purple-50 rounded-xl">
                    <DocumentTextIcon className="h-6 w-6 text-purple-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Insights Generated</h3>
                      <p className="text-sm text-gray-600">{insights.length} key insights found</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Analysis Results */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Analysis Results</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-2">Key Insights</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {insights.slice(0, 4).map((insight: any, index: number) => (
                        <li key={index}>• {insight.description}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-2">Data Quality</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• {cleaningReport?.final_shape?.[0] || 0} rows processed</li>
                      <li>• {cleaningReport?.final_shape?.[1] || 0} columns analyzed</li>
                      <li>• {cleaningReport?.rows_removed || 0} rows removed</li>
                      <li>• {cleaningReport?.columns_removed || 0} columns removed</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Detailed Analysis Section */}
            {analysisData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Detailed Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Basic Stats */}
                  {analysisData.basic_stats && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Basic Statistics</h4>
                      <div className="space-y-2">
                        {Object.entries(analysisData.basic_stats).slice(0, 3).map(([key, stats]: [string, any]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-gray-700">{key}:</span>
                            <span className="text-gray-600 ml-2">
                              Mean: {stats.mean?.toFixed(2) || 'N/A'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Correlations */}
                  {analysisData.correlations?.strong_correlations && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Strong Correlations</h4>
                      <div className="space-y-2">
                        {analysisData.correlations.strong_correlations.slice(0, 3).map((corr: any, index: number) => (
                          <div key={index} className="text-sm">
                            <span className="text-gray-600">
                              {corr.variable1} ↔ {corr.variable2}
                            </span>
                            <span className="text-gray-700 ml-2">
                              ({corr.correlation.toFixed(3)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trends */}
                  {analysisData.trends && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Trends</h4>
                      <div className="space-y-2">
                        {Object.entries(analysisData.trends).slice(0, 3).map(([key, trend]: [string, any]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-gray-700">{key}:</span>
                            <span className={`ml-2 ${
                              trend.direction === 'increasing' ? 'text-green-600' : 
                              trend.direction === 'decreasing' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {trend.direction} ({trend.strength.toFixed(3)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Analysis Chart Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Analysis Visualizations</h3>
              <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
                <p className="text-gray-500">Analysis charts and graphs will appear here</p>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage; 