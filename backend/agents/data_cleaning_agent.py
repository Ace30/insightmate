import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
import logging
from datetime import datetime
import re

logger = logging.getLogger(__name__)

class DataCleaningAgent:
    """AI-powered data cleaning agent"""
    
    def __init__(self):
        self.cleaning_rules = {
            'missing_values': self._handle_missing_values,
            'duplicates': self._handle_duplicates,
            'outliers': self._handle_outliers,
            'data_types': self._fix_data_types,
            'inconsistent_values': self._handle_inconsistent_values,
            'formatting': self._fix_formatting
        }
    
    def clean_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Perform comprehensive data cleaning"""
        try:
            original_shape = df.shape
            cleaning_report = {
                "original_shape": original_shape,
                "cleaning_steps": [],
                "issues_found": [],
                "improvements": []
            }
            
            # Make a copy to avoid modifying original
            cleaned_df = df.copy()
            
            # Apply each cleaning rule
            for rule_name, rule_function in self.cleaning_rules.items():
                try:
                    cleaned_df, step_report = rule_function(cleaned_df)
                    cleaning_report["cleaning_steps"].append({
                        "rule": rule_name,
                        "report": step_report
                    })
                except Exception as e:
                    logger.error(f"Error applying cleaning rule {rule_name}: {str(e)}")
                    cleaning_report["cleaning_steps"].append({
                        "rule": rule_name,
                        "error": str(e)
                    })
            
            # Final validation
            final_shape = cleaned_df.shape
            cleaning_report["final_shape"] = final_shape
            cleaning_report["rows_removed"] = original_shape[0] - final_shape[0]
            cleaning_report["columns_removed"] = original_shape[1] - final_shape[1]
            
            # Generate summary
            cleaning_report["summary"] = self._generate_cleaning_summary(cleaning_report)
            
            return cleaned_df, cleaning_report
            
        except Exception as e:
            logger.error(f"Error in data cleaning: {str(e)}")
            raise
    
    def _handle_missing_values(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Handle missing values intelligently"""
        report = {
            "missing_counts": {},
            "imputation_methods": {},
            "columns_removed": []
        }
        
        for column in df.columns:
            missing_count = df[column].isnull().sum()
            if missing_count > 0:
                report["missing_counts"][column] = missing_count
                
                # Determine imputation method based on data type
                if df[column].dtype in ['int64', 'float64']:
                    # Numeric column - use median for robustness
                    median_value = df[column].median()
                    df[column].fillna(median_value, inplace=True)
                    report["imputation_methods"][column] = "median"
                elif df[column].dtype == 'object':
                    # Categorical column - use mode
                    mode_value = df[column].mode().iloc[0] if not df[column].mode().empty else "Unknown"
                    df[column].fillna(mode_value, inplace=True)
                    report["imputation_methods"][column] = "mode"
                else:
                    # Other types - use forward fill then backward fill
                    df[column].fillna(method='ffill', inplace=True)
                    df[column].fillna(method='bfill', inplace=True)
                    report["imputation_methods"][column] = "forward_backward_fill"
        
        return df, report
    
    def _handle_duplicates(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Remove duplicate rows"""
        original_count = len(df)
        df.drop_duplicates(inplace=True)
        removed_count = original_count - len(df)
        
        report = {
            "duplicates_removed": removed_count,
            "percentage_removed": (removed_count / original_count * 100) if original_count > 0 else 0
        }
        
        return df, report
    
    def _handle_outliers(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Detect and handle outliers in numeric columns"""
        report = {
            "outliers_detected": {},
            "outliers_handled": {}
        }
        
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        
        for column in numeric_columns:
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outliers = df[(df[column] < lower_bound) | (df[column] > upper_bound)]
            outlier_count = len(outliers)
            
            if outlier_count > 0:
                report["outliers_detected"][column] = {
                    "count": outlier_count,
                    "percentage": (outlier_count / len(df)) * 100,
                    "bounds": {"lower": lower_bound, "upper": upper_bound}
                }
                
                # Cap outliers instead of removing them
                df[column] = df[column].clip(lower=lower_bound, upper=upper_bound)
                report["outliers_handled"][column] = "capped"
        
        return df, report
    
    def _fix_data_types(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Fix data types intelligently"""
        report = {
            "type_conversions": {},
            "conversion_errors": {}
        }
        
        for column in df.columns:
            try:
                # Try to convert to numeric if possible
                if df[column].dtype == 'object':
                    # Check if it's actually numeric
                    numeric_sample = pd.to_numeric(df[column], errors='coerce')
                    if numeric_sample.notna().sum() > len(df[column]) * 0.8:
                        df[column] = pd.to_numeric(df[column], errors='coerce')
                        report["type_conversions"][column] = "object -> numeric"
                    
                    # Check if it's datetime
                    elif self._is_datetime_column(df[column]):
                        df[column] = pd.to_datetime(df[column], errors='coerce')
                        report["type_conversions"][column] = "object -> datetime"
                
                # Convert boolean-like columns
                elif df[column].dtype == 'object':
                    unique_values = df[column].dropna().unique()
                    if len(unique_values) <= 2:
                        bool_values = ['true', 'false', 'yes', 'no', '1', '0', 't', 'f', 'y', 'n']
                        if all(str(v).lower() in bool_values for v in unique_values):
                            df[column] = df[column].astype(str).str.lower().map({
                                'true': True, 'false': False,
                                'yes': True, 'no': False,
                                '1': True, '0': False,
                                't': True, 'f': False,
                                'y': True, 'n': False
                            })
                            report["type_conversions"][column] = "object -> boolean"
                            
            except Exception as e:
                report["conversion_errors"][column] = str(e)
        
        return df, report
    
    def _is_datetime_column(self, series: pd.Series) -> bool:
        """Check if a column contains datetime data"""
        try:
            # Sample the data to check for datetime patterns
            sample = series.dropna().head(10)
            if len(sample) == 0:
                return False
            
            # Check if the sample values contain common date patterns
            sample_str = ' '.join(str(x) for x in sample)
            date_patterns = ['/', '-', ':', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                           'jul', 'aug', 'sep', 'oct', 'nov', 'dec', '202', '201', '200']
            
            if any(pattern in sample_str.lower() for pattern in date_patterns):
                # Try to parse as datetime
                pd.to_datetime(sample, errors='raise')
                return True
            
            return False
        except:
            return False
    
    def _handle_inconsistent_values(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Handle inconsistent values in categorical columns"""
        report = {
            "inconsistencies_fixed": {},
            "standardization_applied": {}
        }
        
        categorical_columns = df.select_dtypes(include=['object']).columns
        
        for column in categorical_columns:
            # Standardize case for string columns
            if df[column].dtype == 'object':
                # Convert to string and standardize case
                df[column] = df[column].astype(str).str.strip().str.lower()
                
                # Remove extra whitespace
                df[column] = df[column].str.replace(r'\s+', ' ', regex=True)
                
                report["standardization_applied"][column] = "case_normalization_and_whitespace_removal"
        
        return df, report
    
    def _fix_formatting(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Fix common formatting issues"""
        report = {
            "formatting_fixes": {}
        }
        
        for column in df.columns:
            if df[column].dtype == 'object':
                # Remove leading/trailing whitespace
                df[column] = df[column].astype(str).str.strip()
                
                # Fix common currency formatting
                if 'price' in column.lower() or 'cost' in column.lower() or 'amount' in column.lower():
                    df[column] = df[column].str.replace(r'[^\d.-]', '', regex=True)
                    report["formatting_fixes"][column] = "currency_cleaning"
        
        return df, report
    
    def _generate_cleaning_summary(self, cleaning_report: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a summary of the cleaning process"""
        total_issues = 0
        total_fixes = 0
        
        for step in cleaning_report["cleaning_steps"]:
            if "report" in step:
                report = step["report"]
                if "missing_counts" in report:
                    total_issues += sum(report["missing_counts"].values())
                if "duplicates_removed" in report:
                    total_fixes += report["duplicates_removed"]
                if "outliers_detected" in report:
                    for col_info in report["outliers_detected"].values():
                        total_issues += col_info["count"]
        
        return {
            "total_issues_found": total_issues,
            "total_fixes_applied": total_fixes,
            "data_quality_improvement": "significant" if total_fixes > 0 else "minimal",
            "recommendations": self._generate_recommendations(cleaning_report)
        }
    
    def _generate_recommendations(self, cleaning_report: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on cleaning results"""
        recommendations = []
        
        for step in cleaning_report["cleaning_steps"]:
            if "report" in step:
                report = step["report"]
                
                if "missing_counts" in report and report["missing_counts"]:
                    max_missing_col = max(report["missing_counts"].items(), key=lambda x: x[1])
                    if max_missing_col[1] > 0:
                        recommendations.append(f"Consider investigating missing values in {max_missing_col[0]} ({max_missing_col[1]} missing values)")
                
                if "outliers_detected" in report and report["outliers_detected"]:
                    max_outlier_col = max(report["outliers_detected"].items(), key=lambda x: x[1]["count"])
                    if max_outlier_col[1]["count"] > 0:
                        recommendations.append(f"Review outliers in {max_outlier_col[0]} ({max_outlier_col[1]['count']} outliers detected)")
        
        if not recommendations:
            recommendations.append("Data quality is good. No major issues detected.")
        
        return recommendations 