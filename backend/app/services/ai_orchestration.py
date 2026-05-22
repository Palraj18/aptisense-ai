"""AI orchestration service for intelligent interview analysis and follow-ups."""
import logging
import json
import os
import re
import time
from typing import Dict, List, Any, Optional, Tuple
import google.generativeai as genai
from app.core.config import settings
from app.schemas.analysis import AnalysisModel, RecommendationModel
from pydantic import ValidationError


class AIOrchestrationService:
    """Orchestrates Gemini AI for intelligent interview analysis."""

    def __init__(self):
        """Initialize AI service."""
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not configured")
        genai.configure(api_key=api_key)
        # Try configured model, but fall back to known compatible names if unavailable
        preferred_models = [settings.GEMINI_MODEL] if settings.GEMINI_MODEL else []
        preferred_models += [
            "models/text-bison-001",
            "chat-bison-001",
            "models/chat-bison-001",
            "gemini-1.0",
        ]

        last_exc = None
        self.model = None
        for m in preferred_models:
            if not m:
                continue
            try:
                self.model = genai.GenerativeModel(m)
                # store the actual model name chosen for diagnostics
                self.chosen_model = m
                break
            except Exception as e:
                last_exc = e
                try:
                    # best-effort logging
                    print(f"[AIOrchestrationService] model {m} not available: {e}")
                except Exception:
                    pass

        if self.model is None:
            raise last_exc or RuntimeError("No valid generative model available")
        self.logger = logging.getLogger("app.ai_orchestration")
        try:
            self.logger.info("Using generative model: %s", getattr(self, "chosen_model", "unknown"))
        except Exception:
            pass
        self.logger = logging.getLogger("app.ai_orchestration")

    def analyze_answer(
        self,
        question: str,
        answer: str,
        category: str,
        difficulty: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Intelligently analyze candidate answer using Gemini.
        
        Args:
            question: The question asked
            answer: Candidate's answer
            category: Question category (hr, technical, etc.)
            difficulty: Question difficulty (easy, medium, hard)
            context: Optional context from interview memory
            
        Returns:
            Comprehensive analysis with scores and feedback
        """
        prompt = self._build_analysis_prompt(
            question, answer, category, difficulty, context
        )

        try:
            response_text = self._call_model(prompt)
            # Log raw response for debugging
            try:
                self.logger.debug("Raw model response text: %s", response_text)
                print("[AIOrchestrationService] Raw model response:", response_text)
            except Exception:
                pass
            json_str = self._extract_json_block(response_text)
            if json_str:
                analysis = json.loads(json_str)
                try:
                    model = AnalysisModel.parse_obj(analysis)
                    return model.dict()
                except ValidationError:
                    # fall through to more forgiving parse
                    pass
            # If parsing/validation failed, try parsing free text fallback
            return self._parse_analysis_response(response_text)
        except Exception:
            return self._fallback_analysis(question, answer, category)

    def _build_analysis_prompt(
        self,
        question: str,
        answer: str,
        category: str,
        difficulty: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Build detailed prompt for AI analysis."""
        context_str = ""
        if context:
            context_str = f"""
Previous Interview Context:
- Identified Strengths: {', '.join(context.get('identified_strengths', []))}
- Areas for Improvement: {', '.join(context.get('identified_weaknesses', []))}
- Focus Areas: {', '.join(context.get('candidate_focus_areas', []))}
"""

        prompt = f"""You are a senior recruiter, Principal Software Engineer, and elite technical bar raiser conducting a premium corporate talent assessment. Analyze the candidate's response with professional rigor.

CANDIDATE AND QUESTION DETAIL:
- Category: {category}
- Difficulty Level: {difficulty}
- Core Interview Question: {question}

CANDIDATE'S DETAILED RESPONSE:
\"\"\"
{answer}
\"\"\"

{context_str}

Evaluate the candidate's performance across technical mastery (especially algorithmic correctness, structural knowledge, and time/space complexity analysis if a technical question), depth of thought, communication effectiveness, and clarity. Avoid generic, robotic templates. Your observations must feel customized to this candidate's exact words.

Provide a structured, highly parsable JSON analysis matching this schema:
{{
    "technical_score": <0-100 score indicating depth of conceptual understanding, algorithmic accuracy, and technical exactness>,
    "communication_score": <0-100 score evaluating clarity, sentence structuring, speed, and articulate explanation>,
    "confidence_score": <0-100 score assessing certainty, lack of hesitations, and fluid speaking posture>,
    "clarity_score": <0-100 score for conciseness and logical structure>,
    "relevance_score": <0-100 score for addressing the exact question asked without wandering>,
    "depth_score": <0-100 score for explaining underlying mechanics and edge-cases rather than high-level summaries>,
    "vocabulary_score": <0-100 score evaluating proper industry-standard/academic terminology usage>,
    "hesitation_indicators": <0-100 score, high indicates frequent pauses, fillers, or uncertainty>,
    "overall_impression": "<A custom 1-2 sentence senior recruiter observation reflecting the exact technical depth and communication style shown>",
    "strengths": ["<Specific strength with citation from their words>", "<Second specific strength>", ...],
    "areas_for_improvement": ["<Concrete improvement recommendation referencing their words>", "<Second improvement suggestion>", ...],
    "feedback": ["<Actionable, detailed feedback point 1>", "<Actionable, detailed feedback point 2>", "<Actionable, detailed feedback point 3>"],
    "is_well_structured": <true/false>,
    "demonstrates_problem_solving": <true/false>,
    "shows_leadership": <true/false>,
    "has_specific_examples": <true/false>,
    "difficulty_adjustment": "<increase|maintain|decrease>",
    "hiring_potential": "<excellent|good|moderate|needs_improvement>"
}}

Ensure all feedback points are constructive, direct, highly professional, and customized.
"""
        
        return prompt

    def _parse_analysis_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini response into structured analysis."""
        try:
            json_str = self._extract_json_block(response_text)
            if json_str:
                analysis = json.loads(json_str)
                if self._validate_analysis(analysis):
                    return analysis
        except (json.JSONDecodeError, ValueError):
            pass

        return self._fallback_analysis_from_text(response_text)

    def _call_model(self, prompt: str, max_retries: int = 3, initial_delay: float = 1.0) -> str:
        """Call the Gemini model with simple retry/backoff and return text."""
        delay = initial_delay
        last_err = None
        for attempt in range(1, max_retries + 1):
            try:
                response = self.model.generate_content(prompt)
                # debug log the full response object if possible
                try:
                    self.logger.debug("Model generate_content response: %s", repr(response))
                except Exception:
                    pass
                text = getattr(response, "text", None)
                if text is None and hasattr(response, "candidates"):
                    # Some SDKs return candidates list
                    candidates = getattr(response, "candidates", [])
                    if candidates:
                        text = candidates[0].get("content") if isinstance(candidates[0], dict) else str(candidates[0])
                return text or ""
            except Exception as e:
                last_err = e
                # log exception per-attempt for visibility
                try:
                    self.logger.exception("Model call attempt %s failed: %s", attempt, e)
                    print(f"[AIOrchestrationService] model call attempt {attempt} failed: {e}")
                except Exception:
                    pass
                # If the error indicates the configured model is not available for this API,
                # try a few known compatible model names and retry a single time.
                err_text = str(e).lower()
                if "not found" in err_text or "not supported" in err_text or "is not found" in err_text:
                    fallback_names = [
                        "models/text-bison-001",
                        "chat-bison-001",
                        "models/chat-bison-001",
                        "gemini-1.0",
                    ]
                    for alt in fallback_names:
                        try:
                            try:
                                self.logger.info("Attempting fallback model: %s", alt)
                            except Exception:
                                pass
                            self.model = genai.GenerativeModel(alt)
                            response = self.model.generate_content(prompt)
                            text = getattr(response, "text", None)
                            if text is None and hasattr(response, "candidates"):
                                candidates = getattr(response, "candidates", [])
                                if candidates:
                                    text = candidates[0].get("content") if isinstance(candidates[0], dict) else str(candidates[0])
                            return text or ""
                        except Exception as alt_e:
                            try:
                                self.logger.warning("Fallback model %s failed: %s", alt, alt_e)
                                print(f"[AIOrchestrationService] fallback model {alt} failed: {alt_e}")
                            except Exception:
                                pass
                time.sleep(delay)
                delay *= 2
        raise last_err

    def _extract_json_block(self, text: str) -> Optional[str]:
        """Extract the first JSON object block from text using brace counting."""
        if not text:
            return None
        start = text.find("{")
        if start == -1:
            return None
        depth = 0
        for i in range(start, len(text)):
            ch = text[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return text[start : i + 1]
        return None

    def _validate_analysis(self, analysis: Dict[str, Any]) -> bool:
        """Quick validation to ensure required fields exist and have reasonable types."""
        required_numeric = [
            "technical_score",
            "communication_score",
            "confidence_score",
            "clarity_score",
            "relevance_score",
        ]
        for key in required_numeric:
            if key not in analysis:
                return False
            try:
                val = float(analysis.get(key, 0))
            except Exception:
                return False
        # strengths and areas_for_improvement should be lists
        if not isinstance(analysis.get("strengths", []), list):
            return False
        if not isinstance(analysis.get("areas_for_improvement", []), list):
            return False
        return True

    def generate_follow_up_question(
        self,
        last_question: str,
        last_answer: str,
        category: str,
        context: Dict[str, Any],
        follow_up_count: int = 1,
    ) -> str:
        """
        Generate intelligent follow-up question.
        
        Args:
            last_question: Previous question
            last_answer: Candidate's answer
            category: Question category
            context: Interview context
            follow_up_count: Which follow-up this is
            
        Returns:
            Contextual follow-up question
        """
        prompt = f"""You are a senior recruiter and Principal Software Engineer acting as an elite technical interviewer. You must generate an adaptive, highly customized follow-up question based directly on the candidate's exact response.

CONTEXT:
- Round Category: {category}
- Original Question Asked: {last_question}
- Candidate's Exact Response:
\"\"\"
{last_answer}
\"\"\"

INTERVIEW MEMORY STATE:
- Candidate Strengths so far: {', '.join(context.get('identified_strengths', []))}
- Areas for Improvement: {', '.join(context.get('identified_weaknesses', []))}
- Focus Areas: {', '.join(context.get('candidate_focus_areas', []))}
- Follow-up Count: {follow_up_count}

Generate a SINGLE follow-up question. Follow these strict directives:
1. Do NOT repeat or rephrase the original question.
2. Directly reference specific concepts, claims, technologies, or algorithms that the candidate mentioned in their response. Challenge them to explain the underlying mechanics, an edge-case, or alternative trade-offs.
3. If they discussed a technical algorithm (like BFS, stacks, dynamic programming), probe deep into edge cases (e.g. integer overflow, cycle presence, recursion limits) or complexity (e.g. space complexity optimization).
4. The question must feel highly natural, dialogic, and adaptive—as if you are in a live whiteboard/technical discussion. Avoid formal robotic opening phrases (like "That is a great explanation. Now can you..."). Start directly with the probe.
5. Keep it concise, sharp, and focused on high-quality recruitment depth.

Return ONLY the question text, with no introductory text, surrounding markdown, or extra explanations."""

        try:
            response_text = self._call_model(prompt)
            follow_up = (response_text or "").strip()
            follow_up = follow_up.strip('"\'')
            return follow_up
        except Exception as e:
            return self._generate_fallback_follow_up(category)

    def generate_recruiter_recommendation(
        self,
        session_data: Dict[str, Any],
        metrics: Dict[str, float],
        proctoring_integrity: float,
    ) -> Dict[str, Any]:
        """
        Generate professional recruiter recommendation.
        
        Args:
            session_data: Complete session data
            metrics: Interview metrics
            proctoring_integrity: Proctoring integrity score
            
        Returns:
            Recruiter recommendation with action items
        """
        prompt = f"""You are an expert hiring manager reviewing a candidate interview.

CANDIDATE METRICS:
- Overall Score: {metrics.get('overall_score', 0):.1f}
- Communication: {metrics.get('communication_score', 0):.1f}
- Technical: {metrics.get('technical_score', 0):.1f}
- Confidence: {metrics.get('confidence_score', 0):.1f}
- Problem Solving: {metrics.get('problem_solving_score', 0):.1f}
- Behavioral: {metrics.get('behavioral_score', 0):.1f}
- Proctoring Integrity: {proctoring_integrity:.1f}

INTERVIEW SUMMARY:
{json.dumps(session_data.get('summary', {}), indent=2)}

Provide professional hiring recommendation in JSON format:
{{
    "recommendation": "<RECOMMENDED|CONDITIONAL|NOT_RECOMMENDED|REQUIRES_REVIEW>",
    "recommended_for_round": "<technical|hr|both|none>",
    "confidence_level": "<high|medium|low>",
    "key_strengths": ["<strength1>", "<strength2>", "<strength3>"],
    "key_concerns": ["<concern1>", "<concern2>"],
    "recommendation_text": "<2-3 sentence professional summary>",
    "next_steps": ["<action1>", "<action2>"],
    "interview_quality": "<professional observation>"
}}

Be fair, specific, and hiring-focused."""

        try:
            response_text = self._call_model(prompt)
            json_str = self._extract_json_block(response_text)
            if json_str:
                recommendation = json.loads(json_str)
                try:
                    model = RecommendationModel.parse_obj(recommendation)
                    return model.dict()
                except ValidationError:
                    pass
        except Exception:
            pass
        
        return self._fallback_recommendation(metrics)

    def _fallback_analysis(self, question: str, answer: str, category: str) -> Dict[str, Any]:
        """Fallback rule-based analysis."""
        answer_words = len(answer.split())
        
        # Base scores
        technical_score = 50
        communication_score = 60
        confidence_score = 55
        
        # Adjust based on answer length
        if answer_words > 50:
            communication_score += 20
            confidence_score += 10
        elif answer_words < 15:
            communication_score -= 15
            confidence_score -= 10
        
        # Category-specific adjustments
        if "technical" in category.lower():
            technical_score = 70 if answer_words > 30 else 45
        
        return {
            "technical_score": min(100, max(0, technical_score)),
            "communication_score": min(100, max(0, communication_score)),
            "confidence_score": min(100, max(0, confidence_score)),
            "clarity_score": 60,
            "relevance_score": 65,
            "depth_score": 55,
            "vocabulary_score": 60,
            "hesitation_indicators": 70,
            "overall_impression": "Answer provided",
            "strengths": ["Provided a response"],
            "areas_for_improvement": ["Could add more detail"],
            "feedback": ["Consider providing more specific examples"],
            "is_well_structured": answer_words > 20,
            "demonstrates_problem_solving": "solved" in answer.lower() or "approach" in answer.lower(),
            "shows_leadership": "led" in answer.lower() or "team" in answer.lower(),
            "has_specific_examples": answer_words > 25,
            "difficulty_adjustment": "maintain",
            "hiring_potential": "moderate",
        }

    def _fallback_analysis_from_text(self, text: str) -> Dict[str, Any]:
        """Fallback analysis from text."""
        return self._fallback_analysis("", text, "general")

    def _generate_fallback_follow_up(self, category: str) -> str:
        """Generate fallback follow-up question."""
        follow_ups = {
            "hr": "Can you provide a specific example of how you handled that situation?",
            "technical": "How did you approach solving this problem technically?",
            "default": "Could you elaborate more on that point?",
        }
        return follow_ups.get(category, follow_ups["default"])

    def _fallback_recommendation(self, metrics: Dict[str, float]) -> Dict[str, Any]:
        """Generate fallback recommendation."""
        overall = metrics.get("overall_score", 0)
        
        if overall >= 75:
            recommendation = "RECOMMENDED"
            next_steps = ["Schedule technical round", "Prepare offer"]
        elif overall >= 60:
            recommendation = "CONDITIONAL"
            next_steps = ["Schedule follow-up interview", "Address concerns"]
        else:
            recommendation = "NOT_RECOMMENDED"
            next_steps = ["Provide feedback", "Consider for future"]
        
        return {
            "recommendation": recommendation,
            "recommended_for_round": "technical" if overall >= 70 else "none",
            "confidence_level": "high" if overall >= 75 else "medium",
            "key_strengths": ["Communication", "Problem solving"],
            "key_concerns": ["Technical depth"] if metrics.get("technical_score", 0) < 60 else [],
            "recommendation_text": f"Candidate shows {overall:.0f}% overall performance.",
            "next_steps": next_steps,
            "interview_quality": "Completed assessment",
        }
