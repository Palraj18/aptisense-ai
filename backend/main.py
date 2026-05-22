"""
AptiSense AI - Recruitment Intelligence Platform
Main FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import interview_router, proctoring_router, analytics_router, models_router
from app.routes.api import router as legacy_api_router
from app.routes.aptitude import router as aptitude_router

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered recruitment intelligence and assessment platform",
    version=settings.APP_VERSION,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(interview_router)
app.include_router(proctoring_router)
app.include_router(analytics_router)
app.include_router(models_router)
app.include_router(legacy_api_router)
app.include_router(aptitude_router)


@app.get("/")
def home():
    """Health check and API info."""
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "endpoints": {
            "interview": "/api/v1/interview",
            "proctoring": "/api/v1/proctoring",
            "docs": "/docs",
            "health": "/health",
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
    }


@app.get("/api/v1")
def api_v1_info():
    """API v1 information."""
    return {
        "version": "1.0",
        "endpoints": {
            "interview": "/api/v1/interview",
            "proctoring": "/api/v1/proctoring",
        }
    }