from __future__ import annotations

from typing import Dict, Any


def clamp(v: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, v))


def build_behavior_features(raw: Dict[str, Any]) -> Dict[str, float]:
    typing_speed_wpm = float(raw.get("typing_speed_wpm", 0.0))
    avg_pause_ms = float(raw.get("avg_pause_ms", 0.0))
    backspace_rate = float(raw.get("backspace_rate", 0.0))
    rewrite_frequency = float(raw.get("rewrite_frequency", 0.0))
    focus_loss_events = float(raw.get("focus_loss_events", 0.0))
    tab_switch_count = float(raw.get("tab_switch_count", 0.0))
    question_time_sec = float(raw.get("question_time_sec", 0.0))

    hesitation_index = clamp(
        (avg_pause_ms / 1500) * 0.55
        + backspace_rate * 2.4 * 0.25
        + rewrite_frequency * 0.9 * 0.20
    )
    focus_score = clamp(1 - (focus_loss_events / 7) * 0.7 - (tab_switch_count / 10) * 0.3)
    struggle_score = clamp(
        rewrite_frequency * 0.35 + backspace_rate * 2.2 * 0.35 + (1 - focus_score) * 0.30
    )
    confidence_score = clamp(
        (typing_speed_wpm / 60) * 0.3
        + focus_score * 0.45
        + (1 - hesitation_index) * 0.25
        - struggle_score * 0.2
    )

    return {
        "typing_speed_wpm": typing_speed_wpm,
        "avg_pause_ms": avg_pause_ms,
        "backspace_rate": backspace_rate,
        "rewrite_frequency": rewrite_frequency,
        "focus_loss_events": focus_loss_events,
        "tab_switch_count": tab_switch_count,
        "question_time_sec": question_time_sec,
        "hesitation_index": round(hesitation_index, 4),
        "confidence_score": round(confidence_score, 4),
        "struggle_score": round(struggle_score, 4),
        "focus_score": round(focus_score, 4),
    }
