import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import DataPreview from '../components/DataPreview';
import DataFilter from '../components/DataFilter';
import ChartSuggestion from '../components/ChartSuggestion';
import InteractiveChart from '../components/InteractiveChart';

const InteractiveVisualizationPage: React.FC = () => {
  const { state, getFileData } = useData();
  const { currentFile, analysisResults } = state;

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'filter' | 'visualize'>('preview');
  const [fileData, setFileData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Get data from uploaded file
  const getRawData = () => {
    // First try to get data from analysis results
    if (analysisResults?.raw_data) {
      return analysisResults.raw_data;
    }
    
    // If no analysis results, use the fetched file data
    return fileData;
  };

  const getColumns = () => {
    const data = getRawData();
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  };

  const rawData = getRawData();
  const columns = getColumns();

  useEffect(() => {
    setFilteredData(rawData);
  }, [rawData]);

  // Fetch file data when currentFile changes
  useEffect(() => {
    const fetchFileData = async () => {
      if (currentFile && fileData.length === 0) {
        try {
          setIsLoadingData(true);
          const data = await getFileData(currentFile.filename);
          setFileData(data);
        } catch (error) {
          console.error('Failed to fetch file data:', error);
        } finally {
          setIsLoadingData(false);
        }
      }
    };

    fetchFileData();
  }, [currentFile, getFileData, fileData.length]);

  const handleColumnSelect = (columns: string[]) => {
    setSelectedColumns(columns);
    // Auto-select first chart type if none selected
    if (columns.length > 0 && !chartType) {
      const isNumeric = (col: string) => {
        const sampleValues = rawData.slice(0, 100).map((row: any) => row[col]).filter((val: any) => val !== null && val !== undefined);
        return sampleValues.length > 0 && sampleValues.every((val: any) => !isNaN(Number(val)));
      };
      
      const numericCols = columns.filter(isNumeric);
      if (numericCols.length >= 2) {
        setChartType('scatter');
      } else if (numericCols.length >= 1) {
        setChartType('bar');
      } else {
        setChartType('bar');
      }
    }
  };

  const handleFilterChange = (data: any[]) => {
    setFilteredData(data);
  };

  const handleChartTypeSelect = (type: string) => {
    setChartType(type);
  };

  if (!currentFile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">
                Upload a file to use interactive visualization
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-center mb-4">
                <div className="spinner"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading File Data</h3>
              <p className="text-gray-600">
                Please wait while we load your file data...
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (rawData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">
                Unable to load file data. Please try uploading your file again.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Interactive Visualization
          </h1>
          <p className="text-lg text-gray-600">
            {currentFile ? `Visualizing: ${currentFile.filename}` : 'Create custom charts and visualizations'}
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex justify-center">
            <div className="bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
              {[
                { id: 'preview', label: 'Data Preview' },
                { id: 'filter', label: 'Filters' },
                { id: 'visualize', label: 'Visualization' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="space-y-8">
          {/* Data Preview Tab */}
          {activeTab === 'preview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <DataPreview
                data={rawData}
                columns={columns}
                onColumnSelect={handleColumnSelect}
                selectedColumns={selectedColumns}
              />
            </motion.div>
          )}

          {/* Filters Tab */}
          {activeTab === 'filter' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <DataFilter
                data={rawData}
                columns={columns}
                onFilterChange={handleFilterChange}
                selectedColumns={selectedColumns}
              />
            </motion.div>
          )}

          {/* Visualization Tab */}
          {activeTab === 'visualize' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-8"
            >
              {/* Chart Suggestions */}
              <ChartSuggestion
                selectedColumns={selectedColumns}
                data={filteredData}
                onChartTypeSelect={handleChartTypeSelect}
                selectedChartType={chartType}
              />

              {/* Interactive Chart */}
              {selectedColumns.length > 0 && chartType && (
                <InteractiveChart
                  data={filteredData}
                  selectedColumns={selectedColumns}
                  chartType={chartType}
                  title={`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`}
                />
              )}

              {/* Instructions */}
              {selectedColumns.length === 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>1. Go to <strong>Data Preview</strong> tab to select columns for visualization</p>
                    <p>2. Use <strong>Filters</strong> tab to filter your data based on specific conditions</p>
                    <p>3. Return to <strong>Visualization</strong> tab to see chart suggestions and create your chart</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="text-2xl font-bold text-blue-600">{rawData.length}</div>
            <div className="text-sm text-gray-600">Total Rows</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="text-2xl font-bold text-green-600">{columns.length}</div>
            <div className="text-sm text-gray-600">Total Columns</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="text-2xl font-bold text-purple-600">{filteredData.length}</div>
            <div className="text-sm text-gray-600">Filtered Rows</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="text-2xl font-bold text-orange-600">{selectedColumns.length}</div>
            <div className="text-sm text-gray-600">Selected Columns</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InteractiveVisualizationPage; 