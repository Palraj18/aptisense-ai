"""Interview API endpoints."""
from fastapi import APIRouter, HTTPException, BackgroundTasks
import logging
from typing import Optional
from app.schemas import (
    InterviewSessionRequest,
    InterviewSessionResponse,
    InterviewAnswerRequest,
    InterviewAnswerResponse,
    InterviewReport,
    ErrorResponse,
)
from app.services.interview_manager import session_manager
from app.services.ai_orchestration import AIOrchestrationService
from app.services.question_bank import question_bank
from app.core.config import settings
from app.schemas.analysis import AnalysisModel
from pydantic import ValidationError

logger = logging.getLogger("app.interview")

router = APIRouter(prefix="/api/v1/interview", tags=["interview"])


# AI service will be created on-demand per request
def _get_ai_analysis(question: str, answer: str, category: str, difficulty: str, context: dict = None):
    """Get AI analysis for an answer."""
    try:
        print("[_get_ai_analysis] Instantiating AIOrchestrationService...")
        logger.debug("Instantiating AIOrchestrationService for analysis")
        service = AIOrchestrationService()
        print("[_get_ai_analysis] Calling analyze_answer...")
        result = service.analyze_answer(
            question=question,
            answer=answer,
            category=category,
            difficulty=difficulty,
            context=context,
        )
        print("[_get_ai_analysis] analyze_answer returned:", result)
        logger.debug("AI analysis result: %s", result)
        return result
    except Exception as e:
        # Make sure exceptions are visible in console and logs
        logger.exception("AI analysis failed: %s", e)
        try:
            print("[_get_ai_analysis] Exception during AI analysis:", e)
        except Exception:
            pass
        return None


def _get_follow_up(last_question: str, last_answer: str, category: str, context: dict, follow_up_count: int):
    """Get follow-up question from AI."""
    try:
        service = AIOrchestrationService()
        return service.generate_follow_up_question(
            last_question=last_question,
            last_answer=last_answer,
            category=category,
            context=context,
            follow_up_count=follow_up_count,
        )
    except Exception as e:
        logger.error(f"Follow-up generation failed: {e}", exc_info=True)
        return None


