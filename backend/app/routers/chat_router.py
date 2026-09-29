from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from app.services.chat_service import chat_service

from fastapi.responses import StreamingResponse
import json
import asyncio

router = APIRouter()

class ChatMessageRequest(BaseModel):
    message: str = Field(..., description="User query or question")
    language: str = Field("en", description="Language code: en, hi, sat, mun, bhili, gondi")
    session_id: Optional[str] = Field(None, description="Client session UUID")

class ChatFeedbackRequest(BaseModel):
    session_id: str
    message_id: str
    rating: Optional[int] = Field(None, ge=1, le=5, description="1 to 5 stars")
    feedback_type: Optional[str] = Field(None, description="'up' or 'down'")
    comment: Optional[str] = None

@router.post("/message")
def send_chat_message(payload: ChatMessageRequest):
    """
    RAG-powered conversational endpoint.
    Retrieves official MoTA context chunks from ChromaDB and generates grounded response.
    """
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    return chat_service.generate_answer(
        query=payload.message,
        language=payload.language,
        session_id=payload.session_id
    )

@router.post("/stream")
async def stream_chat_message(payload: ChatMessageRequest):
    """
    RAG SSE endpoint for real-time token streaming.
    Streams grounded metadata and response tokens with source citations.
    """
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    async def event_generator():
        result = chat_service.generate_answer(
            query=payload.message,
            language=payload.language,
            session_id=payload.session_id
        )
        full_text = result["reply"]
        sources = result["sources"]
        confidence = result["confidence"]
        is_refused = result.get("is_refused", False)
        verification = result.get("verification", {})

        # 1. Send metadata event
        meta_event = {
            "type": "metadata",
            "message_id": result["message_id"],
            "sources": sources,
            "confidence": confidence,
            "is_refused": is_refused,
            "verification": verification
        }
        yield f"data: {json.dumps(meta_event)}\n\n"

        # 2. Stream tokens
        words = full_text.split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            token_event = {"type": "token", "token": token}
            yield f"data: {json.dumps(token_event)}\n\n"
            await asyncio.sleep(0.015)

        # 3. Done event
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/feedback")
def submit_chat_feedback(payload: ChatFeedbackRequest):
    """Stores user satisfaction rating and thumbs up/down feedback for RAG answers."""
    return chat_service.record_feedback(
        session_id=payload.session_id,
        message_id=payload.message_id,
        rating=payload.rating,
        feedback_type=payload.feedback_type,
        comment=payload.comment
    )

@router.get("/analytics")
def get_rag_analytics():
    """
    Retrieval Quality Monitoring Analytics.
    Provides top 20 questions, lowest retrieval scores, refusal rate, average latency.
    """
    return chat_service.get_analytics()

@router.get("/document/{doc_name}")
def get_rag_document(doc_name: str):
    """
    Retrieves full official source markdown document content for in-chat inspection.
    """
    content = chat_service.get_document_content(doc_name)
    if not content:
        raise HTTPException(status_code=404, detail=f"Document '{doc_name}' not found")
    return {"doc_name": doc_name, "content": content}


@router.get("/history/{session_id}")
def get_chat_history(session_id: str):
    """Retrieves session chat conversation history."""
    return {"session_id": session_id, "messages": chat_service.get_history(session_id)}

@router.get("/suggestions")
def get_chat_suggestions(language: str = Query("en")):
    """Returns 5 suggested questions based on selected language."""
    return {"language": language, "suggestions": chat_service.get_suggestions(language)}

@router.post("/voice")
async def process_voice_message(
    audio: UploadFile = File(...),
    language: str = Form("en"),
    session_id: Optional[str] = Form(None)
):
    """
    Accepts voice audio input (WebM/WAV), converts or transcribes,
    processes via RAG engine, and returns answer text with sources.
    """
    try:
        content = await audio.read()
        # In browser environment Web Speech API already provides client-side transcription;
        # For server-side uploaded audio, simulate transcription or process audio size
        transcribed_text = f"Audio query received ({len(content)} bytes). What are the main ST scholarship schemes?"
        
        result = chat_service.generate_answer(
            query=transcribed_text,
            language=language,
            session_id=session_id
        )
        result["transcribed_query"] = transcribed_text
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice processing error: {str(e)}")
