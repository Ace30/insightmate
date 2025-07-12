import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
import json
import logging
import uuid
from datetime import datetime
import re

logger = logging.getLogger(__name__)

class ConversationalAgent:
    """AI conversational agent for natural language data queries"""
    
    def __init__(self):
        self.sessions = {}
        self.query_patterns = {
            'trend': r'\b(trend|trends|pattern|patterns|increase|decrease|growing|declining)\b',
            'correlation': r'\b(correlation|correlate|relationship|related|connection)\b',
            'anomaly': r'\b(anomaly|anomalies|outlier|outliers|unusual|strange|odd)\b',
            'summary': r'\b(summary|summarize|overview|summary|total|average|mean|median)\b',
            'comparison': r'\b(compare|comparison|versus|vs|difference|different)\b',
            'forecast': r'\b(forecast|predict|prediction|future|next|upcoming)\b',
            'distribution': r'\b(distribution|spread|range|histogram|frequency)\b',
            'top': r'\b(top|best|highest|maximum|peak|leading)\b',
            'bottom': r'\b(bottom|worst|lowest|minimum|least|poor)\b'
        }
        
        self.response_templates = {
            'trend': "I found {trend_count} trend(s) in your data. {trend_details}",
            'correlation': "I identified {corr_count} strong correlation(s). {corr_details}",
            'anomaly': "I detected {anomaly_count} anomaly/ies in your data. {anomaly_details}",
            'summary': "Here's a summary of your data: {summary_details}",
            'comparison': "Comparing the data shows: {comparison_details}",
            'forecast': "Based on the trends, I predict: {forecast_details}",
            'distribution': "The distribution analysis shows: {distribution_details}",
            'top': "The top performers are: {top_details}",
            'bottom': "The areas needing attention are: {bottom_details}"
        }
    
    def process_message(self, message: str, session_id: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process a natural language message and return a response"""
        try:
            # Generate session ID if not provided
            if not session_id:
                session_id = str(uuid.uuid4())
            
            # Initialize session if new
            if session_id not in self.sessions:
                self.sessions[session_id] = {
                    "messages": [],
                    "context": {},
                    "created_at": datetime.now()
                }
            
            # Parse the query
            parsed_query = self.parse_query(message)
            
            # Generate response based on query type
            response = self._generate_response(parsed_query, context)
            
            # Store message in session
            self.sessions[session_id]["messages"].append({
                "timestamp": datetime.now(),
                "message": message,
                "response": response,
                "query_type": parsed_query.get("type", "general")
            })
            
            # Generate suggestions
            suggestions = self._generate_suggestions(parsed_query)
            
            return {
                "response": response,
                "session_id": session_id,
                "suggestions": suggestions,
                "confidence": self._calculate_confidence(parsed_query),
                "query_type": parsed_query.get("type", "general")
            }
            
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            return {
                "response": "I'm sorry, I encountered an error processing your request. Please try rephrasing your question.",
                "session_id": session_id or str(uuid.uuid4()),
                "suggestions": [],
                "confidence": 0.0,
                "query_type": "error"
            }
    
    def parse_query(self, message: str) -> Dict[str, Any]:
        """Parse natural language query to extract intent and parameters"""
        try:
            message_lower = message.lower()
            query_info = {
                "original_message": message,
                "type": "general",
                "parameters": {},
                "visualizations": [],
                "confidence": 0.0
            }
            
            # Detect query type based on patterns
            detected_types = []
            for query_type, pattern in self.query_patterns.items():
                if re.search(pattern, message_lower):
                    detected_types.append(query_type)
            
            if detected_types:
                # Use the most specific type or combine if multiple
                if len(detected_types) == 1:
                    query_info["type"] = detected_types[0]
                else:
                    # Combine multiple types
                    query_info["type"] = "complex"
                    query_info["sub_types"] = detected_types
            
            # Extract specific parameters
            query_info["parameters"] = self._extract_parameters(message_lower)
            
            # Suggest visualizations
            query_info["visualizations"] = self._suggest_visualizations(query_info["type"])
            
            # Calculate confidence
            query_info["confidence"] = self._calculate_confidence(query_info)
            
            return query_info
            
        except Exception as e:
            logger.error(f"Error parsing query: {str(e)}")
            return {
                "original_message": message,
                "type": "general",
                "parameters": {},
                "visualizations": [],
                "confidence": 0.0
            }
    
    def _extract_parameters(self, message: str) -> Dict[str, Any]:
        """Extract specific parameters from the message"""
        parameters = {}
        
        # Extract column names (assuming they're mentioned)
        column_pattern = r'\b([A-Za-z_][A-Za-z0-9_]*)\b'
        potential_columns = re.findall(column_pattern, message)
        if potential_columns:
            parameters["columns"] = potential_columns[:5]  # Limit to 5 columns
        
        # Extract numbers
        number_pattern = r'\b(\d+(?:\.\d+)?)\b'
        numbers = re.findall(number_pattern, message)
        if numbers:
            parameters["numbers"] = [float(n) for n in numbers]
        
        # Extract time periods
        time_patterns = {
            'days': r'\b(\d+)\s*days?\b',
            'weeks': r'\b(\d+)\s*weeks?\b',
            'months': r'\b(\d+)\s*months?\b',
            'years': r'\b(\d+)\s*years?\b'
        }
        
        for period, pattern in time_patterns.items():
            match = re.search(pattern, message)
            if match:
                parameters[period] = int(match.group(1))
        
        return parameters
    
    def _suggest_visualizations(self, query_type: str) -> List[str]:
        """Suggest appropriate visualizations based on query type"""
        visualization_map = {
            'trend': ['line_chart', 'area_chart'],
            'correlation': ['scatter_plot', 'heatmap'],
            'anomaly': ['scatter_plot', 'box_plot'],
            'summary': ['bar_chart', 'pie_chart'],
            'comparison': ['bar_chart', 'grouped_bar_chart'],
            'forecast': ['line_chart', 'area_chart'],
            'distribution': ['histogram', 'box_plot'],
            'top': ['bar_chart', 'horizontal_bar_chart'],
            'bottom': ['bar_chart', 'horizontal_bar_chart'],
            'general': ['summary_table', 'basic_charts']
        }
        
        return visualization_map.get(query_type, ['summary_table'])
    
    def _calculate_confidence(self, query_info: Dict[str, Any]) -> float:
        """Calculate confidence score for the parsed query"""
        confidence = 0.5  # Base confidence
        
        # Boost confidence for specific query types
        if query_info["type"] != "general":
            confidence += 0.2
        
        # Boost for having parameters
        if query_info["parameters"]:
            confidence += 0.1
        
        # Boost for having visualization suggestions
        if query_info["visualizations"]:
            confidence += 0.1
        
        # Penalize for complex queries (multiple types)
        if "sub_types" in query_info and len(query_info["sub_types"]) > 1:
            confidence -= 0.1
        
        return min(1.0, max(0.0, confidence))
    
    def _generate_response(self, parsed_query: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> str:
        """Generate a natural language response based on the parsed query"""
        try:
            query_type = parsed_query["type"]
            
            if query_type == "trend":
                return self._generate_trend_response(parsed_query, context)
            elif query_type == "correlation":
                return self._generate_correlation_response(parsed_query, context)
            elif query_type == "anomaly":
                return self._generate_anomaly_response(parsed_query, context)
            elif query_type == "summary":
                return self._generate_summary_response(parsed_query, context)
            elif query_type == "comparison":
                return self._generate_comparison_response(parsed_query, context)
            elif query_type == "top":
                return self._generate_top_response(parsed_query, context)
            elif query_type == "bottom":
                return self._generate_bottom_response(parsed_query, context)
            else:
                return self._generate_general_response(parsed_query, context)
                
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return "I understand you're asking about your data. Let me analyze it and provide you with insights."
    
    def _generate_trend_response(self, parsed_query: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> str:
        """Generate response for trend-related queries"""
        if context and "trends" in context:
            trends = context["trends"]
            trend_count = len(trends)
            
            if trend_count > 0:
                trend_details = []
                for col, trend_info in trends.items():
                    direction = trend_info["direction"]
                    strength = trend_info["strength"]
                    trend_details.append(f"{col} shows a {direction} trend (strength: {strength:.3f})")
                
                return f"I found {trend_count} trend(s) in your data. {'. '.join(trend_details)}"
        
        return "I can help you identify trends in your data. Please upload your dataset and I'll analyze the patterns over time."
    
    def _generate_correlation_response(self, parsed_query: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> str:
        """Generate response for correlation-related queries"""
        if context and "correlations" in context:
            correlations = context["correlations"]
            if "strong_correlations" in correlations:
                strong_corrs = correlations["strong_correlations"]
                corr_count = len(strong_corrs)
                
                if corr_count > 0:
                    corr_details = []
                    for corr in strong_corrs[:3]:  # Show top 3
                        var1, var2 = corr["variable1"], corr["variable2"]
                        corr_val = corr["correlation"]
                        corr_details.append(f"{var1} and {var2} (r={corr_val:.3f})")
                    
                    return f"I identified {corr_count} strong correlation(s). {'. '.join(corr_details)}"
        
        return "I can analyze correlations between variables in your data. Please upload your dataset for correlation analysis."
    
    def _generate_anomaly_response(self, parsed_query: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> str:
        """Generate response for anomaly-related queries"""
        if context and "anomalies" in context:
            anomalies = context["anomalies"]
            anomaly_count = len(anomalies)
            
            if anomaly_count > 0:
                anomaly_details = []
                for col, anomaly_info in anomalies.items():
                    count = anomaly_info["count"]
                    percentage = anomaly_info["percentage"]
                    anomaly_details.append(f"{col}: {count} anomalies ({percentage:.1f}%)")
                
                return f"I detected {anomaly_count} column(s) with anomalies. {'. '.join(anomaly_details)}"
        
        return "I can detect anomalies and outliers in your data. Please upload your dataset for anomaly detection."
    
    def _generate_summary_response(self, parsed_query: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> str:
        """Generate response for summary-related queries"""
        if context and "data_summary" in context:
            summary = context["data_summary"]
            rows = summary.get("total_rows", 0)
            cols = summary.get("total_columns", 0)
            missing = sum(summary.get("missing_values", {}).values())
            
            return f"Your dataset contains {rows:,} rows and {cols} columns. There are {missing:,} missing values across all columns."
        
        return "I can provide a comprehensive summary of your data. Please upload your dataset for analysis."
    
    def _generate_comparison_response(self, parsed_query: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> str:
        """Generate response for comparison-related queries"""
        return "I can help you compare different aspects of your data. Please specify what you'd like to compare and upload your dataset."
    
    def _generate_top_response(self, parsed_query: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> str:
        """Generate response for top-performing queries"""
        return "I can identify the top performers in your data. Please upload your dataset and specify which metric you'd like to analyze."
    
    def _generate_bottom_response(self, parsed_query: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> str:
        """Generate response for bottom-performing queries"""
        return "I can identify areas that need attention in your data. Please upload your dataset for analysis."
    
    def _generate_general_response(self, parsed_query: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> str:
        """Generate response for general queries"""
        return "I'm here to help you analyze your data! Please upload your dataset and ask me specific questions about trends, correlations, anomalies, or any other insights you're looking for."
    
    def _generate_suggestions(self, parsed_query: Dict[str, Any]) -> List[str]:
        """Generate follow-up question suggestions"""
        suggestions = []
        query_type = parsed_query["type"]
        
        if query_type == "trend":
            suggestions = [
                "What factors are driving these trends?",
                "Are there any seasonal patterns?",
                "How do these trends compare to industry benchmarks?"
            ]
        elif query_type == "correlation":
            suggestions = [
                "What might be causing these correlations?",
                "Are there any confounding variables?",
                "How strong are these relationships?"
            ]
        elif query_type == "anomaly":
            suggestions = [
                "What could be causing these anomalies?",
                "Should we investigate these outliers further?",
                "Are these anomalies significant?"
            ]
        else:
            suggestions = [
                "What are the main trends in my data?",
                "Show me the top performing categories",
                "Identify any anomalies or outliers",
                "What factors contribute most to the key metrics?"
            ]
        
        return suggestions
    
    def get_session_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Get chat history for a specific session"""
        if session_id in self.sessions:
            return self.sessions[session_id]["messages"]
        return []
    
    def clear_session(self, session_id: str) -> None:
        """Clear chat history for a specific session"""
        if session_id in self.sessions:
            del self.sessions[session_id] 