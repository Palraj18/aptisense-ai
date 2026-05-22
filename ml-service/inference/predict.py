from __future__ import annotations

from pathlib import Path
from typing import Dict, Any
import sys
import numpy as np
import joblib
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from feature_pipeline.build_features import build_behavior_features
from feature_pipeline.vision_audio_features import build_sensor_features

MODELS = {
    "classifier": ROOT / "models" / "cognitive_classifier.pkl",
    "fake_understanding": ROOT / "models" / "fake_understanding.pkl",
    "efficiency": ROOT / "models" / "efficiency_predictor.pkl",
    "burnout": ROOT / "models" / "burnout_detector.pkl",
}

BASE_ORDER = [
    "typing_speed_wpm",
    "avg_pause_ms",
    "backspace_rate",
    "rewrite_frequency",
    "focus_loss_events",
    "tab_switch_count",
    "question_time_sec",
    "hesitation_index",
    "confidence_score",
    "struggle_score",
    "focus_score",
]


def _load_model(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Model missing: {path}. Train models first.")
    return joblib.load(path)


def predict_all(raw_behavior: Dict[str, Any], quiz_score: float) -> Dict[str, Any]:
    base_feats = build_behavior_features(raw_behavior)
    sensor_feats = build_sensor_features(raw_behavior)
    feats = {**base_feats, **sensor_feats}
    classifier_model = _load_model(MODELS["classifier"])
    fake_model = _load_model(MODELS["fake_understanding"])
    efficiency_model = _load_model(MODELS["efficiency"])
    burnout_model = _load_model(MODELS["burnout"])

    X_base = _frame_for_model(feats, classifier_model, include_quiz=False, quiz_score=quiz_score)
    X_plus_quiz = _frame_for_model(feats, fake_model, include_quiz=True, quiz_score=quiz_score)
    X_eff = _frame_for_model(feats, efficiency_model, include_quiz=True, quiz_score=quiz_score)
    X_burn = _frame_for_model(feats, burnout_model, include_quiz=True, quiz_score=quiz_score)

    # Supports both direct estimators and wrapped {"pipeline": ...} artifacts.
    cognitive_state = _predict_with_optional_wrapper(classifier_model, X_base)[0]
    fake_understanding = int(_predict_with_optional_wrapper(fake_model, X_plus_quiz)[0])
    time_to_master_min = float(_predict_with_optional_wrapper(efficiency_model, X_eff)[0])
    burnout_risk = int(_predict_with_optional_wrapper(burnout_model, X_burn)[0])

    if isinstance(cognitive_state, (int, float, np.integer)) and isinstance(classifier_model, dict):
        le = classifier_model.get("label_encoder")
        if le is not None:
            cognitive_state = le.inverse_transform([int(cognitive_state)])[0]

    time_to_master_min = float(np.clip(time_to_master_min, 5.0, 180.0))
    adjusted_state = _adjust_cognitive_state(cognitive_state, feats)

    return {
        "features": feats,
        "cognitive_state": adjusted_state,
        "fake_understanding": fake_understanding,
        "time_to_master_min": round(time_to_master_min, 2),
        "burnout_risk": burnout_risk,
        "adaptive_action": _adaptive_action(adjusted_state, burnout_risk),
    }


def _predict_with_optional_wrapper(model_obj, X):
    if isinstance(model_obj, dict):
        return model_obj["pipeline"].predict(X)
    return model_obj.predict(X)


def _frame_for_model(feats: Dict[str, Any], model_obj, include_quiz: bool, quiz_score: float) -> pd.DataFrame:
    # Canonicalize aliases between old/new pipelines.
    canonical = {
        **feats,
        "typing_speed": feats.get("typing_speed_wpm", 0.0),
        "average_response_time_ms": feats.get("avg_pause_ms", 0.0),
        "backspace_frequency": feats.get("backspace_rate", 0.0),
        "interaction_frequency": max(1.0, 60.0 - (feats.get("avg_pause_ms", 0.0) / 100.0)),
        "attempt_count": max(1.0, round(feats.get("rewrite_frequency", 0.0) * 8.0 + 1.0)),
        "accuracy_rate": float(quiz_score) / 100.0,
    }
    if isinstance(model_obj, dict) and "features" in model_obj:
        cols = list(model_obj["features"])
    else:
        cols = BASE_ORDER + (["quiz_score"] if include_quiz else [])
    values = []
    for col in cols:
        if col == "quiz_score":
            values.append(float(quiz_score))
        else:
            values.append(float(canonical.get(col, 0.0)))
    return pd.DataFrame([values], columns=cols)


def _adaptive_action(state: str, burnout_risk: int) -> str:
    if burnout_risk == 1 or state == "Fatigued":
        return "Suggest break, shorten session, and offer low-load recap."
    if state == "Confused":
        return "Provide simpler explanation and progressive hints."
    if state == "Clear":
        return "Increase difficulty and introduce challenge problems."
    if state == "Overconfident":
        return "Ask verification quiz and expose misconception checkpoints."
    return "Offer guided practice with immediate feedback."


if __name__ == "__main__":
    sample = {
        "typing_speed_wpm": 31.0,
        "avg_pause_ms": 1120.0,
        "backspace_rate": 0.16,
        "rewrite_frequency": 0.38,
        "focus_loss_events": 2,
        "tab_switch_count": 3,
        "question_time_sec": 92.0,
    }
    print(predict_all(sample, quiz_score=58))
