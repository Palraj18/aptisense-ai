"""Pydantic schemas for API requests and responses."""
from __future__ import annotations
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# ==================== INTERVIEW SCHEMAS ====================

class QuestionBase(BaseModel):
    """Base question model."""
    text: str
    category: str
    difficulty: str = Field(..., pattern="^(easy|medium|hard)$")
    follow_up_capable: bool = True


class Question(QuestionBase):
    """Question with ID."""
    id: str


class InterviewAnswerRequest(BaseModel):
    """Request for submitting an answer."""
    session_id: str
    question_id: str
    answer_text: str
    audio_duration_seconds: Optional[float] = None
    typing_metrics: Optional[Dict[str, Any]] = None


# Move AnswerAnalysis up so it is available for type annotations
class AnswerAnalysis(BaseModel):
    """Detailed analysis of an answer."""
    technical_score: float = Field(..., ge=0, le=100)
    communication_score: float = Field(..., ge=0, le=100)
    confidence_score: float = Field(..., ge=0, le=100)
    clarity_score: float = Field(..., ge=0, le=100)
    relevance_score: float = Field(..., ge=0, le=100)
    depth_score: float = Field(..., ge=0, le=100)
    vocabulary_score: float = Field(..., ge=0, le=100)
    hesitation_score: float = Field(..., ge=0, le=100)
    feedback_points: List[str]
    strengths: List[str]
    areas_for_improvement: List[str]
    recommended_follow_up: Optional[str] = None
    adaptive_difficulty_adjustment: str = Field(..., pattern="^(increase|maintain|decrease)$")


class InterviewAnswerResponse(BaseModel):
    """Response after answer submission."""
    session_id: str
    question_id: str
    answer_text: str
    analysis: AnswerAnalysis
    follow_up_question: Optional[str] = None
    interview_state: str


class InterviewSessionRequest(BaseModel):
    """Request to start an interview session."""
    interview_type: str = Field(..., pattern="^(hr|technical|behavioral|communication|mixed|mock_hr|mock_technical|mock_behavioral|mock_communication)$")
    position: str
    experience_level: str = Field(..., pattern="^(entry|mid|senior)$")
    enable_proctoring: bool = True


class InterviewSessionResponse(BaseModel):
    """Response when starting an interview."""
    session_id: str
    interview_type: str
    position: str
    experience_level: str
    first_question: str
    first_question_id: str
    proctoring_enabled: bool
    estimated_duration_minutes: int


# ==================== EVALUATION SCHEMAS ====================

# (moved above)


class InterviewMetrics(BaseModel):
    """Aggregated interview metrics."""
    overall_score: float = Field(..., ge=0, le=100)
    communication_score: float = Field(..., ge=0, le=100)
    technical_score: float = Field(..., ge=0, le=100)
    confidence_score: float = Field(..., ge=0, le=100)
    problem_solving_score: float = Field(..., ge=0, le=100)
    behavioral_score: float = Field(..., ge=0, le=100)
    consistency_score: float = Field(..., ge=0, le=100)
    employability_rating: float = Field(..., ge=0, le=100)


# ==================== PROCTORING SCHEMAS ====================

class ProctoringFrame(BaseModel):
    """Single frame proctoring analysis."""
    timestamp: datetime
    faces_detected: int
    primary_face_confidence: float
    looking_direction: str
    eyes_visible: bool
    suspicious_activity_detected: bool
    suspicious_activity_type: Optional[str] = None
    cheating_probability: float = Field(..., ge=0, le=1)


class ProctoringSession(BaseModel):
    """Proctoring analytics for entire session."""
    session_id: str
    total_frames_analyzed: int
    faces_detected_anomalies: int
    total_looking_away_duration_seconds: float
    max_looking_away_duration_seconds: float
    suspicious_events: int
    average_cheating_probability: float
    integrity_score: float = Field(..., ge=0, le=100)
    flagged_for_review: bool
    risk_level: str = Field(..., pattern="^(low|medium|high)$")


# ==================== RECRUITER REPORT SCHEMAS ====================

class RecruitmentRecommendation(BaseModel):
    """Recruiter recommendation."""
    recommendation_id: str
    candidate_status: str = Field(..., pattern="^(RECOMMENDED|CONDITIONAL|NOT_RECOMMENDED|REQUIRES_REVIEW)$")
    recommended_for_round: Optional[str] = None
    strengths: List[str]
    concerns: List[str]
    recommendation_text: str
    hiring_manager_notes: Optional[str] = None
    follow_up_actions: List[str]


class InterviewReport(BaseModel):
    """Complete interview report for recruiters."""
    session_id: str
    candidate_name: Optional[str] = None
    interview_type: str
    position: str
    experience_level: str
    interview_date: datetime
    duration_minutes: int
    metrics: InterviewMetrics
    proctoring: ProctoringSession
    recommendation: RecruitmentRecommendation
    answer_summaries: List[Dict[str, Any]]
    interview_transcript: List[Dict[str, str]]


# ==================== ERROR SCHEMAS ====================

class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    error_code: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
