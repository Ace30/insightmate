import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useData } from '../contexts/DataContext';
import toast from 'react-hot-toast';

const UploadPage: React.FC = () => {
  const { state, uploadFile, analyzeFile } = useData();
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadingFile(file);

    try {
      console.log('Starting upload for file:', file.name);
      console.log('File size:', file.size);
      console.log('File type:', file.type);
      
      await uploadFile(file);
      toast.success('File uploaded successfully!');
      
      // Automatically analyze the file using the most recently uploaded file
      const mostRecentFile = state.files[state.files.length - 1];
      if (mostRecentFile) {
        console.log('Starting analysis for file:', mostRecentFile.filename);
        try {
          await analyzeFile(mostRecentFile.filename);
          toast.success('Analysis completed!');
        } catch (analysisError) {
          console.error('Analysis error:', analysisError);
          toast.error(`Analysis failed: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingFile(null);
    }
  }, [uploadFile, analyzeFile, state.files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json'],
      'application/octet-stream': ['.parquet']
    },
    multiple: false
  });

  const fileTypes = [
    { name: 'CSV', extension: '.csv', color: 'from-green-500 to-emerald-500' },
    { name: 'Excel', extension: '.xlsx, .xls', color: 'from-blue-500 to-cyan-500' },
    { name: 'JSON', extension: '.json', color: 'from-purple-500 to-pink-500' },
    { name: 'Parquet', extension: '.parquet', color: 'from-orange-500 to-red-500' }
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Upload Your Data
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Drag and drop your data file to get started with AI-powered analysis
        </p>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-12"
      >
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
            isDragActive
              ? 'border-primary-500 bg-primary-50 scale-105'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          
          <AnimatePresence>
            {uploadingFile ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <ArrowPathIcon className="w-12 h-12 text-primary-500 animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Processing {uploadingFile.name}
                  </h3>
                  <p className="text-gray-600">
                    Uploading and analyzing your data...
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                    <CloudArrowUpIcon className="w-10 h-10 text-white" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {isDragActive ? 'Drop your file here' : 'Drag & drop your file'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    or click to browse files
                  </p>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary"
                  >
                    Choose File
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Supported File Types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Supported File Types
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {fileTypes.map((fileType, index) => (
            <motion.div
              key={fileType.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${fileType.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <DocumentIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {fileType.name}
              </h3>
              <p className="text-sm text-gray-600">
                {fileType.extension}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Uploaded Files */}
      {state.files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Uploaded Files
          </h2>
          <div className="space-y-4">
            {state.files.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                      <DocumentIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {file.filename}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {file.rows.toLocaleString()} rows • {file.columns} columns • {formatFileSize(file.file_size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                      file.status === 'completed' 
                        ? 'bg-success-100 text-success-800'
                        : file.status === 'analyzing'
                        ? 'bg-warning-100 text-warning-800'
                        : file.status === 'error'
                        ? 'bg-error-100 text-error-800'
                        : 'bg-primary-100 text-primary-800'
                    }`}>
                      {file.status === 'completed' && <CheckCircleIcon className="w-4 h-4" />}
                      {file.status === 'analyzing' && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                      {file.status === 'error' && <ExclamationTriangleIcon className="w-4 h-4" />}
                      <span className="capitalize">{file.status}</span>
                    </div>
                    
                    {file.status === 'uploaded' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => analyzeFile(file.filename)}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        Analyze
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {state.error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error-50 border border-error-200 rounded-xl p-4 mt-6"
        >
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-error-600" />
            <div>
              <h3 className="font-semibold text-error-800">Upload Error</h3>
              <p className="text-error-700">{state.error}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UploadPage; 