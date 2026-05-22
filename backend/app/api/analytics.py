"""Analytics endpoints to summarize stored sessions."""
from fastapi import APIRouter, HTTPException
from app.core.config import settings
import os
import json
from statistics import mean

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/summary")
async def get_summary():
    """Return an aggregated summary of actual user interview sessions and aptitude test attempts."""
    # 1. Fetch sessions
    sessions_dir = os.path.join(settings.DATA_DIR, "sessions")
    files = []
    if os.path.isdir(sessions_dir):
        files = [f for f in os.listdir(sessions_dir) if f.endswith('.json')]

    # 2. Fetch aptitude attempts
    attempts_dir = os.path.join(settings.DATA_DIR, "aptitude_attempts")
    attempt_files = []
    if os.path.isdir(attempts_dir):
        attempt_files = [f for f in os.listdir(attempts_dir) if f.endswith('.json')]

    interviews_conducted = len(files)
    aptitude_attempts = len(attempt_files)
    
    # Initialize aggregators
    by_type = {}
    roles = set()
    
    # AI Interview metrics
    technical_scores = []
    communication_scores = []
    confidence_scores = []
    clarity_scores = []
    vocabulary_scores = []
    hesitation_scores = []
    integrities = []
    suspicious_events = 0
    
    strengths_pool = []
    improvements_pool = []
    
    for fname in files:
        path = os.path.join(sessions_dir, fname)
        try:
            with open(path, 'r') as f:
                data = json.load(f)
        except Exception:
            continue
            
        itype = data.get('interview_type', 'unknown')
        by_type[itype] = by_type.get(itype, 0) + 1
        
        if 'position' in data and data['position']:
            roles.add(data['position'])
            
        proctor = data.get('proctoring') or {}
        if 'integrity_score' in proctor and proctor['integrity_score'] is not None:
            try:
                integrities.append(float(proctor['integrity_score']))
            except Exception:
                pass
        if 'suspicious_events_count' in proctor:
            suspicious_events += proctor.get('suspicious_events_count', 0)
        elif 'suspicious_events' in proctor:
            val = proctor['suspicious_events']
            if isinstance(val, int):
                suspicious_events += val
            elif isinstance(val, list):
                suspicious_events += len(val)
                
        # Parse answer history for detailed AI evaluation
        for ans in data.get('answer_history', []):
            ai = ans.get('ai_analysis') or ans.get('evaluation') or {}
            
            # Extract scores
            t = ai.get('technical_score') or (ai.get('ai_scores') or {}).get('technical')
            c = ai.get('communication_score') or (ai.get('ai_scores') or {}).get('communication')
            conf = ai.get('confidence_score') or (ai.get('ai_scores') or {}).get('confidence')
            clar = ai.get('clarity_score') or (ai.get('ai_scores') or {}).get('clarity')
            voc = ai.get('vocabulary_score') or (ai.get('ai_scores') or {}).get('vocabulary')
            
            # hesitation indicator
            hes = ai.get('hesitation_indicators')
            if hes is None:
                hes = (ai.get('typing_analysis') or {}).get('hesitation_score')
            
            try:
                if t is not None: technical_scores.append(float(t))
                if c is not None: communication_scores.append(float(c))
                if conf is not None: confidence_scores.append(float(conf))
                if clar is not None: clarity_scores.append(float(clar))
                if voc is not None: vocabulary_scores.append(float(voc))
                if hes is not None: hesitation_scores.append(float(hes))
            except Exception:
                pass
                
            # Collect strengths/improvements
            strengths_pool.extend(ai.get('strengths', []))
            improvements_pool.extend(ai.get('areas_for_improvement', []))

    # Aptitude metrics
    aptitude_scores = []
    aptitude_attentions = []
    aptitude_suspicious = 0
    aptitude_tab_switches = 0
    aptitude_by_category = {}
    
    for fname in attempt_files:
        path = os.path.join(attempts_dir, fname)
        try:
            with open(path, 'r') as f:
                data = json.load(f)
        except Exception:
            continue
            
        cat = data.get('category', 'unknown')
        aptitude_by_category[cat] = aptitude_by_category.get(cat, 0) + 1
        
        score_pct = data.get('percentage')
        if score_pct is not None:
            aptitude_scores.append(score_pct)
            
        att = data.get('attention_score')
        if att is not None:
            aptitude_attentions.append(att)
            
        aptitude_suspicious += data.get('suspicious_count', 0)
        aptitude_tab_switches += data.get('tab_switches', 0)

    # Compute Averages
    avg_integrity = mean(integrities) if integrities else None
    avg_technical = mean(technical_scores) if technical_scores else None
    avg_communication = mean(communication_scores) if communication_scores else None
    avg_confidence = mean(confidence_scores) if confidence_scores else None
    avg_clarity = mean(clarity_scores) if clarity_scores else None
    avg_vocabulary = mean(vocabulary_scores) if vocabulary_scores else None
    avg_hesitation = mean(hesitation_scores) if hesitation_scores else None
    
    # Calculate overall interview score
    overall_scores = []
    if avg_technical is not None: overall_scores.append(avg_technical)
    if avg_communication is not None: overall_scores.append(avg_communication)
    if avg_confidence is not None: overall_scores.append(avg_confidence)
    avg_overall_interview_score = mean(overall_scores) if overall_scores else None
    
    # Aptitude averages
    avg_aptitude_score = mean(aptitude_scores) if aptitude_scores else None
    avg_aptitude_attention = mean(aptitude_attentions) if aptitude_attentions else None
    
    # Deduplicate strengths/improvements and limit to top ones
    unique_strengths = []
    for s in strengths_pool:
        if s not in unique_strengths:
            unique_strengths.append(s)
    unique_improvements = []
    for s in improvements_pool:
        if s not in unique_improvements:
            unique_improvements.append(s)
            
    # Recommendations & Recruitment summary
    recruiter_status = "NO_DATA"
    recommendation_text = "No interview sessions have been conducted yet. Complete an AI interview to receive placement recommendations."
    
    if avg_overall_interview_score is not None:
        if avg_overall_interview_score >= 80:
            recruiter_status = "RECOMMENDED"
            recommendation_text = "Highly recommended for fast-track placement. Displays strong technical and outstanding verbal articulation."
        elif avg_overall_interview_score >= 60:
            recruiter_status = "CONDITIONAL"
            recommendation_text = "Recommended for next rounds. Shows solid fundamental knowledge with minor improvements needed in advanced problem-solving."
        else:
            recruiter_status = "REQUIRES_REVIEW"
            recommendation_text = "Requires further training. Fundamental coding skills and technical depth need reinforcement before client-facing interviews."

    return {
        "interviews_conducted": interviews_conducted,
        "aptitude_attempts": aptitude_attempts,
        "by_type": by_type,
        "active_roles": sorted(list(roles)),
        
        # Interview performance metrics
        "interview_performance": {
            "overall_score": avg_overall_interview_score,
            "technical_score": avg_technical,
            "communication_score": avg_communication,
            "confidence_score": avg_confidence,
            "clarity_score": avg_clarity,
            "vocabulary_score": avg_vocabulary,
            "hesitation_score": avg_hesitation,
        },
        
        # Aptitude performance metrics
        "aptitude_performance": {
            "total_attempts": aptitude_attempts,
            "by_category": aptitude_by_category,
            "average_score": avg_aptitude_score,
            "average_attention": avg_aptitude_attention,
            "total_tab_switches": aptitude_tab_switches,
            "total_suspicious": aptitude_suspicious
        },
        
        # Proctoring/Integrity metrics
        "proctoring_integrity": {
            "average_integrity": avg_integrity,
            "total_suspicious_events": suspicious_events,
        },
        
        # Feedback and details
        "top_strengths": unique_strengths[:5],
        "improvement_areas": unique_improvements[:5],
        "recruiter_recommendation": {
            "status": recruiter_status,
            "recommendation": recommendation_text
        }
    }


