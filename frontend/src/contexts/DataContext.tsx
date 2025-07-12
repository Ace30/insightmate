import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface DataFile {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  rows: number;
  columns: number;
  column_names: string[];
  upload_time: string;
  status: 'uploaded' | 'analyzing' | 'completed' | 'error';
}

export interface AnalysisResult {
  cleaning_report: any;
  analysis_results: any;
  insights: any[];
  charts_data: any;
  data_summary: any;
}

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  query_type: string;
  confidence: number;
}

interface DataState {
  files: DataFile[];
  currentFile: DataFile | null;
  analysisResults: AnalysisResult | null;
  chatHistory: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

type DataAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_FILE'; payload: DataFile }
  | { type: 'SET_FILES'; payload: DataFile[] }
  | { type: 'SET_CURRENT_FILE'; payload: DataFile | null }
  | { type: 'SET_ANALYSIS_RESULTS'; payload: AnalysisResult }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'CLEAR_CHAT_HISTORY' }
  | { type: 'RESET_STATE' };

const initialState: DataState = {
  files: [],
  currentFile: null,
  analysisResults: null,
  chatHistory: [],
  isLoading: false,
  error: null,
};

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'ADD_FILE':
      return { 
        ...state, 
        files: [...state.files, action.payload],
        currentFile: action.payload 
      };
    
    case 'SET_FILES':
      return { ...state, files: action.payload };
    
    case 'SET_CURRENT_FILE':
      return { ...state, currentFile: action.payload };
    
    case 'SET_ANALYSIS_RESULTS':
      return { ...state, analysisResults: action.payload };
    
    case 'ADD_CHAT_MESSAGE':
      return { 
        ...state, 
        chatHistory: [...state.chatHistory, action.payload] 
      };
    
    case 'CLEAR_CHAT_HISTORY':
      return { ...state, chatHistory: [] };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

interface DataContextType {
  state: DataState;
  dispatch: React.Dispatch<DataAction>;
  uploadFile: (file: File) => Promise<void>;
  analyzeFile: (filename: string) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  clearChatHistory: () => void;
  resetState: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  const uploadFile = async (file: File) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('Creating FormData for file:', file.name);
      const formData = new FormData();
      formData.append('file', file);

      console.log('Making request to /api/data/upload');
      const response = await fetch('/api/data/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed with status:', response.status);
        console.error('Error response:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Upload successful, response data:', data);
      
      const newFile: DataFile = {
        id: Date.now().toString(),
        filename: data.file_info.filename,
        file_path: data.file_info.file_path,
        file_size: data.file_info.file_size,
        rows: data.file_info.rows,
        columns: data.file_info.columns,
        column_names: data.file_info.column_names,
        upload_time: data.file_info.upload_time,
        status: 'uploaded',
      };

      dispatch({ type: 'ADD_FILE', payload: newFile });
    } catch (error) {
      console.error('Upload error in DataContext:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Upload failed' });
      throw error; // Re-throw to be caught by the component
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const analyzeFile = async (filename: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('Starting analysis for file:', filename);

      // Update file status to analyzing
      const updatedFiles = state.files.map(file => 
        file.filename === filename 
          ? { ...file, status: 'analyzing' as const }
          : file
      );
      dispatch({ type: 'SET_FILES', payload: updatedFiles });

      console.log('Making request to /api/data/analyze/' + filename);
      const response = await fetch(`/api/data/analyze/${filename}`, {
        method: 'POST',
      });

      console.log('Analysis response status:', response.status);
      console.log('Analysis response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Analysis failed with status:', response.status);
        console.error('Error response:', errorText);
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const analysisResults = await response.json();
      console.log('Analysis successful, response data:', analysisResults);
      
      dispatch({ type: 'SET_ANALYSIS_RESULTS', payload: analysisResults });

      // Update file status to completed
      const completedFiles = state.files.map(file => 
        file.filename === filename 
          ? { ...file, status: 'completed' as const }
          : file
      );
      dispatch({ type: 'SET_FILES', payload: completedFiles });
    } catch (error) {
      console.error('Analysis error in DataContext:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Analysis failed' });
      
      // Update file status to error
      const errorFiles = state.files.map(file => 
        file.filename === filename 
          ? { ...file, status: 'error' as const }
          : file
      );
      dispatch({ type: 'SET_FILES', payload: errorFiles });
      throw error; // Re-throw to be caught by the component
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const sendChatMessage = async (message: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: state.analysisResults,
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();
      
      const chatMessage: ChatMessage = {
        id: Date.now().toString(),
        message,
        response: data.response,
        timestamp: new Date().toISOString(),
        query_type: data.query_type,
        confidence: data.confidence,
      };

      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: chatMessage });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Chat request failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearChatHistory = () => {
    dispatch({ type: 'CLEAR_CHAT_HISTORY' });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const value: DataContextType = {
    state,
    dispatch,
    uploadFile,
    analyzeFile,
    sendChatMessage,
    clearChatHistory,
    resetState,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}; 