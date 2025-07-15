import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DataFilterProps {
  data: any[];
  columns: string[];
  onFilterChange: (filteredData: any[]) => void;
  selectedColumns: string[];
}

interface Filter {
  column: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: string | number;
  value2?: string | number;
}

const DataFilter: React.FC<DataFilterProps> = ({
  data,
  columns,
  onFilterChange,
  selectedColumns
}) => {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [isNumericColumn, setIsNumericColumn] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Determine which columns are numeric
    const numericColumns: Record<string, boolean> = {};
    columns.forEach(column => {
      const sampleValues = data.slice(0, 100).map(row => row[column]).filter(val => val !== null && val !== undefined);
      numericColumns[column] = sampleValues.length > 0 && sampleValues.every(val => !isNaN(Number(val)));
    });
    setIsNumericColumn(numericColumns);
  }, [data, columns]);

  useEffect(() => {
    applyFilters();
  }, [filters, data]);

  const addFilter = () => {
    const newFilter: Filter = {
      column: columns[0] || '',
      operator: 'equals',
      value: ''
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: keyof Filter, value: any) => {
    const updatedFilters = [...filters];
    updatedFilters[index] = { ...updatedFilters[index], [field]: value };
    setFilters(updatedFilters);
  };

  const applyFilters = () => {
    if (filters.length === 0) {
      onFilterChange(data);
      return;
    }

    const filteredData = data.filter(row => {
      return filters.every(filter => {
        const cellValue = row[filter.column];
        
        if (cellValue === null || cellValue === undefined) {
          return false;
        }

        switch (filter.operator) {
          case 'equals':
            return String(cellValue).toLowerCase() === String(filter.value).toLowerCase();
          
          case 'contains':
            return String(cellValue).toLowerCase().includes(String(filter.value).toLowerCase());
          
          case 'greater_than':
            if (!isNumericColumn[filter.column]) return false;
            return Number(cellValue) > Number(filter.value);
          
          case 'less_than':
            if (!isNumericColumn[filter.column]) return false;
            return Number(cellValue) < Number(filter.value);
          
          case 'between':
            if (!isNumericColumn[filter.column] || filter.value2 === undefined) return false;
            const numValue = Number(cellValue);
            return numValue >= Number(filter.value) && numValue <= Number(filter.value2);
          
          default:
            return true;
        }
      });
    });

    onFilterChange(filteredData);
  };

  const clearAllFilters = () => {
    setFilters([]);
  };

  const getUniqueValues = (column: string) => {
    const values = Array.from(new Set(data.map(row => row[column]).filter(val => val !== null && val !== undefined)));
    return values.slice(0, 20); // Limit to 20 unique values
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FunnelIcon className="h-5 w-5 text-blue-600 mr-2" />
          Data Filters
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearAllFilters}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Clear All
          </button>
          <span className="text-sm text-gray-500">
            {filters.length} filter{filters.length !== 1 ? 's' : ''} active
          </span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="space-y-4">
        {filters.map((filter, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg"
          >
            {/* Column Select */}
            <select
              value={filter.column}
              onChange={(e) => updateFilter(index, 'column', e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label={`Select column for filter ${index + 1}`}
            >
              {columns.map(column => (
                <option key={column} value={column}>{column}</option>
              ))}
            </select>

            {/* Operator Select */}
            <select
              value={filter.operator}
              onChange={(e) => updateFilter(index, 'operator', e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label={`Select operator for filter ${index + 1}`}
            >
              <option value="equals">Equals</option>
              <option value="contains">Contains</option>
              {isNumericColumn[filter.column] && (
                <>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                  <option value="between">Between</option>
                </>
              )}
            </select>

            {/* Value Input */}
            <div className="flex-1 flex space-x-2">
              {filter.operator === 'between' ? (
                <>
                  <input
                    type={isNumericColumn[filter.column] ? 'number' : 'text'}
                    value={filter.value}
                    onChange={(e) => updateFilter(index, 'value', e.target.value)}
                    placeholder="Min"
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type={isNumericColumn[filter.column] ? 'number' : 'text'}
                    value={filter.value2 || ''}
                    onChange={(e) => updateFilter(index, 'value2', e.target.value)}
                    placeholder="Max"
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </>
              ) : filter.operator === 'equals' && !isNumericColumn[filter.column] ? (
                <select
                  value={filter.value}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label={`Select value for filter ${index + 1}`}
                >
                  <option value="">Select value</option>
                  {getUniqueValues(filter.column).map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={isNumericColumn[filter.column] ? 'number' : 'text'}
                  value={filter.value}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  placeholder="Enter value"
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Remove Filter Button */}
            <button
              onClick={() => removeFilter(index)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
              aria-label={`Remove filter ${index + 1}`}
              title={`Remove filter ${index + 1}`}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </motion.div>
        ))}

        {/* Add Filter Button */}
        <button
          onClick={addFilter}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + Add Filter
        </button>
      </div>

      {/* Filter Summary */}
      {filters.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Active Filters:</h4>
          <div className="space-y-1">
            {filters.map((filter, index) => (
              <div key={index} className="text-sm text-blue-700">
                {filter.column} {filter.operator} {filter.value}
                {filter.operator === 'between' && filter.value2 && ` and ${filter.value2}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataFilter; 