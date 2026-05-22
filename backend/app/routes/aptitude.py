from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime
import json
import os
from app.core.config import settings

router = APIRouter()

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)

APTITUDE_DIR = os.path.join(
    BASE_DIR,
    "data",
    "aptitude"
)

ATTEMPTS_DIR = os.path.join(
    settings.DATA_DIR,
    "aptitude_attempts"
)

VALID_CATEGORIES = [
    "numerical",
    "verbal",
    "reasoning",
    "advanced_quant",
    "advanced_coding"
]

class AptitudeSubmission(BaseModel):
    category: str
    score: int
    total_questions: int
    attention_score: float
    suspicious_count: int
    tab_switches: int

@router.get("/aptitude/{category}")
def get_aptitude_questions(
    category: str
):
    if category not in VALID_CATEGORIES:
        return JSONResponse(
            status_code=404,
            content={
                "error":
                "Invalid category"
            }
        )

    file_path = os.path.join(
        APTITUDE_DIR,
        f"{category}.json"
    )

    try:
        with open(
            file_path,
            "r"
        ) as file:
            questions = json.load(
                file
            )

        return {
            "category":
            category,
            "questions":
            questions
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error": str(e)
            }
        )

@router.post("/aptitude/submit")
async def submit_aptitude_attempt(submission: AptitudeSubmission):
    """Save an aptitude test attempt to persistent storage."""
    try:
        os.makedirs(ATTEMPTS_DIR, exist_ok=True)
        attempt_id = str(uuid4())
        
        # Calculate percentage
        percentage = 0
        if submission.total_questions > 0:
            percentage = int((submission.score / submission.total_questions) * 100)
            
        attempt_data = {
            "attempt_id": attempt_id,
            "category": submission.category,
            "score": submission.score,
            "total_questions": submission.total_questions,
            "percentage": percentage,
            "attention_score": submission.attention_score,
            "suspicious_count": submission.suspicious_count,
            "tab_switches": submission.tab_switches,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        file_path = os.path.join(ATTEMPTS_DIR, f"{attempt_id}.json")
        with open(file_path, "w") as f:
            json.dump(attempt_data, f, indent=2)
            
        return {
            "status": "success",
            "attempt_id": attempt_id,
            "attempt": attempt_data
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to save attempt: {str(e)}"}
        )


@router.get("/aptitude/attempt/{attempt_id}")
def get_aptitude_attempt(attempt_id: str):
    file_path = os.path.join(ATTEMPTS_DIR, f"{attempt_id}.json")
    if not os.path.isfile(file_path):
        return JSONResponse(
            status_code=404,
            content={"error": "Attempt not found"}
        )
    try:
        with open(file_path, "r") as file:
            data = json.load(file)
        return data
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )