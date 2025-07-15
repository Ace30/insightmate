import React from 'react';
import { motion } from 'framer-motion';
import { TableCellsIcon, EyeIcon } from '@heroicons/react/24/outline';

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
  const handleColumnToggle = (column: string) => {
    if (selectedColumns.includes(column)) {
      onColumnSelect(selectedColumns.filter(col => col !== column));
    } else {
      onColumnSelect([...selectedColumns, column]);
    }
  };

  const handleSelectAll = () => {
    if (selectedColumns.length === columns.length) {
      onColumnSelect([]);
    } else {
      onColumnSelect(columns);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TableCellsIcon className="h-5 w-5 text-blue-600 mr-2" />
          Data Preview
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            {selectedColumns.length === columns.length ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-sm text-gray-500">
            {selectedColumns.length} of {columns.length} columns selected
          </span>
        </div>
      </div>

      {/* Column Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Select Columns for Visualization:</h4>
        <div className="flex flex-wrap gap-2">
          {columns.map((column) => (
            <button
              key={column}
              onClick={() => handleColumnToggle(column)}
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                selectedColumns.includes(column)
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {column}
            </button>
          ))}
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleColumnToggle(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column}</span>
                    {selectedColumns.includes(column) && (
                      <EyeIcon className="h-3 w-3 text-blue-600" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.slice(0, 10).map((row, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="hover:bg-gray-50"
              >
                {columns.map((column) => (
                  <td
                    key={column}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {row[column] !== null && row[column] !== undefined
                      ? String(row[column])
                      : '-'}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > 10 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing first 10 rows of {data.length} total rows
        </div>
      )}
    </div>
  );
};

export default DataPreview; 