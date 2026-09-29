from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from app.llm_intelligence import answer_ai_analyst_question

router = APIRouter(prefix="/api/ai-analyst", tags=["AI Analyst"])

class ChatQueryRequest(BaseModel):
    query: str

@router.get("/suggestions")
def get_prompt_suggestions():
    return [
        "Which segment has the highest average project value?",
        "Why are certain opportunities classified as stalled?",
        "Which accounts have not engaged recently?",
        "What follow-up should the sales team prioritize today?",
        "What are the main differences between behavioral and firmographic segmentation?",
        "Which campaigns produced the highest simulated conversion rate?"
    ]

@router.post("/chat")
def chat_with_analyst(req: ChatQueryRequest):
    return answer_ai_analyst_question(req.query)
