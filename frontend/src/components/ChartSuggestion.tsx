import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  ChartPieIcon, 
  ChartBarSquareIcon,
  PresentationChartLineIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline';

interface ChartSuggestionProps {
  selectedColumns: string[];
  data: any[];
  onChartTypeSelect: (chartType: string) => void;
  selectedChartType: string;
}

interface ChartType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  requirements: {
    minColumns: number;
    maxColumns: number;
    numericRequired: boolean;
    categoricalRequired: boolean;
  };
  score: number;
}

const ChartSuggestion: React.FC<ChartSuggestionProps> = ({
  selectedColumns,
  data,
  onChartTypeSelect,
  selectedChartType
}) => {
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

  const chartTypes: ChartType[] = [
    {
      id: 'bar',
      name: 'Bar Chart',
      description: 'Compare values across categories',
      icon: ChartBarIcon,
      requirements: {
        minColumns: 1,
        maxColumns: 3,
        numericRequired: true,
        categoricalRequired: false
      },
      score: 0
    },
    {
      id: 'line',
      name: 'Line Chart',
      description: 'Show trends over time or continuous data',
      icon: PresentationChartLineIcon,
      requirements: {
        minColumns: 1,
        maxColumns: 2,
        numericRequired: true,
        categoricalRequired: false
      },
      score: 0
    },
    {
      id: 'scatter',
      name: 'Scatter Plot',
      description: 'Show relationship between two numeric variables',
      icon: Square3Stack3DIcon,
      requirements: {
        minColumns: 2,
        maxColumns: 3,
        numericRequired: true,
        categoricalRequired: false
      },
      score: 0
    },
    {
      id: 'pie',
      name: 'Pie Chart',
      description: 'Show proportions of a whole',
      icon: ChartPieIcon,
      requirements: {
        minColumns: 1,
        maxColumns: 2,
        numericRequired: true,
        categoricalRequired: false
      },
      score: 0
    },
    {
      id: 'histogram',
      name: 'Histogram',
      description: 'Show distribution of a single variable',
      icon: ChartBarSquareIcon,
      requirements: {
        minColumns: 1,
        maxColumns: 1,
        numericRequired: true,
        categoricalRequired: false
      },
      score: 0
    }
  ];

  const calculateChartScores = () => {
    return chartTypes.map(chartType => {
      let score = 0;
      const { requirements } = chartType;

      // Check column count requirements
      if (selectedColumns.length >= requirements.minColumns && 
          selectedColumns.length <= requirements.maxColumns) {
        score += 3;
      }

      // Check numeric column requirements
      if (requirements.numericRequired && numericColumns.length > 0) {
        score += 2;
      } else if (!requirements.numericRequired) {
        score += 1;
      }

      // Check categorical column requirements
      if (requirements.categoricalRequired && categoricalColumns.length > 0) {
        score += 2;
      } else if (!requirements.categoricalRequired) {
        score += 1;
      }

      // Bonus for optimal combinations
      if (chartType.id === 'scatter' && numericColumns.length >= 2) {
        score += 2;
      }
      if (chartType.id === 'bar' && categoricalColumns.length > 0 && numericColumns.length > 0) {
        score += 2;
      }
      if (chartType.id === 'line' && numericColumns.length >= 1) {
        score += 1;
      }

      return { ...chartType, score };
    }).sort((a, b) => b.score - a.score);
  };

  const scoredCharts = calculateChartScores();
  const recommendedCharts = scoredCharts.filter(chart => chart.score > 0);

  if (selectedColumns.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chart Suggestions</h3>
        <div className="text-center py-8">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Select columns to see chart suggestions</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 border border-gray-100"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Chart Suggestions</h3>
      
      {/* Selected Columns Summary */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Columns</h4>
        <div className="flex flex-wrap gap-2">
          {columnTypes.map((col) => (
            <span
              key={col.name}
              className={`px-2 py-1 rounded text-xs font-medium ${
                col.type === 'numeric'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {col.name} ({col.type})
            </span>
          ))}
        </div>
      </div>

      {/* Chart Recommendations */}
      {recommendedCharts.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Recommended Charts</h4>
          {recommendedCharts.slice(0, 3).map((chart) => {
            const IconComponent = chart.icon;
            const isSelected = selectedChartType === chart.id;
            
            return (
              <button
                key={chart.id}
                onClick={() => onChartTypeSelect(chart.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`h-5 w-5 ${
                      isSelected ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h5 className={`font-medium ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {chart.name}
                    </h5>
                    <p className={`text-sm ${
                      isSelected ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {chart.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      chart.score >= 5 ? 'bg-green-100 text-green-700' :
                      chart.score >= 3 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      Score: {chart.score}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-2">No suitable charts found for selected columns</p>
          <p className="text-sm text-gray-400">
            Try selecting different columns or adding numeric columns for more options
          </p>
        </div>
      )}

      {/* All Available Charts */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">All Chart Types</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {chartTypes.map((chart) => {
            const IconComponent = chart.icon;
            const isSelected = selectedChartType === chart.id;
            const isDisabled = chart.score === 0;
            
            return (
              <button
                key={chart.id}
                onClick={() => !isDisabled && onChartTypeSelect(chart.id)}
                disabled={isDisabled}
                className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                title={isDisabled ? 'Not suitable for selected columns' : chart.description}
              >
                <IconComponent className="h-6 w-6 mx-auto mb-2" />
                <div className="text-xs font-medium">{chart.name}</div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default ChartSuggestion; 