import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LightBulbIcon, 
  ChatBubbleLeftRightIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface NLGInsights {
  summary: string;
  detailed_insights: string[];
  recommendations: string[];
  visualization_suggestions: string[];
  query_specific_insights?: string;
}

interface NaturalLanguageInsightsProps {
  currentFile: any;
  onGenerateInsights: (userQuery: string) => Promise<void>;
  nlgInsights?: NLGInsights;
  isLoading?: boolean;
}

const NaturalLanguageInsights: React.FC<NaturalLanguageInsightsProps> = ({
  currentFile,
  onGenerateInsights,
  nlgInsights,
  isLoading = false
}) => {
  const [userQuery, setUserQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateInsights = async () => {
    if (!userQuery.trim()) return;
    
    setIsGenerating(true);
    try {
      await onGenerateInsights(userQuery);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

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
            Natural Language Insights
          </h1>
          <p className="text-lg text-gray-600">
            Ask questions about your data and get AI-generated insights in plain English
          </p>
        </motion.div>

        {!currentFile ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No File Selected</h3>
              <p className="text-gray-600">
                Upload a file first to start generating natural language insights
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Query Input Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 mr-2" />
                Ask About Your Data
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What would you like to analyze?
                  </label>
                  <textarea
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="e.g., What trends do you see in the data? Are there any anomalies? What are the strongest correlations?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>
                
                <button
                  onClick={handleGenerateInsights}
                  disabled={!userQuery.trim() || isGenerating}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                      Generating Insights...
                    </>
                  ) : (
                    <>
                      <LightBulbIcon className="h-5 w-5 mr-2" />
                      Generate Insights
                    </>
                  )}
                </button>
              </div>

              {/* Example Queries */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Example Questions:</h3>
                <div className="space-y-2">
                  {[
                    "What are the main trends in this data?",
                    "Are there any outliers or anomalies?",
                    "What are the strongest correlations?",
                    "Summarize the key findings",
                    "What patterns do you see?"
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setUserQuery(example)}
                      className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Insights Display Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              {!nlgInsights ? (
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
                  <LightBulbIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready for Insights</h3>
                  <p className="text-gray-600">
                    Enter your question above to get AI-generated insights about your data
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                      Summary
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{nlgInsights.summary}</p>
                  </motion.div>

                  {/* Detailed Insights */}
                  {nlgInsights.detailed_insights && nlgInsights.detailed_insights.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <MagnifyingGlassIcon className="h-5 w-5 text-green-600 mr-2" />
                        Detailed Insights
                      </h3>
                      <div className="space-y-3">
                        {nlgInsights.detailed_insights.map((insight, index) => (
                          <div key={index} className="flex items-start">
                            <div className="flex-shrink-0 mt-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                            <p className="ml-3 text-gray-700">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Recommendations */}
                  {nlgInsights.recommendations && nlgInsights.recommendations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-purple-600 mr-2" />
                        Recommendations
                      </h3>
                      <div className="space-y-3">
                        {nlgInsights.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start">
                            <div className="flex-shrink-0 mt-1">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            </div>
                            <p className="ml-3 text-gray-700">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Query-Specific Insights */}
                  {nlgInsights.query_specific_insights && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-blue-50 rounded-2xl shadow-lg p-6 border border-blue-200"
                    >
                      <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600 mr-2" />
                        Response to Your Question
                      </h3>
                      <p className="text-blue-800">{nlgInsights.query_specific_insights}</p>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NaturalLanguageInsights; 