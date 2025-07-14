from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
from pathlib import Path
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List
import aiofiles
import os

from services.data_service import DataService
from services.analysis_service import AnalysisService
from agents.data_cleaning_agent import DataCleaningAgent

router = APIRouter()

# Initialize services
data_service = DataService()
analysis_service = AnalysisService()
cleaning_agent = DataCleaningAgent()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a data file for analysis
    """
    try:
        # Validate file type
        allowed_extensions = {'.csv', '.xlsx', '.xls', '.json', '.parquet'}
        file_extension = Path(file.filename).suffix.lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_extension} not supported. Allowed: {allowed_extensions}"
            )
        
        # Create unique filename
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = Path("uploads") / unique_filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Read and validate data with better error handling
        try:
            df = data_service.read_file(file_path)
        except Exception as read_error:
            # If reading fails, provide helpful error message
            error_msg = f"Failed to read file: {str(read_error)}. "
            error_msg += "Please ensure the file is in a supported format and not corrupted."
            raise HTTPException(status_code=400, detail=error_msg)
        
        if df.empty:
            raise HTTPException(status_code=400, detail="File appears to be empty or contains no valid data")
        
        # Basic file info
        file_info = {
            "filename": unique_filename,
            "file_path": str(file_path),
            "file_size": len(content),
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": df.columns.tolist(),
            "upload_time": datetime.now().isoformat()
        }
        
        return JSONResponse(content={
            "message": "File uploaded successfully",
            "file_info": file_info,
            "preview": df.head(5).to_dict('records')
        })
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the full error for debugging
        import traceback
        print(f"Upload error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/analyze/{filename}")
async def analyze_data(filename: str):
    """
    Perform comprehensive data analysis
    """
    try:
        file_path = Path("uploads") / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        # Read data
        df = data_service.read_file(file_path)
        # Clean data using AI agent
        cleaned_df, cleaning_report = cleaning_agent.clean_data(df)
        # Perform comprehensive analysis
        analysis_results = analysis_service.analyze_data(cleaned_df)
        # Generate insights
        insights = analysis_service.generate_insights(cleaned_df, analysis_results)
        # Create visualization data
        charts_data = analysis_service.create_charts_data(cleaned_df, analysis_results)
        
        # Convert all outputs to pure Python types for JSON serialization
        analysis_results = analysis_service._convert_numpy_to_python(analysis_results)
        insights = analysis_service._convert_numpy_to_python(insights)
        charts_data = analysis_service._convert_numpy_to_python(charts_data)
        cleaning_report = analysis_service._convert_numpy_to_python(cleaning_report)
        
        # Convert data summary to pure Python types
        missing_values = cleaned_df.isnull().sum().to_dict()
        data_types = cleaned_df.dtypes.astype(str).to_dict()
        
        data_summary = {
            "total_rows": int(len(cleaned_df)),
            "total_columns": int(len(cleaned_df.columns)),
            "missing_values": {k: int(v) for k, v in missing_values.items()},
            "data_types": {k: str(v) for k, v in data_types.items()}
        }
        
        return JSONResponse(content={
            "message": "Analysis completed successfully",
            "cleaning_report": cleaning_report,
            "analysis_results": analysis_results,
            "insights": insights,
            "charts_data": charts_data,
            "data_summary": data_summary,
            "raw_data": cleaned_df.to_dict('records')
        })
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}\nTraceback:\n{tb}")

@router.get("/files")
async def list_uploaded_files():
    """
    List all uploaded files
    """
    try:
        uploads_dir = Path("uploads")
        files = []
        
        if uploads_dir.exists():
            for file_path in uploads_dir.iterdir():
                if file_path.is_file():
                    stat = file_path.stat()
                    files.append({
                        "filename": file_path.name,
                        "size": stat.st_size,
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                    })
        
        return JSONResponse(content={
            "files": files,
            "total_files": len(files)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")

@router.delete("/files/{filename}")
async def delete_file(filename: str):
    """
    Delete an uploaded file
    """
    try:
        file_path = Path("uploads") / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        file_path.unlink()
        
        return JSONResponse(content={
            "message": f"File {filename} deleted successfully"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

@router.get("/file-data/{filename}")
async def get_file_data(filename: str, limit: int = 1000):
    """
    Get raw data from uploaded file
    """
    try:
        file_path = Path("uploads") / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Read data
        df = data_service.read_file(file_path)
        
        # Limit the data to prevent memory issues
        if len(df) > limit:
            df = df.head(limit)
        
        # Convert to records for JSON serialization
        data = df.to_dict('records')
        
        return JSONResponse(content={
            "message": "File data retrieved successfully",
            "data": data,
            "total_rows": len(df),
            "columns": df.columns.tolist(),
            "data_types": df.dtypes.astype(str).to_dict()
        })
        
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Failed to get file data: {str(e)}\nTraceback:\n{tb}")

@router.post("/analyze/{filename}/insights")
async def generate_insights(filename: str, user_query: str = ""):
    """
    Generate natural language insights from data analysis
    """
    try:
        file_path = Path("uploads") / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Read data
        df = data_service.read_file(file_path)
        
        # Clean data using AI agent
        cleaned_df, cleaning_report = cleaning_agent.clean_data(df)
        
        # Perform comprehensive analysis
        analysis_results = analysis_service.analyze_data(cleaned_df)
        
        # Generate natural language insights
        nlg_insights = analysis_service.generate_natural_language_insights(
            cleaned_df, analysis_results, user_query
        )
        
        # Create visualization data
        charts_data = analysis_service.create_charts_data(cleaned_df, analysis_results)
        
        # Convert all outputs to pure Python types for JSON serialization
        analysis_results = analysis_service._convert_numpy_to_python(analysis_results)
        charts_data = analysis_service._convert_numpy_to_python(charts_data)
        cleaning_report = analysis_service._convert_numpy_to_python(cleaning_report)
        
        return JSONResponse(content={
            "message": "Natural language insights generated successfully",
            "nlg_insights": nlg_insights,
            "analysis_results": analysis_results,
            "charts_data": charts_data,
            "cleaning_report": cleaning_report,
            "user_query": user_query,
            "raw_data": cleaned_df.to_dict('records')
        })
        
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Insights generation failed: {str(e)}\nTraceback:\n{tb}") 