import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
import json
import logging
from datetime import datetime
import re

logger = logging.getLogger(__name__)

class NLGService:
    """Natural Language Generation service for auto-generating insights in plain English"""
    
    def __init__(self):
        self.insight_templates = {
            "basic_stats": {
                "high_variance": "The {column} shows high variability with a standard deviation of {std:.2f}, indicating diverse values across your dataset.",
                "low_variance": "The {column} shows low variability with a standard deviation of {std:.2f}, suggesting consistent values.",
                "skewed": "The {column} is {skew_direction} with a skewness of {skew:.2f}, indicating an asymmetric distribution.",
                "normal": "The {column} follows a relatively normal distribution with a skewness of {skew:.2f}.",
                "outliers": "The {column} contains {outlier_count} potential outliers that may need attention."
            },
            "trends": {
                "strong_increasing": "There's a strong upward trend in {column} with a slope of {slope:.3f}.",
                "moderate_increasing": "There's a moderate upward trend in {column} with a slope of {slope:.3f}.",
                "strong_decreasing": "There's a strong downward trend in {column} with a slope of {slope:.3f}.",
                "moderate_decreasing": "There's a moderate downward trend in {column} with a slope of {slope:.3f}.",
                "stable": "The {column} shows a relatively stable pattern over time."
            },
            "correlations": {
                "strong_positive": "There's a strong positive correlation ({corr:.2f}) between {var1} and {var2}, suggesting they move together.",
                "moderate_positive": "There's a moderate positive correlation ({corr:.2f}) between {var1} and {var2}.",
                "strong_negative": "There's a strong negative correlation ({corr:.2f}) between {var1} and {var2}, suggesting an inverse relationship.",
                "moderate_negative": "There's a moderate negative correlation ({corr:.2f}) between {var1} and {var2}.",
                "weak": "There's a weak correlation ({corr:.2f}) between {var1} and {var2}."
            },
            "anomalies": {
                "high_count": "I detected {count} anomalies in {column}, representing {percentage:.1f}% of the data.",
                "moderate_count": "I found {count} potential outliers in {column} that may warrant investigation.",
                "low_count": "The data in {column} appears relatively clean with only {count} potential outliers."
            },
            "patterns": {
                "clusters": "The data shows {cluster_count} distinct clusters, suggesting natural groupings in your dataset.",
                "seasonality": "There appears to be seasonal patterns in the data, indicating recurring cycles.",
                "distributions": "The distribution analysis reveals {distribution_type} patterns in your data."
            }
        }
        
        self.summary_templates = {
            "dataset_overview": "Your dataset contains {row_count} rows and {col_count} columns, with {numeric_count} numeric variables.",
            "data_quality": "The data quality analysis shows {missing_percentage:.1f}% missing values and {duplicate_count} duplicate rows.",
            "key_findings": "Key findings include {finding_count} significant trends, {correlation_count} strong correlations, and {anomaly_count} anomalies.",
            "recommendations": "Based on the analysis, I recommend {recommendations}."
        }
    
    def generate_insights(self, df: pd.DataFrame, analysis_results: Dict[str, Any], user_query: Optional[str] = None) -> Dict[str, Any]:
        """Generate comprehensive insights in natural language"""
        try:
            insights = {
                "summary": self._generate_summary(df, analysis_results),
                "detailed_insights": self._generate_detailed_insights(df, analysis_results),
                "recommendations": self._generate_recommendations(df, analysis_results),
                "visualization_suggestions": self._suggest_visualizations(analysis_results),
                "query_specific_insights": self._generate_query_specific_insights(user_query, analysis_results) if user_query else None
            }
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}")
            return {
                "summary": "I analyzed your data and found some interesting patterns.",
                "detailed_insights": [],
                "recommendations": ["Consider exploring the data further with specific questions."],
                "visualization_suggestions": ["summary_chart"],
                "error": str(e)
            }
    
    def _generate_summary(self, df: pd.DataFrame, analysis_results: Dict[str, Any]) -> str:
        """Generate a high-level summary of the dataset"""
        try:
            row_count = len(df)
            col_count = len(df.columns)
            numeric_count = len(df.select_dtypes(include=[np.number]).columns)
            
            # Calculate missing data percentage
            missing_percentage = (df.isnull().sum().sum() / (row_count * col_count)) * 100
            
            # Count duplicates
            duplicate_count = df.duplicated().sum()
            
            # Count findings
            trend_count = len(analysis_results.get("trends", {}))
            correlation_count = len(analysis_results.get("correlations", {}).get("strong_correlations", []))
            anomaly_count = len(analysis_results.get("anomalies", {}))
            
            summary_parts = []
            
            # Dataset overview
            summary_parts.append(f"Your dataset contains {row_count:,} rows and {col_count} columns, with {numeric_count} numeric variables.")
            
            # Data quality
            if missing_percentage > 5:
                summary_parts.append(f"Data quality note: {missing_percentage:.1f}% of values are missing, which may affect analysis accuracy.")
            else:
                summary_parts.append("The data appears to be relatively complete with minimal missing values.")
            
            if duplicate_count > 0:
                summary_parts.append(f"Found {duplicate_count} duplicate rows that have been handled in the analysis.")
            
            # Key findings
            findings = []
            if trend_count > 0:
                findings.append(f"{trend_count} significant trend(s)")
            if correlation_count > 0:
                findings.append(f"{correlation_count} strong correlation(s)")
            if anomaly_count > 0:
                findings.append(f"{anomaly_count} anomaly/ies")
            
            if findings:
                summary_parts.append(f"Key findings include: {', '.join(findings)}.")
            
            return " ".join(summary_parts)
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return "I've analyzed your dataset and found several interesting patterns worth exploring."
    
    def _generate_detailed_insights(self, df: pd.DataFrame, analysis_results: Dict[str, Any]) -> List[str]:
        """Generate detailed insights for each analysis component"""
        insights = []
        
        try:
            # Basic statistics insights
            basic_stats = analysis_results.get("basic_stats", {})
            if isinstance(basic_stats, dict) and "message" not in basic_stats:
                for column, stats in basic_stats.items():
                    if isinstance(stats, dict):
                        insight = self._generate_statistics_insight(column, stats)
                        if insight:
                            insights.append(insight)
            
            # Trend insights
            trends = analysis_results.get("trends", {})
            for column, trend_info in trends.items():
                if isinstance(trend_info, dict):
                    insight = self._generate_trend_insight(column, trend_info)
                    if insight:
                        insights.append(insight)
            
            # Correlation insights
            correlations = analysis_results.get("correlations", {})
            strong_correlations = correlations.get("strong_correlations", [])
            for corr in strong_correlations:
                if isinstance(corr, dict):
                    insight = self._generate_correlation_insight(corr)
                    if insight:
                        insights.append(insight)
            
            # Anomaly insights
            anomalies = analysis_results.get("anomalies", {})
            for column, anomaly_info in anomalies.items():
                if isinstance(anomaly_info, dict):
                    insight = self._generate_anomaly_insight(column, anomaly_info)
                    if insight:
                        insights.append(insight)
            
            # Pattern insights
            patterns = analysis_results.get("patterns", {})
            if patterns.get("clusters"):
                insight = self._generate_cluster_insight(patterns["clusters"])
                if insight:
                    insights.append(insight)
            
        except Exception as e:
            logger.error(f"Error generating detailed insights: {str(e)}")
            insights.append("I found several interesting patterns in your data that could be worth exploring further.")
        
        return insights
    
    def _generate_statistics_insight(self, column: str, stats: Dict[str, Any]) -> Optional[str]:
        """Generate insight for basic statistics"""
        try:
            std = stats.get("std", 0)
            skew = stats.get("skewness", 0)
            
            if std > 0:
                # Determine variance level
                mean_val = stats.get("mean", 0)
                cv = std / abs(mean_val) if mean_val != 0 else 0
                
                if cv > 0.5:
                    return f"The {column} shows high variability with a standard deviation of {std:.2f}, indicating diverse values across your dataset."
                elif cv < 0.1:
                    return f"The {column} shows low variability with a standard deviation of {std:.2f}, suggesting consistent values."
            
            # Skewness insight
            if abs(skew) > 1:
                direction = "positively skewed" if skew > 0 else "negatively skewed"
                return f"The {column} is {direction} with a skewness of {skew:.2f}, indicating an asymmetric distribution."
            elif abs(skew) < 0.5:
                return f"The {column} follows a relatively normal distribution with a skewness of {skew:.2f}."
            
        except Exception as e:
            logger.error(f"Error generating statistics insight: {str(e)}")
        
        return None
    
    def _generate_trend_insight(self, column: str, trend_info: Dict[str, Any]) -> Optional[str]:
        """Generate insight for trend analysis"""
        try:
            direction = trend_info.get("direction", "")
            slope = trend_info.get("slope", 0)
            strength = trend_info.get("strength", 0)
            
            if abs(slope) > 0.1:
                if direction == "increasing":
                    if abs(slope) > 0.5:
                        return f"There's a strong upward trend in {column} with a slope of {slope:.3f}."
                    else:
                        return f"There's a moderate upward trend in {column} with a slope of {slope:.3f}."
                else:
                    if abs(slope) > 0.5:
                        return f"There's a strong downward trend in {column} with a slope of {slope:.3f}."
                    else:
                        return f"There's a moderate downward trend in {column} with a slope of {slope:.3f}."
            else:
                return f"The {column} shows a relatively stable pattern over time."
                
        except Exception as e:
            logger.error(f"Error generating trend insight: {str(e)}")
        
        return None
    
    def _generate_correlation_insight(self, corr_info: Dict[str, Any]) -> Optional[str]:
        """Generate insight for correlation analysis"""
        try:
            var1 = corr_info.get("variable1", "")
            var2 = corr_info.get("variable2", "")
            corr = corr_info.get("correlation", 0)
            strength = corr_info.get("strength", "")
            
            if abs(corr) > 0.8:
                if corr > 0:
                    return f"There's a very strong positive correlation ({corr:.2f}) between {var1} and {var2}, suggesting they move together."
                else:
                    return f"There's a very strong negative correlation ({corr:.2f}) between {var1} and {var2}, suggesting an inverse relationship."
            elif abs(corr) > 0.6:
                if corr > 0:
                    return f"There's a strong positive correlation ({corr:.2f}) between {var1} and {var2}."
                else:
                    return f"There's a strong negative correlation ({corr:.2f}) between {var1} and {var2}."
            else:
                return f"There's a moderate correlation ({corr:.2f}) between {var1} and {var2}."
                
        except Exception as e:
            logger.error(f"Error generating correlation insight: {str(e)}")
        
        return None
    
    def _generate_anomaly_insight(self, column: str, anomaly_info: Dict[str, Any]) -> Optional[str]:
        """Generate insight for anomaly detection"""
        try:
            count = anomaly_info.get("count", 0)
            percentage = anomaly_info.get("percentage", 0)
            
            if percentage > 10:
                return f"I detected {count} anomalies in {column}, representing {percentage:.1f}% of the data. These may need investigation."
            elif percentage > 2:
                return f"I found {count} potential outliers in {column} ({percentage:.1f}% of data) that may warrant attention."
            else:
                return f"The data in {column} appears relatively clean with only {count} potential outliers ({percentage:.1f}% of data)."
                
        except Exception as e:
            logger.error(f"Error generating anomaly insight: {str(e)}")
        
        return None
    
    def _generate_cluster_insight(self, cluster_info: Dict[str, Any]) -> Optional[str]:
        """Generate insight for clustering analysis"""
        try:
            if "message" not in cluster_info:
                n_clusters = cluster_info.get("n_clusters", 0)
                if n_clusters > 1:
                    return f"The data shows {n_clusters} distinct clusters, suggesting natural groupings in your dataset."
                else:
                    return "The clustering analysis suggests the data is relatively homogeneous without clear natural groupings."
            else:
                return cluster_info["message"]
                
        except Exception as e:
            logger.error(f"Error generating cluster insight: {str(e)}")
        
        return None
    
    def _generate_recommendations(self, df: pd.DataFrame, analysis_results: Dict[str, Any]) -> List[str]:
        """Generate actionable recommendations based on analysis"""
        recommendations = []
        
        try:
            # Data quality recommendations
            missing_percentage = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
            if missing_percentage > 10:
                recommendations.append("Consider data imputation strategies for missing values to improve analysis accuracy.")
            
            # Anomaly recommendations
            anomalies = analysis_results.get("anomalies", {})
            if len(anomalies) > 0:
                recommendations.append("Investigate the detected anomalies to understand their causes and potential impact.")
            
            # Correlation recommendations
            correlations = analysis_results.get("correlations", {})
            strong_correlations = correlations.get("strong_correlations", [])
            if len(strong_correlations) > 0:
                recommendations.append("Explore the strong correlations further to understand causal relationships.")
            
            # Trend recommendations
            trends = analysis_results.get("trends", {})
            if len(trends) > 0:
                recommendations.append("Monitor the identified trends to understand their implications for future planning.")
            
            # General recommendations
            if len(recommendations) == 0:
                recommendations.append("Consider exploring specific aspects of your data with targeted questions.")
                recommendations.append("Use the interactive visualizations to gain deeper insights into your data patterns.")
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            recommendations.append("Consider exploring the data further with specific questions.")
        
        return recommendations
    
    def _suggest_visualizations(self, analysis_results: Dict[str, Any]) -> List[str]:
        """Suggest appropriate visualizations based on analysis results"""
        suggestions = ["summary_chart"]
        
        try:
            # Suggest based on trends
            if analysis_results.get("trends"):
                suggestions.append("trend_chart")
            
            # Suggest based on correlations
            if analysis_results.get("correlations", {}).get("strong_correlations"):
                suggestions.append("correlation_heatmap")
            
            # Suggest based on anomalies
            if analysis_results.get("anomalies"):
                suggestions.append("anomaly_chart")
            
            # Suggest based on distributions
            if analysis_results.get("patterns", {}).get("distributions"):
                suggestions.append("distribution_chart")
            
        except Exception as e:
            logger.error(f"Error suggesting visualizations: {str(e)}")
        
        return suggestions
    
    def _generate_query_specific_insights(self, user_query: str, analysis_results: Dict[str, Any]) -> Optional[str]:
        """Generate insights specific to user's query"""
        try:
            query_lower = user_query.lower()
            
            # Check for specific query types
            if any(word in query_lower for word in ["trend", "pattern", "increase", "decrease"]):
                trends = analysis_results.get("trends", {})
                if trends:
                    trend_count = len(trends)
                    return f"Based on your question about trends, I found {trend_count} significant trend(s) in your data."
            
            elif any(word in query_lower for word in ["correlation", "relationship", "connection"]):
                correlations = analysis_results.get("correlations", {})
                strong_correlations = correlations.get("strong_correlations", [])
                if strong_correlations:
                    return f"Regarding correlations, I identified {len(strong_correlations)} strong correlation(s) in your data."
            
            elif any(word in query_lower for word in ["anomaly", "outlier", "unusual"]):
                anomalies = analysis_results.get("anomalies", {})
                if anomalies:
                    total_anomalies = sum(info.get("count", 0) for info in anomalies.values())
                    return f"Concerning anomalies, I detected {total_anomalies} potential outliers across your dataset."
            
            return None
            
        except Exception as e:
            logger.error(f"Error generating query-specific insights: {str(e)}")
            return None 