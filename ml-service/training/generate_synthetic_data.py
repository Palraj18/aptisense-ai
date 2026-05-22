from __future__ import annotations

from pathlib import Path
import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
OUT_FILE = ROOT / "data" / "synthetic" / "behavior_dataset.csv"
RNG = np.random.default_rng(42)

TOPICS = [
    "Data Structures",
    "Operating Systems",
    "Machine Learning Basics",
    "Database Normalization",
    "Computer Networks",
]

COGNITIVE_STATES = ["Clear", "Confused", "Fatigued", "Guessing", "Overconfident"]


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def compute_behavior_features(row: dict) -> dict:
    hesitation_index = clamp(
        (row["avg_pause_ms"] / 1500) * 0.55
        + row["backspace_rate"] * 2.4 * 0.25
        + row["rewrite_frequency"] * 0.9 * 0.20,
        0,
        1,
    )
    focus_score = clamp(
        1 - (row["focus_loss_events"] / 7) * 0.7 - (row["tab_switch_count"] / 10) * 0.3,
        0,
        1,
    )
    struggle_score = clamp(
        row["rewrite_frequency"] * 0.35
        + row["backspace_rate"] * 2.2 * 0.35
        + (1 - focus_score) * 0.30,
        0,
        1,
    )
    confidence_score = clamp(
        (row["typing_speed_wpm"] / 60) * 0.3
        + focus_score * 0.45
        + (1 - hesitation_index) * 0.25
        - struggle_score * 0.2,
        0,
        1,
    )
    return {
        "hesitation_index": round(hesitation_index, 4),
        "focus_score": round(focus_score, 4),
        "struggle_score": round(struggle_score, 4),
        "confidence_score": round(confidence_score, 4),
    }


def assign_state(features: dict) -> str:
    if features["focus_score"] < 0.35 and features["hesitation_index"] > 0.55:
        return "Fatigued"
    if features["confidence_score"] > 0.66 and features["struggle_score"] > 0.34:
        return "Overconfident"
    if features["confidence_score"] > 0.72 and features["struggle_score"] < 0.25:
        return "Clear"
    if features["confidence_score"] < 0.45 and features["struggle_score"] > 0.50:
        return "Confused"
    return "Guessing"


STATE_PRIORS = {
    "Clear": {
        "typing_speed_wpm": (47, 7),
        "avg_pause_ms": (520, 150),
        "backspace_rate": (0.06, 0.03),
        "rewrite_frequency": (0.16, 0.08),
        "focus_loss_events": (0.8, 0.8),
        "tab_switch_count": (1.0, 1.0),
        "question_time_sec": (55, 14),
    },
    "Confused": {
        "typing_speed_wpm": (24, 7),
        "avg_pause_ms": (1420, 320),
        "backspace_rate": (0.20, 0.06),
        "rewrite_frequency": (0.50, 0.14),
        "focus_loss_events": (2.4, 1.3),
        "tab_switch_count": (3.0, 1.8),
        "question_time_sec": (108, 30),
    },
    "Fatigued": {
        "typing_speed_wpm": (20, 6),
        "avg_pause_ms": (1750, 380),
        "backspace_rate": (0.15, 0.05),
        "rewrite_frequency": (0.35, 0.12),
        "focus_loss_events": (4.0, 1.5),
        "tab_switch_count": (4.3, 2.1),
        "question_time_sec": (132, 34),
    },
    "Guessing": {
        "typing_speed_wpm": (30, 8),
        "avg_pause_ms": (960, 260),
        "backspace_rate": (0.12, 0.05),
        "rewrite_frequency": (0.28, 0.11),
        "focus_loss_events": (2.0, 1.2),
        "tab_switch_count": (2.4, 1.5),
        "question_time_sec": (82, 24),
    },
    "Overconfident": {
        "typing_speed_wpm": (49, 7),
        "avg_pause_ms": (560, 140),
        "backspace_rate": (0.11, 0.03),
        "rewrite_frequency": (0.52, 0.10),
        "focus_loss_events": (1.4, 0.8),
        "tab_switch_count": (1.9, 1.1),
        "question_time_sec": (66, 18),
    },
}


