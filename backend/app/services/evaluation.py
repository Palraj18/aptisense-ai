"""Interview evaluation service for comprehensive candidate assessment."""
from typing import Dict, List, Any, Optional
from datetime import datetime
import statistics
from app.services.interview_memory import InterviewMemory


class InterviewEvaluationService:
    """Comprehensive evaluation of interview performance."""

    def __init__(self):
        """Initialize evaluation service."""
        pass

    def evaluate_answer(
        self,
        ai_analysis: Dict[str, Any],
        typing_metrics: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Evaluate a single answer with AI analysis and typing metrics.
        
        Args:
            ai_analysis: Analysis from AI orchestration service
            typing_metrics: Optional typing behavior metrics
            
        Returns:
            Comprehensive answer evaluation
        """
        evaluation = {
            "timestamp": datetime.utcnow().isoformat(),
            "ai_scores": {
                "technical": ai_analysis.get("technical_score", 50),
                "communication": ai_analysis.get("communication_score", 50),
                "confidence": ai_analysis.get("confidence_score", 50),
                "clarity": ai_analysis.get("clarity_score", 50),
                "relevance": ai_analysis.get("relevance_score", 50),
                "depth": ai_analysis.get("depth_score", 50),
                "vocabulary": ai_analysis.get("vocabulary_score", 50),
            },
            "behavioral_analysis": {
                "is_well_structured": ai_analysis.get("is_well_structured", False),
                "demonstrates_problem_solving": ai_analysis.get("demonstrates_problem_solving", False),
                "shows_leadership": ai_analysis.get("shows_leadership", False),
                "has_specific_examples": ai_analysis.get("has_specific_examples", False),
            },
            "feedback": ai_analysis.get("feedback", []),
            "strengths": ai_analysis.get("strengths", []),
            "areas_for_improvement": ai_analysis.get("areas_for_improvement", []),
            "overall_impression": ai_analysis.get("overall_impression", ""),
        }
        
        # Add typing metrics analysis
        if typing_metrics:
            typing_analysis = self._analyze_typing_metrics(typing_metrics)
            evaluation["typing_analysis"] = typing_analysis
            # Adjust confidence based on typing behavior
            evaluation["ai_scores"]["confidence"] = self._adjust_confidence_score(
                evaluation["ai_scores"]["confidence"],
                typing_analysis,
            )
        
        return evaluation

    def _analyze_typing_metrics(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze typing behavior."""
        typing_speed = metrics.get("typing_speed", 0)  # WPM
        backspace_count = metrics.get("backspaces", 0)
        total_time = metrics.get("total_time", 0)  # seconds
        hesitation_time = metrics.get("hesitation_time", 0)  # seconds
        
        # Interpretation
        hesitation_score = min(100, max(0, 100 - (hesitation_time / max(total_time, 1)) * 100))
        backspace_score = min(100, max(0, 100 - (backspace_count / max(total_time / 60, 1)) * 50))
        
        return {
            "typing_speed_wpm": typing_speed,
            "backspace_count": backspace_count,
            "total_time_seconds": total_time,
            "hesitation_time_seconds": hesitation_time,
            "hesitation_score": hesitation_score,
            "correction_score": backspace_score,
            "interpretation": "confident" if hesitation_score > 70 else "thoughtful" if hesitation_score > 40 else "uncertain",
        }

    def _adjust_confidence_score(
        self,
        base_confidence: float,
        typing_analysis: Dict[str, Any],
    ) -> float:
        """Adjust confidence score based on typing behavior."""
        hesitation_score = typing_analysis.get("hesitation_score", 50)
        correction_score = typing_analysis.get("correction_score", 50)
        
        # Hesitation and corrections indicate lower confidence
        adjustment = (hesitation_score / 100 * 10) - 5
        adjustment += (correction_score / 100 * 5) - 2.5
        
        return min(100, max(0, base_confidence + adjustment))

    def calculate_aggregate_metrics(
        self,
        memory: InterviewMemory,
        all_evaluations: List[Dict[str, Any]],
    ) -> Dict[str, float]:
        """
        Calculate aggregate metrics across entire interview.
        
        Args:
            memory: Interview memory with conversation history
            all_evaluations: List of individual answer evaluations
            
        Returns:
            Aggregate interview metrics
        """
        if not all_evaluations:
            return self._get_empty_metrics()
        
        # Extract all scores
        technical_scores = [e["ai_scores"]["technical"] for e in all_evaluations]
        communication_scores = [e["ai_scores"]["communication"] for e in all_evaluations]
        confidence_scores = [e["ai_scores"]["confidence"] for e in all_evaluations]
        clarity_scores = [e["ai_scores"]["clarity"] for e in all_evaluations]
        relevance_scores = [e["ai_scores"]["relevance"] for e in all_evaluations]
        depth_scores = [e["ai_scores"]["depth"] for e in all_evaluations]
        vocabulary_scores = [e["ai_scores"]["vocabulary"] for e in all_evaluations]
        
        # Calculate averages
        metrics = {
            "technical_score": statistics.mean(technical_scores),
            "communication_score": statistics.mean(communication_scores),
            "confidence_score": statistics.mean(confidence_scores),
            "clarity_score": statistics.mean(clarity_scores),
            "relevance_score": statistics.mean(relevance_scores),
            "depth_score": statistics.mean(depth_scores),
            "vocabulary_score": statistics.mean(vocabulary_scores),
        }
        
        # Calculate behavioral metrics
        metrics.update(self._calculate_behavioral_metrics(all_evaluations, memory))
        
        # Overall score (weighted average)
        weights = {
            "technical_score": 0.25,
            "communication_score": 0.20,
            "confidence_score": 0.15,
            "clarity_score": 0.15,
            "relevance_score": 0.10,
            "depth_score": 0.10,
            "vocabulary_score": 0.05,
        }
        
        overall_score = sum(
            metrics[key] * weight
            for key, weight in weights.items()
            if key in metrics
        ) / sum(weights.values())
        
        metrics["overall_score"] = overall_score
        
        # Add employability rating
        metrics["employability_rating"] = self._calculate_employability_rating(metrics)
        
        # Round all scores
        return {k: round(v, 1) for k, v in metrics.items()}

    def _calculate_behavioral_metrics(
        self,
        all_evaluations: List[Dict[str, Any]],
        memory: InterviewMemory,
    ) -> Dict[str, float]:
        """Calculate behavioral consistency and other metrics."""
        behavioral = {
            "problem_solving_score": 0,
            "behavioral_consistency_score": 0,
            "leadership_potential_score": 0,
        }
        
        # Problem solving: count answers with problem_solving mentioned
        problem_solving_count = sum(
            1 for e in all_evaluations
            if e["behavioral_analysis"]["demonstrates_problem_solving"]
        )
        behavioral["problem_solving_score"] = (problem_solving_count / len(all_evaluations)) * 100 if all_evaluations else 0
        
        # Leadership: count leadership-related answers
        leadership_count = sum(
            1 for e in all_evaluations
            if e["behavioral_analysis"]["shows_leadership"]
        )
        behavioral["leadership_potential_score"] = (leadership_count / len(all_evaluations)) * 100 if all_evaluations else 0
        
        # Consistency: check if identified strengths appear consistently
        strengths_count = len(memory.identified_strengths)
        weaknesses_count = len(memory.identified_weaknesses)
        
        # Higher consistency if strengths/weaknesses are identified and stable
        consistency = 50
        if strengths_count >= 2:
            consistency += 25
        if weaknesses_count >= 1 and weaknesses_count <= 3:
            consistency += 25
        
        behavioral["behavioral_consistency_score"] = min(100, consistency)
        
        return behavioral

    def _get_empty_metrics(self) -> Dict[str, float]:
        """Return empty metrics."""
        return {
            "technical_score": 0,
            "communication_score": 0,
            "confidence_score": 0,
            "clarity_score": 0,
            "relevance_score": 0,
            "depth_score": 0,
            "vocabulary_score": 0,
            "problem_solving_score": 0,
            "behavioral_consistency_score": 0,
            "leadership_potential_score": 0,
            "overall_score": 0,
            "employability_rating": 0,
        }

    def _calculate_employability_rating(self, metrics: Dict[str, float]) -> float:
        """Calculate final employability rating."""
        key_metrics = [
            metrics.get("overall_score", 0),
            metrics.get("technical_score", 0),
            metrics.get("communication_score", 0),
            metrics.get("confidence_score", 0),
        ]
        
        # Weighted calculation
        if key_metrics:
            rating = (
                (metrics.get("overall_score", 0) * 0.4) +
                (metrics.get("technical_score", 0) * 0.25) +
                (metrics.get("communication_score", 0) * 0.25) +
                (metrics.get("problem_solving_score", 0) * 0.1)
            )
            return round(rating, 1)
        return 0

    def generate_feedback_text(
        self,
        metrics: Dict[str, float],
        strengths: List[str],
        weaknesses: List[str],
    ) -> str:
        """Generate human-readable feedback text."""
        feedback_parts = []
        
        # Overall assessment
        overall = metrics.get("overall_score", 0)
        if overall >= 85:
            feedback_parts.append("Excellent interview performance with strong technical and communication skills.")
        elif overall >= 70:
            feedback_parts.append("Good interview performance with solid understanding and communication.")
        elif overall >= 60:
            feedback_parts.append("Adequate interview performance. Some areas for improvement identified.")
        else:
            feedback_parts.append("Interview performance below expectations. Significant improvement needed.")
        
        # Strengths
        if strengths:
            feedback_parts.append(f"Key strengths: {', '.join(strengths[:3])}")
        
        # Areas for improvement
        if weaknesses:
            feedback_parts.append(f"Areas to develop: {', '.join(weaknesses[:3])}")
        
        # Specific recommendations
        if metrics.get("technical_score", 0) < 60:
            feedback_parts.append("Recommendation: Focus on building deeper technical knowledge.")
        if metrics.get("communication_score", 0) < 60:
            feedback_parts.append("Recommendation: Work on clear communication and articulation of ideas.")
        if metrics.get("confidence_score", 0) < 60:
            feedback_parts.append("Recommendation: Build confidence through practice and preparation.")
        
        return " ".join(feedback_parts)
