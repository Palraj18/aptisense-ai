"""Interview memory and conversation management."""
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path


class InterviewMemory:
    """Manages conversation context and memory for adaptive interviews."""

    def __init__(self, session_id: str, storage_path: Optional[str] = None):
        """
        Initialize interview memory.
        
        Args:
            session_id: Unique session identifier
            storage_path: Optional path for persistent storage
        """
        self.session_id = session_id
        self.storage_path = Path(storage_path) if storage_path else None
        
        self.conversation_history: List[Dict[str, Any]] = []
        self.context_tags: List[str] = []
        self.answer_summaries: List[Dict[str, Any]] = []
        self.difficulty_progression: List[str] = []
        self.identified_strengths: List[str] = []
        self.identified_weaknesses: List[str] = []
        self.behavioral_patterns: Dict[str, Any] = {}
        self.communication_patterns: Dict[str, Any] = {}
        
    def add_exchange(
        self,
        question: str,
        answer: str,
        question_id: str,
        category: str,
        difficulty: str,
        analysis: Dict[str, Any]
    ) -> None:
        """Add a Q&A exchange to memory."""
        exchange = {
            "timestamp": datetime.utcnow().isoformat(),
            "question_id": question_id,
            "question": question,
            "answer": answer,
            "category": category,
            "difficulty": difficulty,
            "analysis": analysis,
        }
        self.conversation_history.append(exchange)
        self.difficulty_progression.append(difficulty)
        
        # Extract answer summary
        summary = {
            "question_id": question_id,
            "question": question,
            "answer_length": len(answer.split()),
            "key_scores": {
                "technical": analysis.get("technical_score", 0),
                "communication": analysis.get("communication_score", 0),
                "confidence": analysis.get("confidence_score", 0),
            }
        }
        self.answer_summaries.append(summary)
        
    def add_strength(self, strength: str) -> None:
        """Record identified strength."""
        if strength not in self.identified_strengths:
            self.identified_strengths.append(strength)
            
    def add_weakness(self, weakness: str) -> None:
        """Record identified weakness."""
        if weakness not in self.identified_weaknesses:
            self.identified_weaknesses.append(weakness)
            
    def get_context_for_follow_up(self) -> Dict[str, Any]:
        """Get relevant context for generating follow-up questions."""
        if not self.conversation_history:
            return {}
            
        recent_exchanges = self.conversation_history[-3:]
        
        context = {
            "recent_answers": [e["answer"] for e in recent_exchanges],
            "recent_categories": [e["category"] for e in recent_exchanges],
            "recent_difficulties": [e["difficulty"] for e in recent_exchanges],
            "identified_strengths": self.identified_strengths,
            "identified_weaknesses": self.identified_weaknesses,
            "conversation_theme": self._extract_conversation_theme(),
            "candidate_focus_areas": self._extract_focus_areas(),
        }
        return context
        
    def _extract_conversation_theme(self) -> str:
        """Extract overall theme from conversation."""
        if not self.conversation_history:
            return "general"
            
        categories = [e["category"] for e in self.conversation_history]
        most_common = max(set(categories), key=categories.count) if categories else "general"
        return most_common
        
    def _extract_focus_areas(self) -> List[str]:
        """Extract candidate's focus areas from answers."""
        focus_areas = []
        
        for exchange in self.conversation_history:
            answer = exchange["answer"].lower()
            
            # Simple keyword extraction
            if any(word in answer for word in ["project", "led", "managed", "developed"]):
                if "leadership" not in focus_areas:
                    focus_areas.append("leadership")
            if any(word in answer for word in ["algorithm", "data structure", "optimization", "performance"]):
                if "technical_depth" not in focus_areas:
                    focus_areas.append("technical_depth")
            if any(word in answer for word in ["team", "collaborated", "communication", "feedback"]):
                if "teamwork" not in focus_areas:
                    focus_areas.append("teamwork")
                    
        return focus_areas
        
    def save_to_file(self) -> None:
        """Persist memory to file."""
        if not self.storage_path:
            return
            
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        
        memory_data = {
            "session_id": self.session_id,
            "conversation_history": self.conversation_history,
            "answer_summaries": self.answer_summaries,
            "difficulty_progression": self.difficulty_progression,
            "identified_strengths": self.identified_strengths,
            "identified_weaknesses": self.identified_weaknesses,
            "behavioral_patterns": self.behavioral_patterns,
            "communication_patterns": self.communication_patterns,
        }
        
        with open(self.storage_path, "w") as f:
            json.dump(memory_data, f, indent=2)
            
    def load_from_file(self) -> bool:
        """Load memory from file."""
        if not self.storage_path or not self.storage_path.exists():
            return False
            
        try:
            with open(self.storage_path, "r") as f:
                memory_data = json.load(f)
                
            self.conversation_history = memory_data.get("conversation_history", [])
            self.answer_summaries = memory_data.get("answer_summaries", [])
            self.difficulty_progression = memory_data.get("difficulty_progression", [])
            self.identified_strengths = memory_data.get("identified_strengths", [])
            self.identified_weaknesses = memory_data.get("identified_weaknesses", [])
            self.behavioral_patterns = memory_data.get("behavioral_patterns", {})
            self.communication_patterns = memory_data.get("communication_patterns", {})
            return True
        except Exception:
            return False
            
    def get_summary(self) -> Dict[str, Any]:
        """Get summary of interview memory."""
        return {
            "total_exchanges": len(self.conversation_history),
            "strengths": self.identified_strengths,
            "weaknesses": self.identified_weaknesses,
            "conversation_theme": self._extract_conversation_theme(),
            "average_answer_length": sum(
                s.get("answer_length", 0) for s in self.answer_summaries
            ) / len(self.answer_summaries) if self.answer_summaries else 0,
        }
