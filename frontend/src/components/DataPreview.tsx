import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TableCellsIcon, 
  EyeIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';

interface DataPreviewProps {
  data: any[];
  columns: string[];
  onColumnSelect: (columns: string[]) => void;
  selectedColumns: string[];
  onDataChange?: (newData: any[]) => void;
  onSaveData?: (data: any[]) => void;
  filename?: string;
}

interface RowData {
  id: string;
  data: any;
  isSelected: boolean;
}

const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  columns,
  onColumnSelect,
  selectedColumns,
  onDataChange,
  onSaveData,
  filename
}) => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [columnSearchTerm, setColumnSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{rowId: string, column: string} | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [sortConfig, setSortConfig] = useState<{column: string, direction: 'asc' | 'desc'} | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{type: 'deleteColumn', column: string} | null>(null);

  // Create row data with unique IDs
  const rowData: RowData[] = useMemo(() => {
    return data.map((row, index) => ({
      id: `row-${index}`,
      data: row,
      isSelected: selectedRows.has(`row-${index}`)
    }));
  }, [data, selectedRows]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let filtered = rowData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row => 
        Object.values(row.data).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a.data[sortConfig.column];
        const bVal = b.data[sortConfig.column];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        const comparison = String(aVal).localeCompare(String(bVal));
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [rowData, searchTerm, sortConfig]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  // Filtered columns
  const filteredColumns = useMemo(() => {
    if (!columnSearchTerm) return columns;
    return columns.filter(col => 
      col.toLowerCase().includes(columnSearchTerm.toLowerCase())
    );
  }, [columns, columnSearchTerm]);

  // Column selection handlers
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

  // Row selection handlers
  const handleRowToggle = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAllRows = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(row => row.id)));
    }
  };

  // Sorting handlers
  const handleSort = (column: string) => {
    setSortConfig(prev => {
      if (prev?.column === column) {
        return prev.direction === 'asc' 
          ? { column, direction: 'desc' as const }
          : null;
      }
      return { column, direction: 'asc' as const };
    });
  };

  // Cell editing handlers
  const handleCellEdit = (rowId: string, column: string, value: any) => {
    setEditingCell({ rowId, column });
    setEditingValue(String(value || ''));
  };

  const handleCellSave = () => {
    if (!editingCell || !onDataChange) return;

    const newData = [...data];
    const rowIndex = parseInt(editingCell.rowId.replace('row-', ''));
    newData[rowIndex] = {
      ...newData[rowIndex],
      [editingCell.column]: editingValue
    };

    onDataChange(newData);
    setEditingCell(null);
    setEditingValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // Row/Column management
  const handleAddRow = () => {
    if (!onDataChange) return;
    
    const newRow: any = {};
    columns.forEach(col => {
      newRow[col] = '';
    });
    
    onDataChange([...data, newRow]);
  };

  const handleDeleteSelectedRows = () => {
    if (!onDataChange || selectedRows.size === 0) return;
    
    const rowIds = Array.from(selectedRows);
    const indicesToRemove = rowIds.map(id => parseInt(id.replace('row-', '')));
    const newData = data.filter((_, index) => !indicesToRemove.includes(index));
    
    onDataChange(newData);
    setSelectedRows(new Set());
  };

  const handleAddColumn = () => {
    if (!onDataChange) return;
    
    const columnName = prompt('Enter column name:');
    if (!columnName) return;
    
    const newData = data.map(row => ({
      ...row,
      [columnName]: ''
    }));
    
    onDataChange(newData);
  };

  const handleDeleteColumn = (column: string) => {
    if (!onDataChange) return;
    
    setConfirmAction({ type: 'deleteColumn', column });
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    if (!confirmAction || !onDataChange) return;
    
    if (confirmAction.type === 'deleteColumn') {
      const newData = data.map(row => {
        const { [confirmAction.column]: removed, ...rest } = row;
        return rest;
      });
      
      onDataChange(newData);
      onColumnSelect(selectedColumns.filter(col => col !== confirmAction.column));
    }
    
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  // Pagination handlers
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      {/* Header */}
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
          {onSaveData && (
            <button
              onClick={() => onSaveData(data)}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center"
              title="Save changes to file"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save
            </button>
          )}
        </div>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 space-y-4">
        {/* Row Search */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search in data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAddRow}
            className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Row
          </button>
          {selectedRows.size > 0 && (
            <button
              onClick={handleDeleteSelectedRows}
              className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete ({selectedRows.size})
            </button>
          )}
        </div>

        {/* Column Search and Management */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search columns..."
              value={columnSearchTerm}
              onChange={(e) => setColumnSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAddColumn}
            className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Column
          </button>
        </div>

        {/* Column Selection */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Select Columns for Visualization:</h4>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {filteredColumns.map((column) => (
              <div key={column} className="flex items-center space-x-1">
                <button
                  onClick={() => handleColumnToggle(column)}
                  className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                    selectedColumns.includes(column)
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {column}
                </button>
                <button
                  onClick={() => handleDeleteColumn(column)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete column"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Row selection checkbox */}
                              <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAllRows}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Select all rows"
                    title="Select all rows"
                  />
                </th>
              {/* Column headers */}
              {filteredColumns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleSort(column)}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>{column}</span>
                      <ArrowsUpDownIcon className="h-3 w-3" />
                    </button>
                    {sortConfig?.column === column && (
                      <span className="text-blue-600">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                    {selectedColumns.includes(column) && (
                      <EyeIcon className="h-3 w-3 text-blue-600" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`hover:bg-gray-50 ${
                  selectedRows.has(row.id) ? 'bg-blue-50' : ''
                }`}
              >
                {/* Row selection checkbox */}
                                  <td className="px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => handleRowToggle(row.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-label={`Select row ${index + 1}`}
                      title={`Select row ${index + 1}`}
                    />
                  </td>
                {/* Data cells */}
                {filteredColumns.map((column) => (
                  <td
                    key={column}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {editingCell?.rowId === row.id && editingCell?.column === column ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave();
                            if (e.key === 'Escape') handleCellCancel();
                          }}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          autoFocus
                        />
                        <button
                          onClick={handleCellSave}
                          className="text-green-600 hover:text-green-800"
                          aria-label="Save changes"
                          title="Save changes"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCellCancel}
                          className="text-red-600 hover:text-red-800"
                          aria-label="Cancel changes"
                          title="Cancel changes"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center justify-between group cursor-pointer"
                        onDoubleClick={() => handleCellEdit(row.id, column, row.data[column])}
                      >
                        <span>
                          {row.data[column] !== null && row.data[column] !== undefined
                            ? String(row.data[column])
                            : '-'}
                        </span>
                        <PencilIcon className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination and Summary */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} rows
          {searchTerm && ` (filtered from ${data.length} total)`}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              aria-label="Rows per page"
              title="Rows per page"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Tips:</strong> Double-click any cell to edit, use search to filter data, and select rows/columns for bulk operations.
        </p>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Action</h3>
            <p className="text-gray-600 mb-6">
              {confirmAction.type === 'deleteColumn' && 
                `Are you sure you want to delete column "${confirmAction.column}"? This action cannot be undone.`
              }
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPreview; 