"""Question bank and adaptive question selection."""
import json
from typing import Dict, List, Any, Optional
from pathlib import Path
from app.core.config import settings


class QuestionBankService:
    """Manages question bank and adaptive selection."""

    def __init__(self):
        """Initialize question bank."""
        self.questions_file = Path(settings.DATA_DIR) / "questions.json"
        self.questions = self._load_questions()
        self.selected_questions: Dict[str, List[str]] = {}  # session_id -> list of question_ids

    def _load_questions(self) -> Dict[str, List[Dict[str, Any]]]:
        """Load questions from file."""
        try:
            if self.questions_file.exists():
                with open(self.questions_file, "r") as f:
                    questions = json.load(f)
                    return self._normalize_question_bank(questions)
        except Exception as e:
            print(f"Error loading questions: {e}")
        
        # Return default questions
        return self._get_default_questions()

    def _normalize_question(self, question: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize a question entry to support legacy and new field names."""
        normalized_text = question.get("text") or question.get("question") or ""

        return {
            "id": str(question.get("id", "")),
            "text": normalized_text,
            "question": normalized_text,
            "difficulty": question.get("difficulty", "medium"),
            "category": question.get("category", "general"),
        }

    def _normalize_question_bank(self, questions: Dict[str, List[Dict[str, Any]]]) -> Dict[str, List[Dict[str, Any]]]:
        """Normalize all questions in the bank."""
        return {
            interview_type: [self._normalize_question(question) for question in question_list]
            for interview_type, question_list in questions.items()
        }

    def _get_default_questions(self) -> Dict[str, List[Dict[str, Any]]]:
        """Return default question bank."""
        return {
            "hr": [
                {"id": "hr_001", "text": "Tell me about yourself.", "difficulty": "easy", "category": "personal"},
                {"id": "hr_002", "text": "Why are you interested in this position?", "difficulty": "easy", "category": "motivation"},
                {"id": "hr_003", "text": "Describe a challenge you overcame at work.", "difficulty": "medium", "category": "behavioral"},
                {"id": "hr_004", "text": "How do you handle conflict with team members?", "difficulty": "medium", "category": "behavioral"},
                {"id": "hr_005", "text": "What are your long-term career goals?", "difficulty": "medium", "category": "personal"},
                {"id": "hr_006", "text": "Tell me about a time you led a team project.", "difficulty": "hard", "category": "leadership"},
                {"id": "hr_007", "text": "How do you approach continuous learning?", "difficulty": "hard", "category": "personal"},
                {"id": "hr_008", "text": "Describe a situation where you had to adapt to change.", "difficulty": "hard", "category": "behavioral"},
            ],
            "technical": [
                {"id": "tech_001", "text": "Explain object-oriented programming concepts.", "difficulty": "easy", "category": "fundamentals"},
                {"id": "tech_002", "text": "What is the difference between arrays and linked lists?", "difficulty": "easy", "category": "data_structures"},
                {"id": "tech_003", "text": "Describe the MVC architecture pattern.", "difficulty": "medium", "category": "architecture"},
                {"id": "tech_004", "text": "Explain time and space complexity with examples.", "difficulty": "medium", "category": "algorithms"},
                {"id": "tech_005", "text": "What are REST API best practices?", "difficulty": "medium", "category": "backend"},
                {"id": "tech_006", "text": "Design a scalable database schema for an e-commerce platform.", "difficulty": "hard", "category": "database"},
                {"id": "tech_007", "text": "Explain microservices architecture and its trade-offs.", "difficulty": "hard", "category": "architecture"},
                {"id": "tech_008", "text": "How would you optimize a slow database query?", "difficulty": "hard", "category": "performance"},
            ],
            "behavioral": [
                {"id": "beh_001", "text": "Tell me about a conflict you resolved within a team.", "difficulty": "easy", "category": "teamwork"},
                {"id": "beh_002", "text": "Describe a time you handled pressure and tight deadlines.", "difficulty": "medium", "category": "pressure"},
                {"id": "beh_003", "text": "Share an example of feedback you received and how you applied it.", "difficulty": "medium", "category": "growth"},
                {"id": "beh_004", "text": "Tell me about a mistake you made and how you recovered from it.", "difficulty": "hard", "category": "accountability"},
            ],
            "communication": [
                {"id": "com_001", "text": "Explain a complex idea to a non-technical stakeholder.", "difficulty": "easy", "category": "clarity"},
                {"id": "com_002", "text": "How do you structure your answers when speaking in interviews?", "difficulty": "medium", "category": "presentation"},
                {"id": "com_003", "text": "Describe a time when communication breakdown affected a project and how you fixed it.", "difficulty": "medium", "category": "collaboration"},
                {"id": "com_004", "text": "How do you keep your message concise without losing important detail?", "difficulty": "hard", "category": "communication_skills"},
            ],
            "mixed": [
                {"id": "mix_001", "text": "Tell me about your strongest technical skill.", "difficulty": "medium", "category": "technical_personal"},
                {"id": "mix_002", "text": "How do you approach learning new technologies?", "difficulty": "medium", "category": "growth"},
                {"id": "mix_003", "text": "Describe a project where you used advanced technical skills.", "difficulty": "hard", "category": "technical_behavioral"},
                {"id": "mix_004", "text": "How do you communicate technical concepts to non-technical stakeholders?", "difficulty": "hard", "category": "communication"},
            ]
        }

    def get_next_question(
        self,
        interview_type: str,
        session_id: str,
        difficulty_level: str = "medium",
        exclude_ids: Optional[List[str]] = None,
        category_preference: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Get next question with adaptive difficulty.
        
        Args:
            interview_type: Type of interview (hr, technical, mixed)
            session_id: Interview session ID
            difficulty_level: Current difficulty (easy, medium, hard)
            exclude_ids: Question IDs to exclude
            category_preference: Preferred question category
            
        Returns:
            Next question or None if no questions available
        """
        if exclude_ids is None:
            exclude_ids = []
        
        # Get questions of appropriate type
        questions = self.questions.get(interview_type, [])
        if not questions:
            return None
        
        # Filter by difficulty and exclusion
        available = [
            q for q in questions
            if q.get("difficulty") == difficulty_level and q["id"] not in exclude_ids
        ]
        
        # Prefer category if specified
        if category_preference:
            category_questions = [q for q in available if q.get("category") == category_preference]
            if category_questions:
                available = category_questions
        
        # Select question (preferring ones not recently selected)
        if not available:
            # If no questions at difficulty, try adjacent difficulty
            if difficulty_level == "easy":
                available = [q for q in questions if q.get("difficulty") == "medium" and q["id"] not in exclude_ids]
            elif difficulty_level == "hard":
                available = [q for q in questions if q.get("difficulty") == "medium" and q["id"] not in exclude_ids]
            else:  # medium
                available = [q for q in questions if q.get("difficulty") in ["easy", "hard"] and q["id"] not in exclude_ids]
        
        if not available:
            return None
        
        # Return first available
        selected = available[0]
        
        # Track selection
        if session_id not in self.selected_questions:
            self.selected_questions[session_id] = []
        self.selected_questions[session_id].append(selected["id"])
        
        return selected

    def get_adaptive_difficulty(
        self,
        current_difficulty: str,
        performance_score: float,
        threshold: float = settings.ADAPTIVE_DIFFICULTY_THRESHOLD,
    ) -> str:
        """
        Calculate adaptive difficulty based on performance.
        
        Args:
            current_difficulty: Current difficulty level
            performance_score: Performance score (0-100)
            threshold: Threshold for difficulty change (0-1 scale)
            
        Returns:
            New difficulty level
        """
        # Normalize performance to 0-1 scale
        normalized_performance = performance_score / 100
        
        if current_difficulty == "easy":
            if normalized_performance >= threshold:
                return "medium"
            return "easy"
        elif current_difficulty == "hard":
            if normalized_performance < threshold:
                return "medium"
            return "hard"
        else:  # medium
            if normalized_performance >= threshold:
                return "hard"
            elif normalized_performance < (threshold - 0.2):
                return "easy"
            return "medium"

    def get_category_distribution(self, interview_type: str) -> Dict[str, int]:
        """Get distribution of questions by category."""
        questions = self.questions.get(interview_type, [])
        distribution = {}
        
        for q in questions:
            category = q.get("category", "uncategorized")
            distribution[category] = distribution.get(category, 0) + 1
        
        return distribution

    def add_question(
        self,
        interview_type: str,
        text: str,
        difficulty: str,
        category: str,
    ) -> str:
        """Add new question to bank."""
        if interview_type not in self.questions:
            self.questions[interview_type] = []
        
        question_id = f"{interview_type}_{len(self.questions[interview_type]):03d}"
        
        question = {
            "id": question_id,
            "text": text,
            "question": text,
            "difficulty": difficulty,
            "category": category,
        }
        
        self.questions[interview_type].append(question)
        
        # Save to file
        self._save_questions()
        
        return question_id

    def _save_questions(self) -> None:
        """Save questions to file."""
        try:
            self.questions_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.questions_file, "w") as f:
                json.dump(self.questions, f, indent=2)
        except Exception as e:
            print(f"Error saving questions: {e}")


# Global question bank
question_bank = QuestionBankService()
