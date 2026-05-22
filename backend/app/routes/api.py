from fastapi import APIRouter
from fastapi.responses import JSONResponse

import json
import os

from app.services.ai_orchestration import AIOrchestrationService

router = APIRouter()

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)

QUESTIONS_PATH = os.path.join(
    BASE_DIR,
    "data",
    "questions.json"
)

@router.get("/")
def home():

    return {
        "message":
        "AptiSense AI Backend Running"
    }

@router.get("/questions/{category}")
def get_questions(category: str):

    with open(
        QUESTIONS_PATH,
        "r"
    ) as file:

        questions = json.load(file)

    if category not in questions:

        return JSONResponse(
            status_code=404,
            content={
                "error":
                "Category not found"
            }
        )

    return {
        "category": category,
        "questions": questions[category]
    }

try:
    service = AIOrchestrationService()
except Exception:
    service = None


@router.post("/evaluate")
async def evaluate(data: dict):

    question = data.get("question")
    answer = data.get("answer")
    category = data.get("category", "general")
    difficulty = data.get("difficulty", "medium")
    context = data.get("context", {})

    if service:
        analysis = service.analyze_answer(
            question=question,
            answer=answer,
            category=category,
            difficulty=difficulty,
            context=context,
        )
        return analysis

    # fallback simple analysis when AI service unavailable
    return {
        "technical_score": 50,
        "communication_score": 60,
        "confidence_score": 55,
        "clarity_score": 60,
        "relevance_score": 65,
        "depth_score": 55,
        "vocabulary_score": 60,
        "hesitation_indicators": 70,
        "overall_impression": "AI service not configured, returning fallback analysis",
        "strengths": [],
        "areas_for_improvement": [],
        "feedback": [],
        "is_well_structured": False,
        "demonstrates_problem_solving": False,
        "shows_leadership": False,
        "has_specific_examples": False,
        "difficulty_adjustment": "maintain",
        "hiring_potential": "needs_improvement",
    }