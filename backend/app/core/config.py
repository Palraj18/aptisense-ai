"""
Application configuration and environment settings.
"""
import os
from typing import List
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env file if it exists
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)


class Settings(BaseSettings):
    """Application settings."""

    # App
    APP_NAME: str = "AptiSense AI - Recruitment Intelligence Platform"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # API
    API_V1_STR: str = "/api/v1"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "*"
    ]
    
    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    # Default to a broadly-supported generative model; override with a
    # Gemini-specific model name in the environment if available (e.g. "gemini-1.0").
    GEMINI_MODEL: str = "models/text-bison-001"
    
    # Storage
    DATA_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "data"
    )
    
    # Interview
    MAX_INTERVIEW_DURATION_MINUTES: int = 60
    MIN_INTERVIEW_DURATION_MINUTES: int = 5
    MAX_FOLLOW_UP_QUESTIONS: int = 3
    ADAPTIVE_DIFFICULTY_THRESHOLD: float = 0.65
    
    # Proctoring
    PROCTORING_ENABLED: bool = True
    FACE_DETECTION_CONFIDENCE: float = 0.5
    MAX_LOOKING_AWAY_DURATION_SECONDS: int = 5
    CHEATING_PROBABILITY_THRESHOLD: float = 0.7
    
    # Analytics
    ANALYTICS_STORAGE_ENABLED: bool = True
    ENABLE_DETAILED_LOGGING: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
