import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DataPreviewProps {
  data: any[];
  columns: string[];
  onColumnSelect: (columns: string[]) => void;
  selectedColumns: string[];
}

const DataPreview: React.FC<DataPreviewProps> = ({ 
  data, 
  columns, 
  onColumnSelect, 
  selectedColumns 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Preview</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No data available for preview</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handleColumnToggle = (column: string) => {
    const newSelection = selectedColumns.includes(column)
      ? selectedColumns.filter(col => col !== column)
      : [...selectedColumns, column];
    onColumnSelect(newSelection);
  };

  const isNumericColumn = (column: string) => {
    const sampleValues = data.slice(0, 100).map(row => row[column]).filter(val => val !== null && val !== undefined);
    return sampleValues.length > 0 && sampleValues.every(val => !isNaN(Number(val)));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
        <div className="text-sm text-gray-500">
          {data.length} rows × {columns.length} columns
        </div>
      </div>

      {/* Column Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Select Columns for Visualization</h4>
        <div className="flex flex-wrap gap-2">
          {columns.map((column) => {
            const isNumeric = isNumericColumn(column);
            const isSelected = selectedColumns.includes(column);
            
            return (
              <button
                key={column}
                onClick={() => handleColumnToggle(column)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{column}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    isNumeric 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {isNumeric ? 'Numeric' : 'Categorical'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column}
                    className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate"
                    title={String(row[column] || '')}
                  >
                    {row[column] !== null && row[column] !== undefined 
                      ? String(row[column]) 
                      : <span className="text-gray-400">null</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
              aria-label="Next page"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DataPreview; 