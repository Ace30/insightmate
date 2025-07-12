import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Tuple
import json
import logging

logger = logging.getLogger(__name__)

class DataService:
    """Service for handling data operations"""
    
    def __init__(self):
        self.supported_formats = {
            '.csv': self._read_csv,
            '.xlsx': self._read_excel,
            '.xls': self._read_excel,
            '.json': self._read_json,
            '.parquet': self._read_parquet
        }
    
    def read_file(self, file_path: Path) -> pd.DataFrame:
        """Read data file based on its extension"""
        try:
            file_extension = file_path.suffix.lower()
            
            if file_extension not in self.supported_formats:
                raise ValueError(f"Unsupported file format: {file_extension}")
            
            read_function = self.supported_formats[file_extension]
            df = read_function(file_path)
            
            # Basic validation
            if df.empty:
                raise ValueError("File appears to be empty")
            
            logger.info(f"Successfully read file: {file_path} with {len(df)} rows and {len(df.columns)} columns")
            return df
            
        except Exception as e:
            logger.error(f"Error reading file {file_path}: {str(e)}")
            raise
    
    def _read_csv(self, file_path: Path) -> pd.DataFrame:
        """Read CSV file with automatic encoding and delimiter detection"""
        try:
            # Try different encodings and delimiters
            encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
            delimiters = [',', ';', '\t', '|']
            
            for encoding in encodings:
                for delimiter in delimiters:
                    try:
                        # First, try to detect the delimiter automatically
                        df = pd.read_csv(file_path, encoding=encoding, sep=None, engine='python')
                        logger.info(f"Successfully read CSV with encoding: {encoding}")
                        return df
                    except Exception:
                        continue
                
                # If automatic detection fails, try with specific delimiter
                for delimiter in delimiters:
                    try:
                        df = pd.read_csv(file_path, encoding=encoding, sep=delimiter)
                        logger.info(f"Successfully read CSV with encoding: {encoding}, delimiter: {delimiter}")
                        return df
                    except Exception:
                        continue
            
            # If all combinations fail, try with more flexible settings
            try:
                df = pd.read_csv(file_path, encoding='utf-8', errors='ignore', sep=None, engine='python')
                return df
            except Exception:
                # Last resort: try with minimal settings
                df = pd.read_csv(file_path, encoding='utf-8', errors='ignore', sep=',', on_bad_lines='skip')
                return df
            
        except Exception as e:
            logger.error(f"Error reading CSV file {file_path}: {str(e)}")
            raise
    
    def _read_excel(self, file_path: Path) -> pd.DataFrame:
        """Read Excel file"""
        try:
            # Read all sheets and concatenate if multiple
            excel_file = pd.ExcelFile(file_path)
            
            if len(excel_file.sheet_names) == 1:
                return pd.read_excel(file_path)
            else:
                # If multiple sheets, read the first one
                return pd.read_excel(file_path, sheet_name=0)
                
        except Exception as e:
            logger.error(f"Error reading Excel file {file_path}: {str(e)}")
            raise
    
    def _read_json(self, file_path: Path) -> pd.DataFrame:
        """Read JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Handle different JSON structures
            if isinstance(data, list):
                return pd.DataFrame(data)
            elif isinstance(data, dict):
                # Try to find a data array in the JSON
                if 'data' in data:
                    return pd.DataFrame(data['data'])
                elif 'records' in data:
                    return pd.DataFrame(data['records'])
                else:
                    # Convert dict to DataFrame
                    return pd.DataFrame([data])
            else:
                raise ValueError("Unsupported JSON structure")
                
        except Exception as e:
            logger.error(f"Error reading JSON file {file_path}: {str(e)}")
            raise
    
    def _read_parquet(self, file_path: Path) -> pd.DataFrame:
        """Read Parquet file"""
        try:
            return pd.read_parquet(file_path)
        except Exception as e:
            logger.error(f"Error reading Parquet file {file_path}: {str(e)}")
            raise
    
    def get_data_info(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get comprehensive information about the dataset"""
        try:
            info = {
                "total_rows": len(df),
                "total_columns": len(df.columns),
                "column_names": df.columns.tolist(),
                "data_types": df.dtypes.astype(str).to_dict(),
                "missing_values": df.isnull().sum().to_dict(),
                "memory_usage": df.memory_usage(deep=True).sum(),
                "duplicate_rows": df.duplicated().sum(),
                "numeric_columns": df.select_dtypes(include=[np.number]).columns.tolist(),
                "categorical_columns": df.select_dtypes(include=['object']).columns.tolist(),
                "datetime_columns": df.select_dtypes(include=['datetime64']).columns.tolist()
            }
            
            # Add basic statistics for numeric columns
            if info["numeric_columns"]:
                info["numeric_stats"] = df[info["numeric_columns"]].describe().to_dict()
            
            return info
            
        except Exception as e:
            logger.error(f"Error getting data info: {str(e)}")
            raise
    
    def detect_data_types(self, df: pd.DataFrame) -> Dict[str, str]:
        """Intelligently detect and suggest data types for columns"""
        type_suggestions = {}
        
        for column in df.columns:
            col_data = df[column].dropna()
            
            if len(col_data) == 0:
                type_suggestions[column] = "unknown"
                continue
            
            # Check if it's numeric
            if pd.api.types.is_numeric_dtype(col_data):
                type_suggestions[column] = "numeric"
            # Check if it's datetime
            elif pd.api.types.is_datetime64_any_dtype(col_data):
                type_suggestions[column] = "datetime"
            # Check if it's categorical (low cardinality)
            elif col_data.nunique() / len(col_data) < 0.5:
                type_suggestions[column] = "categorical"
            else:
                type_suggestions[column] = "text"
        
        return type_suggestions
    
    def get_sample_data(self, df: pd.DataFrame, n_samples: int = 5) -> List[Dict[str, Any]]:
        """Get sample data for preview"""
        try:
            return df.head(n_samples).to_dict('records')
        except Exception as e:
            logger.error(f"Error getting sample data: {str(e)}")
            return [] 