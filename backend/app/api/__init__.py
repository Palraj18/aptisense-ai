"""API routes."""
from app.api.interview import router as interview_router
from app.api.proctoring import router as proctoring_router
from app.api.analytics import router as analytics_router
from app.api.models import router as models_router

__all__ = ["interview_router", "proctoring_router", "analytics_router", "models_router"]
