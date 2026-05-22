from pydantic import BaseModel, Field, conint, validator
from typing import List, Optional

Score = conint(ge=0, le=100)


class AnalysisModel(BaseModel):
    technical_score: Score
    communication_score: Score
    confidence_score: Score
    clarity_score: Score
    relevance_score: Score
    depth_score: Optional[Score] = Field(default=0)
    vocabulary_score: Optional[Score] = Field(default=0)
    hesitation_indicators: Optional[Score] = Field(default=0)
    overall_impression: str
    strengths: List[str]
    areas_for_improvement: List[str]
    feedback: List[str]
    is_well_structured: bool
    demonstrates_problem_solving: bool
    shows_leadership: bool
    has_specific_examples: bool
    difficulty_adjustment: str
    hiring_potential: str

    @validator('difficulty_adjustment')
    def check_difficulty_adjustment(cls, v):
        allowed = {'increase', 'maintain', 'decrease'}
        if v not in allowed:
            raise ValueError('difficulty_adjustment must be one of %s' % allowed)
        return v

    @validator('hiring_potential')
    def check_hiring_potential(cls, v):
        allowed = {'excellent', 'good', 'moderate', 'needs_improvement'}
        if v not in allowed:
            raise ValueError('hiring_potential must be one of %s' % allowed)
        return v


class RecommendationModel(BaseModel):
    recommendation: str
    recommended_for_round: str
    confidence_level: str
    key_strengths: List[str]
    key_concerns: List[str]
    recommendation_text: str
    next_steps: List[str]
    interview_quality: Optional[str] = ''

    @validator('recommendation')
    def check_recommendation(cls, v):
        allowed = {'RECOMMENDED', 'CONDITIONAL', 'NOT_RECOMMENDED', 'REQUIRES_REVIEW'}
        if v not in allowed:
            raise ValueError('recommendation must be one of %s' % allowed)
        return v

    @validator('confidence_level')
    def check_confidence(cls, v):
        allowed = {'high', 'medium', 'low'}
        if v not in allowed:
            raise ValueError('confidence_level must be one of %s' % allowed)
        return v
