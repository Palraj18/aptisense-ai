from __future__ import annotations

from typing import Dict, Any
import numpy as np
import pandas as pd


def _clip(series: pd.Series, low: float, high: float) -> pd.Series:
    return series.clip(lower=low, upper=high)


def engineer_features(df: pd.DataFrame, random_seed: int = 42) -> pd.DataFrame:
    """
    Derive behavior-only features from either public datasets or synthetic logs.

    Psychological rationale:
    - Higher response delays + rewrites + backspaces imply cognitive hesitation.
    - Higher focus score proxies sustained attention.
    - Confidence score models fluency + focus with less hesitation.
    - Struggle score combines corrections and attention breaks.
    """
    out = df.copy()
    rng = np.random.default_rng(random_seed)

    # Fill missing source columns using realistic synthetic assumptions.
    if "typing_speed" not in out.columns:
        out["typing_speed"] = rng.normal(45, 12, len(out))
    if "average_response_time_ms" not in out.columns:
        out["average_response_time_ms"] = rng.normal(950, 300, len(out))
    if "attempt_count" not in out.columns:
        out["attempt_count"] = rng.poisson(2.2, len(out))
    if "accuracy_rate" not in out.columns:
        out["accuracy_rate"] = _clip(pd.Series(rng.normal(0.68, 0.2, len(out))), 0.0, 1.0)
    if "interaction_frequency" not in out.columns:
        out["interaction_frequency"] = rng.poisson(18, len(out))
    if "backspace_frequency" not in out.columns:
        # Poisson assumptions for correction behavior.
        out["backspace_frequency"] = rng.poisson(7, len(out)) / 100.0
    if "rewrite_frequency" not in out.columns:
        out["rewrite_frequency"] = _clip(pd.Series(rng.normal(0.3, 0.12, len(out))), 0.0, 1.0)

    out["typing_speed"] = _clip(out["typing_speed"], 20, 80)
    out["average_response_time_ms"] = _clip(out["average_response_time_ms"], 100, 3500)
    out["attempt_count"] = _clip(out["attempt_count"], 1, 10)
    out["accuracy_rate"] = _clip(out["accuracy_rate"], 0, 1)
    out["backspace_frequency"] = _clip(out["backspace_frequency"], 0, 0.6)
    out["rewrite_frequency"] = _clip(out["rewrite_frequency"], 0, 1)
    out["interaction_frequency"] = _clip(out["interaction_frequency"], 1, 80)

    out["hesitation_index"] = _clip(
        (out["average_response_time_ms"] / 2200) * 0.45
        + (out["backspace_frequency"] / 0.6) * 0.25
        + out["rewrite_frequency"] * 0.20
        + ((out["attempt_count"] - 1) / 9) * 0.10,
        0,
        1,
    )
    out["focus_score"] = _clip(
        0.60 * out["interaction_frequency"] / 80
        + 0.40 * (1 - out["average_response_time_ms"] / 3500),
        0,
        1,
    )
    out["struggle_score"] = _clip(
        0.35 * (out["attempt_count"] / 10)
        + 0.30 * out["rewrite_frequency"]
        + 0.20 * (out["backspace_frequency"] / 0.6)
        + 0.15 * (1 - out["accuracy_rate"]),
        0,
        1,
    )
    out["confidence_score"] = _clip(
        0.35 * (out["typing_speed"] / 80)
        + 0.30 * out["focus_score"]
        + 0.20 * out["accuracy_rate"]
        + 0.15 * (1 - out["hesitation_index"]),
        0,
        1,
    )
    return out


def label_cognitive_state(df: pd.DataFrame) -> pd.Series:
    """
    Rule-based labeling:
    - Confused: high latency + retries + low accuracy
    - Clear: fast response + high accuracy + low retries
    - Fatigued: low focus + high delay + low interaction
    - Overconfident: high confidence with weak accuracy
    - else Guessing
    """
    conditions = [
        (
            (df["average_response_time_ms"] > 1500)
            & (df["attempt_count"] >= 4)
            & (df["accuracy_rate"] < 0.55)
        ),
        (
            (df["average_response_time_ms"] < 750)
            & (df["attempt_count"] <= 2)
            & (df["accuracy_rate"] >= 0.8)
        ),
        (
            (df["focus_score"] < 0.35)
            & (df["average_response_time_ms"] > 1400)
            & (df["interaction_frequency"] < 8)
        ),
        ((df["confidence_score"] > 0.75) & (df["accuracy_rate"] < 0.6)),
    ]
    labels = ["Confused", "Clear", "Fatigued", "Overconfident"]
    return pd.Series(np.select(conditions, labels, default="Guessing"), index=df.index)
