from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, List
import json

from agents.conversational_agent import ConversationalAgent

router = APIRouter()

# Initialize conversational agent
chat_agent = ConversationalAgent()

class ChatMessage(BaseModel):
    message: str
    session_id: str = None
    context: Dict[str, Any] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    suggestions: List[str] = []
    visualizations: List[Dict[str, Any]] = []

@router.post("/send")
async def send_message(chat_message: ChatMessage):
    """
    Send a message to the conversational AI agent
    """
    try:
        # Process the message through the conversational agent
        response = chat_agent.process_message(
            message=chat_message.message,
            session_id=chat_message.session_id,
            context=chat_message.context
        )
        
        return JSONResponse(content={
            "response": response["response"],
            "session_id": response["session_id"],
            "suggestions": response.get("suggestions", []),
            "visualizations": response.get("visualizations", []),
            "confidence": response.get("confidence", 0.8)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@router.get("/suggestions")
async def get_suggestions():
    """
    Get common question suggestions for users
    """
    suggestions = [
        "What are the main trends in my data?",
        "Show me the top performing categories",
        "Identify any anomalies or outliers",
        "What factors contribute most to sales?",
        "Generate a summary report",
        "Compare performance across different periods",
        "Find correlations between variables",
        "What insights can you extract from this data?"
    ]
    
    return JSONResponse(content={
        "suggestions": suggestions
    })

@router.post("/analyze-query")
async def analyze_query(chat_message: ChatMessage):
    """
    Analyze a natural language query and return structured analysis
    """
    try:
        # Parse the query and extract analysis requirements
        analysis_request = chat_agent.parse_query(chat_message.message)
        
        return JSONResponse(content={
            "parsed_query": analysis_request,
            "query_type": analysis_request.get("type", "general"),
            "parameters": analysis_request.get("parameters", {}),
            "suggested_visualizations": analysis_request.get("visualizations", [])
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query analysis failed: {str(e)}")

@router.get("/session/{session_id}")
async def get_session_history(session_id: str):
    """
    Get chat history for a specific session
    """
    try:
        history = chat_agent.get_session_history(session_id)
        
        return JSONResponse(content={
            "session_id": session_id,
            "messages": history,
            "total_messages": len(history)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve session history: {str(e)}")

@router.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """
    Clear chat history for a specific session
    """
    try:
        chat_agent.clear_session(session_id)
        
        return JSONResponse(content={
            "message": f"Session {session_id} cleared successfully"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear session: {str(e)}") 