@router.get("/sessions")
async def get_sessions():
    """Return a list of completed interview and mock interview sessions."""
    sessions_dir = os.path.join(settings.DATA_DIR, "sessions")
    sessions = []
    if os.path.isdir(sessions_dir):
        for fname in os.listdir(sessions_dir):
            if not fname.endswith('.json'):
                continue
            path = os.path.join(sessions_dir, fname)
            try:
                with open(path, 'r') as f:
                    data = json.load(f)
                    metrics = data.get("metrics") or {}
                    overall_score = metrics.get("overall_score")
                    if overall_score is None:
                        overall_score = data.get("proctoring", {}).get("integrity_score")
                    
                    sessions.append({
                        "session_id": data.get("session_id"),
                        "interview_type": data.get("interview_type", "mock"),
                        "position": data.get("position", "Interview Session"),
                        "start_time": data.get("start_time"),
                        "overall_score": overall_score,
                        "type": "interview"
                    })
            except Exception:
                continue

    # Also fetch aptitude attempts if any exist
    attempts_dir = os.path.join(settings.DATA_DIR, "aptitude_attempts")
    if os.path.isdir(attempts_dir):
        for fname in os.listdir(attempts_dir):
            if not fname.endswith('.json'):
                continue
            path = os.path.join(attempts_dir, fname)
            try:
                with open(path, 'r') as f:
                    data = json.load(f)
                    sessions.append({
                        "session_id": data.get("attempt_id") or fname.replace('.json', ''),
                        "interview_type": data.get("category", "aptitude"),
                        "position": f"Aptitude: {data.get('category', 'Test').replace('_', ' ').capitalize()}",
                        "start_time": data.get("timestamp"),
                        "overall_score": data.get("percentage"),
                        "type": "aptitude"
                    })
            except Exception:
                continue

    # Sort sessions by start_time descending
    sessions.sort(key=lambda s: s.get("start_time") or "", reverse=True)
    return sessions