def _sample_from_prior(target_state: str) -> dict:
    prior = STATE_PRIORS[target_state]
    return {
        "typing_speed_wpm": clamp(RNG.normal(*prior["typing_speed_wpm"]), 8, 72),
        "avg_pause_ms": clamp(RNG.normal(*prior["avg_pause_ms"]), 120, 3200),
        "backspace_rate": clamp(RNG.normal(*prior["backspace_rate"]), 0.005, 0.45),
        "rewrite_frequency": clamp(RNG.normal(*prior["rewrite_frequency"]), 0.01, 0.95),
        "focus_loss_events": int(clamp(RNG.normal(*prior["focus_loss_events"]), 0, 8)),
        "tab_switch_count": int(clamp(RNG.normal(*prior["tab_switch_count"]), 0, 12)),
        "question_time_sec": clamp(RNG.normal(*prior["question_time_sec"]), 15, 220),
    }


def generate_sample(student_id: int, session_id: int, target_state: str) -> dict:
    raw = _sample_from_prior(target_state)

    row = {
        "student_id": student_id,
        "session_id": session_id,
        "topic": RNG.choice(TOPICS),
        "typing_speed_wpm": round(raw["typing_speed_wpm"], 3),
        "avg_pause_ms": round(raw["avg_pause_ms"], 3),
        "backspace_rate": round(raw["backspace_rate"], 4),
        "rewrite_frequency": round(raw["rewrite_frequency"], 4),
        "focus_loss_events": raw["focus_loss_events"],
        "tab_switch_count": raw["tab_switch_count"],
        "question_time_sec": round(raw["question_time_sec"], 3),
    }
    feats = compute_behavior_features(row)
    cognitive_state = assign_state(feats)

    base_quiz = {
        "Clear": RNG.normal(84, 8),
        "Confused": RNG.normal(52, 10),
        "Fatigued": RNG.normal(43, 11),
        "Guessing": RNG.normal(58, 12),
        "Overconfident": RNG.normal(62, 13),
    }[cognitive_state]
    quiz_score = clamp(base_quiz + RNG.normal(0, 5), 20, 100)
    fake_understanding = int(cognitive_state == "Overconfident" and quiz_score < 60)
    # Inject mild noise for realism.
    if RNG.random() < 0.08:
        fake_understanding = 1 - fake_understanding
    time_to_master_min = clamp(
        18
        + feats["hesitation_index"] * 45
        + feats["struggle_score"] * 35
        + (1 - feats["focus_score"]) * 25
        - feats["confidence_score"] * 18
        + RNG.normal(0, 6),
        8,
        120,
    )
    burnout_risk = int(
        feats["focus_score"] < 0.4
        and (feats["hesitation_index"] > 0.55 or row["question_time_sec"] > 130)
    )
    if RNG.random() < 0.07:
        burnout_risk = 1 - burnout_risk

    return {
        **row,
        **feats,
        "cognitive_state": cognitive_state,
        "quiz_score": round(quiz_score, 2),
        "fake_understanding": fake_understanding,
        "time_to_master_min": round(time_to_master_min, 2),
        "burnout_risk": burnout_risk,
    }


def build_dataset(samples: int = 2000) -> pd.DataFrame:
    rows = []
    quotas = {state: samples // len(COGNITIVE_STATES) for state in COGNITIVE_STATES}
    state_queue = []
    for state, count in quotas.items():
        state_queue.extend([state] * count)
    while len(state_queue) < samples:
        state_queue.append(RNG.choice(COGNITIVE_STATES))
    RNG.shuffle(state_queue)

    for idx in range(samples):
        student_id = int(RNG.integers(1, 31))  # 20-30 students target
        rows.append(
            generate_sample(
                student_id=student_id,
                session_id=idx + 1,
                target_state=state_queue[idx],
            )
        )
    return pd.DataFrame(rows)


if __name__ == "__main__":
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    df = build_dataset(samples=2400)
    df.to_csv(OUT_FILE, index=False)
    print(f"Generated dataset: {OUT_FILE}")
    print(f"Shape: {df.shape}")
    print("State distribution:")
    print(df["cognitive_state"].value_counts())
