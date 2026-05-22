"""Smoke test for AI parsing and pydantic validation (no live Gemini call).

Run: python backend/scripts/test_ai_parsing.py
"""
import json
import os
import importlib.util


def load_module_from_path(name: str, path: str):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


BASE = os.path.dirname(__file__)
BACKEND = os.path.join(BASE, '..')
schema_path = os.path.normpath(os.path.join(BACKEND, 'app', 'schemas', 'analysis.py'))
mod_schema = load_module_from_path('analysis_schema', schema_path)
AnalysisModel = mod_schema.AnalysisModel
RecommendationModel = mod_schema.RecommendationModel


def extract_json_block(text: str):
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

sample_text = '''
Analysis results follow.
{
  "technical_score": 82,
  "communication_score": 78,
  "confidence_score": 70,
  "clarity_score": 75,
  "relevance_score": 80,
  "depth_score": 72,
  "vocabulary_score": 68,
  "hesitation_indicators": 20,
  "overall_impression": "Solid technical understanding with room for examples.",
  "strengths": ["Problem solving", "Clear structure"],
  "areas_for_improvement": ["More specific examples", "Edge-case handling"],
  "feedback": ["Provide a concrete example next time", "Explain trade-offs"],
  "is_well_structured": true,
  "demonstrates_problem_solving": true,
  "shows_leadership": false,
  "has_specific_examples": false,
  "difficulty_adjustment": "maintain",
  "hiring_potential": "good"
}
End of response.'''

print("Testing JSON extraction...")
json_block = extract_json_block(sample_text)
print("Extracted JSON block:\n", json_block)

print("Attempting to parse JSON to dict...")
if json_block:
    parsed = json.loads(json_block)
    print("Parsed keys:", list(parsed.keys()))

    print("Validating with AnalysisModel...")
    try:
        # Use model_validate/model_dump_json for pydantic v2 compatibility
        model = AnalysisModel.model_validate(parsed)
        print("Pydantic validation succeeded. Summary:")
        print(model.model_dump_json(indent=2))
    except Exception as e:
        print("Pydantic validation failed:", e)

    print("Running lightweight validation guard:")
    def validate_analysis(analysis: dict) -> bool:
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
                float(analysis.get(key, 0))
            except Exception:
                return False
        if not isinstance(analysis.get("strengths", []), list):
            return False
        if not isinstance(analysis.get("areas_for_improvement", []), list):
            return False
        return True

    try:
        ok = validate_analysis(parsed)
        print("validate_analysis returned:", ok)
    except Exception as e:
        print("validate_analysis raised:", e)
else:
    print("No JSON block found.")

# Recommendation test
rec_sample = {
    "recommendation": "RECOMMENDED",
    "recommended_for_round": "technical",
    "confidence_level": "high",
    "key_strengths": ["Problem solving", "Ownership"],
    "key_concerns": [],
    "recommendation_text": "Strong technical candidate; move to next round.",
    "next_steps": ["Schedule technical interview"],
    "interview_quality": "Good"
}
print('\nTesting RecommendationModel parsing...')
try:
    rec_model = RecommendationModel.model_validate(rec_sample)
    print('RecommendationModel OK:', rec_model.model_dump_json(indent=2))
except Exception as e:
    print('RecommendationModel validation failed:', e)
