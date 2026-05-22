#!/usr/bin/env python
"""Test AIOrchestrationService initialization with Gemini API key."""
import sys
sys.path.insert(0, '.')

from app.core.config import settings

print(f"GEMINI_API_KEY loaded: {bool(settings.GEMINI_API_KEY)}")
print(f"API Key length: {len(settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else 0}")

try:
    from app.services.ai_orchestration import AIOrchestrationService
    print("✓ AIOrchestrationService imported successfully")
    
    svc = AIOrchestrationService()
    print("✓ AIOrchestrationService initialized successfully!")
    
    # Test a quick analysis
    result = svc.analyze_answer(
        question="What is a stack?",
        answer="A stack is a data structure that follows LIFO principle.",
        category="technical",
        difficulty="easy"
    )
    print(f"✓ Analysis successful. Technical score: {result.get('technical_score', 'N/A')}")
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