@router.post("/start", response_model=InterviewSessionResponse)
async def start_interview(request: InterviewSessionRequest):
    """Start a new interview session."""
    try:
        # Create session
        session = session_manager.create_session(
            interview_type=request.interview_type,
            position=request.position,
            experience_level=request.experience_level,
            enable_proctoring=request.enable_proctoring,
        )
        
        # Get first question
        question = question_bank.get_next_question(
            interview_type=request.interview_type,
            session_id=session.session_id,
            difficulty_level="easy",
        )
        
        if not question:
            raise HTTPException(status_code=500, detail="No questions available")
        
        # Add question to session
        session.add_question(
            question=question["text"],
            question_id=question["id"],
            category=question.get("category", "general"),
            difficulty=question.get("difficulty", "medium"),
        )
        
        estimated_duration = 45  # minutes
        
        return InterviewSessionResponse(
            session_id=session.session_id,
            interview_type=request.interview_type,
            position=request.position,
            experience_level=request.experience_level,
            first_question=question["text"],
            first_question_id=question["id"],
            proctoring_enabled=request.enable_proctoring,
            estimated_duration_minutes=estimated_duration,
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/answer", response_model=InterviewAnswerResponse)
async def submit_answer(request: InterviewAnswerRequest, background_tasks: BackgroundTasks):
    """Submit an answer and get analysis + follow-up."""
    try:
        session = session_manager.get_session(request.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get the question
        question = None
        for q in session.question_history:
            if q["question_id"] == request.question_id:
                question = q
                break
        
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Analyze answer with AI
        ai_analysis = _get_ai_analysis(
            question=question["question"],
            answer=request.answer_text,
            category=question["category"],
            difficulty=question["difficulty"],
            context=session.memory.get_context_for_follow_up(),
        )
        
        if ai_analysis:
            # Validate AI output against schema; fall back on original dict if invalid
            try:
                validated = AnalysisModel.model_validate(ai_analysis)
                ai_analysis = validated.model_dump()
            except ValidationError:
                logger.warning("AI analysis validation failed for session %s question %s", request.session_id, request.question_id, exc_info=True)
                # keep original ai_analysis
        else:
            # Fallback analysis
            ai_analysis = {
                "technical_score": 65,
                "communication_score": 70,
                "confidence_score": 68,
                "clarity_score": 72,
                "relevance_score": 75,
                "depth_score": 60,
                "vocabulary_score": 68,
                "hesitation_indicators": 70,
                "overall_impression": "Good response",
                "strengths": ["Clear communication"],
                "areas_for_improvement": ["More technical depth"],
                "feedback": ["Good answer structure"],
                "is_well_structured": True,
                "demonstrates_problem_solving": False,
                "shows_leadership": False,
                "has_specific_examples": True,
                "difficulty_adjustment": "maintain",
                "hiring_potential": "good",
            }
        
        # Add answer to session
        session.add_answer(
            answer=request.answer_text,
            question_id=request.question_id,
            ai_analysis=ai_analysis,
            typing_metrics=request.typing_metrics,
        )
        
        # Determine adaptive difficulty
        current_score = ai_analysis.get("overall_impression", "")
        performance_score = (
            (ai_analysis.get("technical_score", 50) +
             ai_analysis.get("communication_score", 50)) / 2
        )
        
        new_difficulty = question_bank.get_adaptive_difficulty(
            current_difficulty=session.difficulty_level,
            performance_score=performance_score,
        )
        session.difficulty_level = new_difficulty
        
        # Get follow-up question (if follow-ups available)
        follow_up_question: Optional[str] = None
        if session.follow_up_count < session.max_follow_ups_per_question:
            follow_up_question = _get_follow_up(
                last_question=question["question"],
                last_answer=request.answer_text,
                category=question["category"],
                context=session.memory.get_context_for_follow_up(),
                follow_up_count=session.follow_up_count + 1,
            )
            if follow_up_question:
                session.add_follow_up_question(
                        follow_up=follow_up_question,
                        parent_question_id=request.question_id,
                    )
            else:
                follow_up_question = "Could you provide more specific examples?"
                session.add_follow_up_question(
                    follow_up=follow_up_question,
                    parent_question_id=request.question_id,
                )
        
        # Save session in background
        background_tasks.add_task(session.save_session)
        
        # Map AI analysis to API AnswerAnalysis schema shape
        api_analysis = {
            "technical_score": float(ai_analysis.get("technical_score", 0)),
            "communication_score": float(ai_analysis.get("communication_score", 0)),
            "confidence_score": float(ai_analysis.get("confidence_score", 0)),
            "clarity_score": float(ai_analysis.get("clarity_score", 0)),
            "relevance_score": float(ai_analysis.get("relevance_score", 0)),
            "depth_score": float(ai_analysis.get("depth_score", ai_analysis.get("depth_score", 0))),
            "vocabulary_score": float(ai_analysis.get("vocabulary_score", 0)),
            "hesitation_score": float(ai_analysis.get("hesitation_indicators", ai_analysis.get("hesitation_score", 0))),
            "feedback_points": ai_analysis.get("feedback", []),
            "strengths": ai_analysis.get("strengths", []),
            "areas_for_improvement": ai_analysis.get("areas_for_improvement", []),
            "recommended_follow_up": follow_up_question or ai_analysis.get("recommended_follow_up"),
            "adaptive_difficulty_adjustment": ai_analysis.get("difficulty_adjustment", ai_analysis.get("difficulty_adjustment", "maintain")),
        }

        return InterviewAnswerResponse(
            session_id=request.session_id,
            question_id=request.question_id,
            answer_text=request.answer_text,
            analysis=api_analysis,
            follow_up_question=follow_up_question,
            interview_state=session.interview_state,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/next-question/{session_id}")
async def get_next_question(session_id: str):
    """Get the next question for the interview."""
    try:
        session = session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Check if interview should continue
        if not session.should_continue_interview():
            return {
                "should_continue": False,
                "message": "Interview completed or time limit reached",
            }
        
        # Get excluded question IDs
        exclude_ids = [q["question_id"] for q in session.question_history]
        
        # Get next question
        question = question_bank.get_next_question(
            interview_type=session.interview_type,
            session_id=session.session_id,
            difficulty_level=session.difficulty_level,
            exclude_ids=exclude_ids,
        )
        
        if not question:
            return {
                "should_continue": False,
                "message": "No more questions available",
            }
        
        # Add question to session
        session.add_question(
            question=question["text"],
            question_id=question["id"],
            category=question.get("category", "general"),
            difficulty=question.get("difficulty", "medium"),
        )
        
        return {
            "should_continue": True,
            "question_id": question["id"],
            "question": question["text"],
            "difficulty": question.get("difficulty", "medium"),
            "category": question.get("category", "general"),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/end/{session_id}")
async def end_interview(session_id: str, background_tasks: BackgroundTasks):
    """End interview and generate report."""
    try:
        success = session_manager.end_session(session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = session_manager.get_session(session_id)
        report = session.get_session_report()
        
        return {
            "success": True,
            "session_id": session_id,
            "message": "Interview completed",
            "report_ready": True,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/{session_id}", response_model=InterviewReport)
async def get_interview_report(session_id: str):
    """Get comprehensive interview report."""
    try:
        session = session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        report = session.get_session_report()
        
        proc_data = report.get("proctoring")
        if proc_data:
            risk = proc_data.get("risk_level", "low")
            if risk not in ["low", "medium", "high"]:
                risk = "low"
            proctoring_session = {
                "session_id": proc_data.get("session_id", session_id),
                "total_frames_analyzed": int(proc_data.get("total_frames_analyzed", 0)),
                "faces_detected_anomalies": int(proc_data.get("faces_detected_anomalies", proc_data.get("suspicious_events_count", 0))),
                "total_looking_away_duration_seconds": float(proc_data.get("total_looking_away_duration_seconds", 0.0)),
                "max_looking_away_duration_seconds": float(proc_data.get("max_looking_away_duration_seconds", 0.0)),
                "suspicious_events": int(proc_data.get("suspicious_events", proc_data.get("suspicious_events_count", 0))),
                "average_cheating_probability": float(proc_data.get("average_cheating_probability", 0.0)),
                "integrity_score": float(proc_data.get("integrity_score", 100.0)),
                "flagged_for_review": bool(proc_data.get("flagged_for_review", False)),
                "risk_level": risk,
            }
        else:
            proctoring_session = {
                "session_id": session_id,
                "total_frames_analyzed": 0,
                "faces_detected_anomalies": 0,
                "total_looking_away_duration_seconds": 0.0,
                "max_looking_away_duration_seconds": 0.0,
                "suspicious_events": 0,
                "average_cheating_probability": 0.0,
                "integrity_score": 100.0,
                "flagged_for_review": False,
                "risk_level": "low",
            }

        return InterviewReport(
            session_id=report["session_id"],
            interview_type=report["interview_type"],
            position=report["position"],
            experience_level=report["experience_level"],
            interview_date=report["start_time"],
            duration_minutes=int(report["duration_minutes"]),
            metrics={
                "overall_score": report["metrics"]["overall_score"],
                "communication_score": report["metrics"]["communication_score"],
                "technical_score": report["metrics"]["technical_score"],
                "confidence_score": report["metrics"]["confidence_score"],
                "problem_solving_score": report["metrics"]["problem_solving_score"],
                "behavioral_score": report["metrics"]["behavioral_consistency_score"],
                "consistency_score": report["metrics"]["behavioral_consistency_score"],
                "employability_rating": report["metrics"]["employability_rating"],
            },
            proctoring=proctoring_session,
            recommendation={
                "recommendation_id": session_id,
                "candidate_status": "RECOMMENDED" if report["metrics"]["overall_score"] >= 70 else "REQUIRES_REVIEW" if report["metrics"]["overall_score"] >= 60 else "NOT_RECOMMENDED",
                "recommended_for_round": "technical" if report["metrics"]["overall_score"] >= 70 else None,
                "strengths": report["strengths"],
                "concerns": report["weaknesses"],
                "recommendation_text": report["feedback"],
                "follow_up_actions": ["Review feedback", "Schedule next round"],
            },
            answer_summaries=[{"index": i, "score": report["metrics"]["overall_score"]} for i in range(len(session.answer_history))],
            interview_transcript=report["interview_transcript"],
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{session_id}")
async def get_session_status(session_id: str):
    """Get current session status."""
    try:
        session = session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "session_id": session_id,
            "state": session.interview_state,
            "questions_answered": len(session.answer_history),
            "duration_minutes": session.get_duration_minutes(),
            "should_continue": session.should_continue_interview(),
            "current_difficulty": session.difficulty_level,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
