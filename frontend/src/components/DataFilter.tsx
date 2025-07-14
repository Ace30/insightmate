import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface FilterCondition {
  column: string;
  operator: string;
  value: string | number;
  type: 'numeric' | 'categorical';
}

interface DataFilterProps {
  data: any[];
  columns: string[];
  onFilterChange: (filteredData: any[]) => void;
  selectedColumns: string[];
}

const DataFilter: React.FC<DataFilterProps> = ({ 
  data, 
  columns, 
  onFilterChange, 
  selectedColumns 
}) => {
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [newFilter, setNewFilter] = useState<Partial<FilterCondition>>({});

  const numericOperators = ['>', '>=', '<', '<=', '==', '!='];
  const categoricalOperators = ['==', '!=', 'contains', 'starts_with', 'ends_with'];

  const isNumericColumn = (column: string) => {
    const sampleValues = data.slice(0, 100).map(row => row[column]).filter(val => val !== null && val !== undefined);
    return sampleValues.length > 0 && sampleValues.every(val => !isNaN(Number(val)));
  };

  const getColumnType = (column: string) => {
    return isNumericColumn(column) ? 'numeric' : 'categorical';
  };

  const getUniqueValues = (column: string, limit = 20) => {
    const values = Array.from(new Set(data.map(row => row[column]).filter(val => val !== null && val !== undefined)));
    return values.slice(0, limit);
  };

  const applyFilters = (dataToFilter: any[], currentFilters: FilterCondition[]) => {
    if (currentFilters.length === 0) return dataToFilter;

    return dataToFilter.filter(row => {
      return currentFilters.every(filter => {
        const value = row[filter.column];
        const filterValue = filter.value;

        if (value === null || value === undefined) return false;

        switch (filter.operator) {
          case '>':
            return Number(value) > Number(filterValue);
          case '>=':
            return Number(value) >= Number(filterValue);
          case '<':
            return Number(value) < Number(filterValue);
          case '<=':
            return Number(value) <= Number(filterValue);
          case '==':
            return String(value).toLowerCase() === String(filterValue).toLowerCase();
          case '!=':
            return String(value).toLowerCase() !== String(filterValue).toLowerCase();
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'starts_with':
            return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
          case 'ends_with':
            return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
          default:
            return true;
        }
      });
    });
  };

  useEffect(() => {
    const filteredData = applyFilters(data, filters);
    onFilterChange(filteredData);
  }, [filters, data, onFilterChange]);

  const addFilter = () => {
    if (newFilter.column && newFilter.operator && newFilter.value !== undefined) {
      const filter: FilterCondition = {
        column: newFilter.column!,
        operator: newFilter.operator!,
        value: newFilter.value!,
        type: getColumnType(newFilter.column!)
      };
      setFilters([...filters, filter]);
      setNewFilter({});
      setShowAddFilter(false);
    }
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateNewFilter = (field: keyof FilterCondition, value: string | number) => {
    setNewFilter({ ...newFilter, [field]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Data Filters</h3>
        <button
          onClick={() => setShowAddFilter(!showAddFilter)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
        >
          <FunnelIcon className="h-4 w-4" />
          Add Filter
        </button>
      </div>

      {/* Active Filters */}
      {filters.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Active Filters</h4>
          <div className="space-y-2">
            {filters.map((filter, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-900">{filter.column}</span>
                <span className="text-sm text-gray-600">{filter.operator}</span>
                <span className="text-sm text-gray-700 bg-white px-2 py-1 rounded border">
                  {String(filter.value)}
                </span>
                <button
                  onClick={() => removeFilter(index)}
                  className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove filter"
                  aria-label="Remove filter"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Filter Form */}
      {showAddFilter && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 bg-gray-50 rounded-lg"
        >
          <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Filter</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Column Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Column
              </label>
              <select
                value={newFilter.column || ''}
                onChange={(e) => updateNewFilter('column', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select column for filtering"
              >
                <option value="">Select column</option>
                {columns.map((column) => (
                  <option key={column} value={column}>
                    {column} ({getColumnType(column)})
                  </option>
                ))}
              </select>
            </div>

            {/* Operator Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Operator
              </label>
                             <select
                 value={newFilter.operator || ''}
                 onChange={(e) => updateNewFilter('operator', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 disabled={!newFilter.column}
                 aria-label="Select filter operator"
               >
                <option value="">Select operator</option>
                {newFilter.column && getColumnType(newFilter.column) === 'numeric' ? (
                  numericOperators.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))
                ) : (
                  categoricalOperators.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Value Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Value
              </label>
              {newFilter.column && getColumnType(newFilter.column) === 'categorical' ? (
                                 <select
                   value={newFilter.value || ''}
                   onChange={(e) => updateNewFilter('value', e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                   aria-label="Select filter value"
                 >
                  <option value="">Select value</option>
                  {getUniqueValues(newFilter.column).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={newFilter.value || ''}
                  onChange={(e) => updateNewFilter('value', e.target.value)}
                  placeholder="Enter value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>

            {/* Add Button */}
            <div className="flex items-end">
              <button
                onClick={addFilter}
                disabled={!newFilter.column || !newFilter.operator || newFilter.value === undefined}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Filter
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filter Summary */}
      {filters.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {applyFilters(data, filters).length} of {data.length} rows
        </div>
      )}
    </motion.div>
  );
};

export default DataFilter; 