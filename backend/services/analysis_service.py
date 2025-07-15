import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
import json
import logging
from datetime import datetime
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from services.nlg_service import NLGService

logger = logging.getLogger(__name__)

class AnalysisService:
    """Service for comprehensive data analysis and insights generation"""
    
    def __init__(self):
        self.analysis_cache = {}
        self.nlg_service = NLGService()
    
    def analyze_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Perform comprehensive data analysis"""
        try:
            analysis_results = {
                "basic_stats": self._get_basic_statistics(df),
                "trends": self._detect_trends(df),
                "correlations": self._analyze_correlations(df),
                "anomalies": self._detect_anomalies(df),
                "patterns": self._identify_patterns(df),
                "segments": self._perform_segmentation(df),
                "forecasts": self._generate_forecasts(df)
            }
            
            # Convert numpy arrays to lists for JSON serialization
            analysis_results = self._convert_numpy_to_python(analysis_results)
            
            return analysis_results
            
        except Exception as e:
            logger.error(f"Error in data analysis: {str(e)}")
            raise
    
    def _get_basic_statistics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate basic statistics for numeric columns"""
        try:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            if len(numeric_cols) == 0:
                return {"message": "No numeric columns found for statistical analysis"}
            
            stats = {}
            for col in numeric_cols:
                col_data = df[col].dropna()
                if len(col_data) > 0:
                    stats[col] = {
                        "mean": float(col_data.mean()),
                        "median": float(col_data.median()),
                        "std": float(col_data.std()),
                        "min": float(col_data.min()),
                        "max": float(col_data.max()),
                        "q25": float(col_data.quantile(0.25)),
                        "q75": float(col_data.quantile(0.75)),
                        "skewness": float(col_data.skew()),
                        "kurtosis": float(col_data.kurtosis())
                    }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error calculating basic statistics: {str(e)}")
            return {}
    
    def _detect_trends(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect trends in time series data"""
        try:
            trends = {}
            
            # Look for date/time columns
            datetime_cols = df.select_dtypes(include=['datetime64']).columns
            
            if len(datetime_cols) == 0:
                # Try to convert string columns to datetime
                for col in df.columns:
                    try:
                        # Sample a few values to check if they look like dates
                        sample_values = df[col].dropna().head(5)
                        if len(sample_values) == 0:
                            continue
                        
                        # Check if the sample values contain common date patterns
                        sample_str = ' '.join(str(x) for x in sample_values)
                        date_patterns = ['/', '-', ':', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                                       'jul', 'aug', 'sep', 'oct', 'nov', 'dec', '202', '201', '200']
                        
                        if any(pattern in sample_str.lower() for pattern in date_patterns):
                            pd.to_datetime(df[col])
                            datetime_cols = [col]
                            break
                    except Exception as e:
                        logger.warning(f"Could not convert column {col} to datetime: {str(e)}")
                        continue
            
            if len(datetime_cols) > 0:
                date_col = datetime_cols[0]
                df_temp = df.copy()
                try:
                    df_temp[date_col] = pd.to_datetime(df_temp[date_col], errors='coerce')
                except Exception as e:
                    logger.warning(f"Could not convert column {date_col} to datetime in trend detection: {str(e)}")
                    return trends
                df_temp = df_temp.sort_values(date_col)
                
                # Analyze trends for numeric columns
                numeric_cols = df_temp.select_dtypes(include=[np.number]).columns
                
                for col in numeric_cols:
                    if col != date_col:
                        # Calculate trend (simple linear regression)
                        x = np.arange(len(df_temp))
                        y = df_temp[col].values
                        
                        if len(y) > 1:
                            try:
                                slope = np.polyfit(x, y, 1)[0]
                                trend_direction = "increasing" if slope > 0 else "decreasing"
                                trend_strength = abs(slope)
                                
                                trends[col] = {
                                    "direction": trend_direction,
                                    "strength": float(trend_strength),
                                    "slope": float(slope)
                                }
                            except Exception as e:
                                logger.warning(f"Could not calculate trend for column {col}: {str(e)}")
                                continue
            
            return trends
            
        except Exception as e:
            logger.error(f"Error detecting trends: {str(e)}")
            return {}
    
    def _analyze_correlations(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze correlations between numeric variables"""
        try:
            numeric_df = df.select_dtypes(include=[np.number])
            
            if len(numeric_df.columns) < 2:
                return {"message": "Insufficient numeric columns for correlation analysis"}
            
            # Calculate correlation matrix
            corr_matrix = numeric_df.corr()
            
            # Find strong correlations (|r| > 0.7)
            strong_correlations = []
            for i in range(len(corr_matrix.columns)):
                for j in range(i+1, len(corr_matrix.columns)):
                    corr_value = corr_matrix.iloc[i, j]
                    if abs(corr_value) > 0.7:
                        strong_correlations.append({
                            "variable1": corr_matrix.columns[i],
                            "variable2": corr_matrix.columns[j],
                            "correlation": float(corr_value),
                            "strength": "strong" if abs(corr_value) > 0.8 else "moderate"
                        })
            
            return {
                "correlation_matrix": corr_matrix.to_dict(),
                "strong_correlations": strong_correlations,
                "highest_correlation": max(strong_correlations, key=lambda x: abs(x["correlation"])) if strong_correlations else None
            }
            
        except Exception as e:
            logger.error(f"Error analyzing correlations: {str(e)}")
            return {}
    
    def _detect_anomalies(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect anomalies using statistical methods"""
        try:
            anomalies = {}
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            for col in numeric_cols:
                col_data = df[col].dropna()
                if len(col_data) > 0:
                    # Use IQR method for anomaly detection
                    Q1 = col_data.quantile(0.25)
                    Q3 = col_data.quantile(0.75)
                    IQR = Q3 - Q1
                    
                    lower_bound = Q1 - 1.5 * IQR
                    upper_bound = Q3 + 1.5 * IQR
                    
                    outliers = col_data[(col_data < lower_bound) | (col_data > upper_bound)]
                    
                    if len(outliers) > 0:
                        anomalies[col] = {
                            "count": len(outliers),
                            "percentage": float(len(outliers) / len(col_data) * 100),
                            "outlier_values": outliers.tolist(),
                            "bounds": {"lower": float(lower_bound), "upper": float(upper_bound)}
                        }
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detecting anomalies: {str(e)}")
            return {}
    
    def _identify_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Identify patterns in the data"""
        try:
            patterns = {
                "seasonality": self._detect_seasonality(df),
                "clusters": self._identify_clusters(df),
                "distributions": self._analyze_distributions(df)
            }
            
            return patterns
            
        except Exception as e:
            logger.error(f"Error identifying patterns: {str(e)}")
            return {}
    
    def _detect_seasonality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect seasonal patterns in time series data"""
        # Placeholder for seasonality detection
        return {"message": "Seasonality detection not implemented yet"}
    
    def _identify_clusters(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Identify clusters in the data using K-means"""
        try:
            numeric_df = df.select_dtypes(include=[np.number])
            
            if len(numeric_df.columns) < 2:
                return {"message": "Insufficient numeric columns for clustering"}
            
            # Remove rows with NaN values for clustering
            numeric_df_clean = numeric_df.dropna()
            
            if len(numeric_df_clean) < 10:
                return {"message": "Insufficient clean data for clustering"}
            
            # Standardize the data
            scaler = StandardScaler()
            scaled_data = scaler.fit_transform(numeric_df_clean)
            
            # Perform clustering
            n_clusters = min(5, len(scaled_data) // 10)  # Adaptive number of clusters
            if n_clusters < 2:
                return {"message": "Insufficient data for clustering"}
            
            kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            clusters = kmeans.fit_predict(scaled_data)
            
            # Add cluster labels to dataframe
            df_with_clusters = numeric_df_clean.copy()
            df_with_clusters['cluster'] = clusters
            
            return {
                "n_clusters": n_clusters,
                "cluster_sizes": df_with_clusters['cluster'].value_counts().to_dict(),
                "cluster_centers": kmeans.cluster_centers_.tolist(),
                "data_points_used": len(numeric_df_clean),
                "data_points_excluded": len(numeric_df) - len(numeric_df_clean)
            }
            
        except Exception as e:
            logger.error(f"Error identifying clusters: {str(e)}")
            return {"message": f"Clustering failed: {str(e)}"}
    
    def _analyze_distributions(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze distributions of numeric variables"""
        try:
            distributions = {}
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            for col in numeric_cols:
                col_data = df[col].dropna()
                if len(col_data) > 0:
                    distributions[col] = {
                        "distribution_type": "normal" if abs(col_data.skew()) < 0.5 else "skewed",
                        "skewness": float(col_data.skew()),
                        "kurtosis": float(col_data.kurtosis()),
                        "percentiles": {
                            "10th": float(col_data.quantile(0.1)),
                            "25th": float(col_data.quantile(0.25)),
                            "50th": float(col_data.quantile(0.5)),
                            "75th": float(col_data.quantile(0.75)),
                            "90th": float(col_data.quantile(0.9))
                        }
                    }
            
            return distributions
            
        except Exception as e:
            logger.error(f"Error analyzing distributions: {str(e)}")
            return {}
    
    def _perform_segmentation(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Perform customer/product segmentation"""
        # Placeholder for segmentation analysis
        return {"message": "Segmentation analysis not implemented yet"}
    
    def _generate_forecasts(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate simple forecasts for time series data"""
        # Placeholder for forecasting
        return {"message": "Forecasting not implemented yet"}
    
    def generate_insights(self, df: pd.DataFrame, analysis_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate actionable insights from analysis results"""
        try:
            insights = []
            
            # Basic data insights
            total_rows = len(df)
            total_cols = len(df.columns)
            missing_data = df.isnull().sum().sum()
            
            insights.append({
                "type": "data_overview",
                "title": "Dataset Overview",
                "description": f"Your dataset contains {total_rows:,} rows and {total_cols} columns",
                "severity": "info"
            })
            
            if missing_data > 0:
                missing_percentage = (missing_data / (total_rows * total_cols)) * 100
                insights.append({
                    "type": "data_quality",
                    "title": "Missing Data Detected",
                    "description": f"{missing_data:,} missing values ({missing_percentage:.1f}% of total data)",
                    "severity": "warning" if missing_percentage > 10 else "info"
                })
            
            # Trend insights
            if "trends" in analysis_results:
                for col, trend_info in analysis_results["trends"].items():
                    direction = trend_info["direction"]
                    strength = trend_info["strength"]
                    
                    insights.append({
                        "type": "trend",
                        "title": f"Trend in {col}",
                        "description": f"{col} shows a {direction} trend with strength {strength:.3f}",
                        "severity": "info"
                    })
            
            # Anomaly insights
            if "anomalies" in analysis_results:
                for col, anomaly_info in analysis_results["anomalies"].items():
                    count = anomaly_info["count"]
                    percentage = anomaly_info["percentage"]
                    
                    insights.append({
                        "type": "anomaly",
                        "title": f"Anomalies in {col}",
                        "description": f"Found {count} anomalies ({percentage:.1f}% of data) in {col}",
                        "severity": "warning" if percentage > 5 else "info"
                    })
            
            # Correlation insights
            if "correlations" in analysis_results and "strong_correlations" in analysis_results["correlations"]:
                strong_corrs = analysis_results["correlations"]["strong_correlations"]
                if strong_corrs:
                    top_corr = max(strong_corrs, key=lambda x: abs(x["correlation"]))
                    insights.append({
                        "type": "correlation",
                        "title": "Strong Correlation Found",
                        "description": f"Strong correlation ({top_corr['correlation']:.3f}) between {top_corr['variable1']} and {top_corr['variable2']}",
                        "severity": "info"
                    })
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}")
            return []
    
    def generate_natural_language_insights(self, df: pd.DataFrame, analysis_results: Dict[str, Any], user_query: Optional[str] = None) -> Dict[str, Any]:
        """Generate natural language insights using NLG service"""
        try:
            return self.nlg_service.generate_insights(df, analysis_results, user_query)
        except Exception as e:
            logger.error(f"Error generating natural language insights: {str(e)}")
            return {
                "summary": "I analyzed your data and found interesting patterns.",
                "detailed_insights": ["The analysis revealed several important patterns in your data."],
                "recommendations": ["Consider exploring specific aspects of your data with targeted questions."],
                "visualization_suggestions": ["summary_chart"],
                "error": str(e)
            }
    
    def create_charts_data(self, df: pd.DataFrame, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Create comprehensive visualization data"""
        try:
            charts_data = {
                "summary": self._create_summary_chart(df),
                "trends": self._create_trend_charts(df, analysis_results),
                "correlations": self._create_correlation_chart(analysis_results),
                "distributions": self._create_distribution_charts(df),
                "anomalies": self._create_anomaly_charts(df, analysis_results),
                "patterns": self._create_pattern_charts(df, analysis_results)
            }
            
            # Filter out None values
            charts_data = {k: v for k, v in charts_data.items() if v is not None}
            
            # Convert numpy arrays to Python lists for JSON serialization
            return self._convert_numpy_to_python(charts_data)
            
        except Exception as e:
            logger.error(f"Error creating charts data: {str(e)}")
            return {"error": f"Failed to create visualizations: {str(e)}"}
    
    def _create_summary_chart(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Create summary statistics chart"""
        try:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            if len(numeric_cols) == 0:
                return {"error": "No numeric columns for summary chart"}
            
            # Calculate summary statistics
            summary_data = []
            for col in numeric_cols:
                col_data = df[col].dropna()
                if len(col_data) > 0:
                    summary_data.append({
                        "column": col,
                        "mean": float(col_data.mean()),
                        "median": float(col_data.median()),
                        "std": float(col_data.std())
                    })
            
            return {
                "type": "summary_stats",
                "data": summary_data
            }
            
        except Exception as e:
            logger.error(f"Error creating summary chart: {str(e)}")
            return {}
    
    def _create_trend_charts(self, df: pd.DataFrame, analysis_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create trend charts"""
        try:
            charts = []
            
            if "trends" in analysis_results:
                for col, trend_info in analysis_results["trends"].items():
                    charts.append({
                        "type": "line",
                        "title": f"Trend Analysis - {col}",
                        "data": {
                            "x": list(range(len(df))),
                            "y": df[col].tolist(),
                            "trend": trend_info
                        }
                    })
            
            return charts
            
        except Exception as e:
            logger.error(f"Error creating trend charts: {str(e)}")
            return []
    
    def _create_correlation_chart(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Create correlation heatmap"""
        try:
            if "correlations" in analysis_results and "correlation_matrix" in analysis_results["correlations"]:
                corr_matrix = analysis_results["correlations"]["correlation_matrix"]
                
                return {
                    "type": "heatmap",
                    "title": "Correlation Matrix",
                    "data": corr_matrix
                }
            
            return {"error": "No correlation data available"}
            
        except Exception as e:
            logger.error(f"Error creating correlation chart: {str(e)}")
            return {}
    
    def _create_distribution_charts(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Create distribution charts"""
        try:
            charts = []
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            for col in numeric_cols:
                col_data = df[col].dropna()
                if len(col_data) > 0:
                    charts.append({
                        "type": "histogram",
                        "title": f"Distribution - {col}",
                        "data": {
                            "values": col_data.tolist(),
                            "column": col
                        }
                    })
            
            return charts
            
        except Exception as e:
            logger.error(f"Error creating distribution charts: {str(e)}")
            return []
    
    def _create_anomaly_charts(self, df: pd.DataFrame, analysis_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create anomaly detection charts"""
        try:
            charts = []
            
            if "anomalies" in analysis_results:
                for col, anomaly_info in analysis_results["anomalies"].items():
                    col_data = df[col].dropna()
                    if len(col_data) > 0:
                        charts.append({
                            "type": "scatter",
                            "title": f"Anomaly Detection - {col}",
                            "data": {
                                "values": col_data.tolist(),
                                "anomalies": anomaly_info["outlier_values"],
                                "bounds": anomaly_info["bounds"]
                            }
                        })
            
            return charts
            
        except Exception as e:
            logger.error(f"Error creating anomaly charts: {str(e)}")
            return [] 
    
    def _create_pattern_charts(self, df: pd.DataFrame, analysis_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create pattern visualization charts"""
        try:
            charts = []
            
            # Create simple scatter plots for numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) >= 2:
                # Create scatter plot for first two numeric columns
                cols_to_plot = numeric_cols[:2]
                if len(cols_to_plot) >= 2:
                    charts.append({
                        "type": "scatter",
                        "title": f"Relationship: {cols_to_plot[0]} vs {cols_to_plot[1]}",
                        "data": {
                            "x": df[cols_to_plot[0]].tolist(),
                            "y": df[cols_to_plot[1]].tolist(),
                            "x_label": cols_to_plot[0],
                            "y_label": cols_to_plot[1]
                        },
                        "description": f"Scatter plot showing relationship between {cols_to_plot[0]} and {cols_to_plot[1]}"
                    })
            
            # Create correlation heatmap data if available
            if "correlations" in analysis_results and "correlation_matrix" in analysis_results["correlations"]:
                corr_matrix = analysis_results["correlations"]["correlation_matrix"]
                charts.append({
                    "type": "correlation_heatmap",
                    "title": "Correlation Matrix",
                    "data": corr_matrix,
                    "description": "Heatmap showing correlations between numeric variables"
                })
            
            return charts
            
        except Exception as e:
            logger.error(f"Error creating pattern charts: {str(e)}")
            return [] 
    
    def _convert_numpy_to_python(self, obj):
        """Recursively convert numpy arrays to Python lists for JSON serialization"""
        if isinstance(obj, dict):
            return {key: self._convert_numpy_to_python(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_numpy_to_python(item) for item in obj]
        elif hasattr(obj, 'tolist'):  # numpy array
            return obj.tolist()
        elif hasattr(obj, 'item'):  # numpy scalar
            return obj.item()
        else:
            return obj 