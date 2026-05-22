from __future__ import annotations

from typing import Dict, Any


def clamp(v: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, v))


def build_sensor_features(raw: Dict[str, Any]) -> Dict[str, float]:
    camera_focus = float(raw.get("camera_focus_score", 0.5))
    camera_distraction = float(raw.get("camera_distraction_score", 0.5))
    camera_confusion = float(raw.get("camera_confusion_score", 0.2))
    camera_look_away = float(raw.get("camera_look_away_ratio", 0.0))
    voice_hesitation = float(raw.get("voice_hesitation_score", 0.15))
    voice_pause = float(raw.get("voice_pause_ratio", 0.35))
    voice_confidence = float(raw.get("voice_confidence_score", 0.5))
    filler_rate = float(raw.get("voice_filler_rate", 0.0))

    fatigue_boost = clamp((camera_look_away * 0.6) + (voice_pause * 0.4))
    confidence_boost = clamp(camera_focus * 0.4 + voice_confidence * 0.4 - voice_hesitation * 0.2)

    return {
        "camera_focus_score": round(camera_focus, 4),
        "camera_distraction_score": round(camera_distraction, 4),
        "camera_confusion_score": round(camera_confusion, 4),
        "camera_look_away_ratio": round(camera_look_away, 4),
        "voice_hesitation_score": round(voice_hesitation, 4),
        "voice_pause_ratio": round(voice_pause, 4),
        "voice_confidence_score": round(voice_confidence, 4),
        "voice_filler_rate": round(filler_rate, 4),
        "voice_attention_score": round(confidence_boost * (1 - fatigue_boost), 4),
        "sensor_fatigue_level": round(fatigue_boost, 4),
        "sensor_confidence_level": round(confidence_boost, 4),
    }
