from __future__ import annotations

from pathlib import Path
from typing import Optional
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]


def _safe_read_csv(path: Optional[Path]) -> pd.DataFrame:
    if not path or not path.exists():
        return pd.DataFrame()
    return pd.read_csv(path)


def load_ednet(ednet_csv: Optional[Path] = None) -> pd.DataFrame:
    """
    Expected columns (example):
    user_id, timestamp, elapsed_time_ms, correctness, attempt_count, interactions
    """
    if ednet_csv is None:
        ednet_csv = ROOT / "data" / "raw" / "ednet_sample.csv"
    df = _safe_read_csv(ednet_csv)
    if df.empty:
        return df
    rename_map = {
        "elapsed_time_ms": "average_response_time_ms",
        "correctness": "accuracy_rate",
        "attempt_count": "attempt_count",
        "interactions": "interaction_frequency",
    }
    return df.rename(columns=rename_map)


def load_assistments(assist_csv: Optional[Path] = None) -> pd.DataFrame:
    """
    Expected columns (example):
    student_id, skill, ms_first_response, correct, attempts, event_count
    """
    if assist_csv is None:
        assist_csv = ROOT / "data" / "raw" / "assistments_sample.csv"
    df = _safe_read_csv(assist_csv)
    if df.empty:
        return df
    rename_map = {
        "ms_first_response": "average_response_time_ms",
        "correct": "accuracy_rate",
        "attempts": "attempt_count",
        "event_count": "interaction_frequency",
        "student_id": "user_id",
    }
    return df.rename(columns=rename_map)


def merge_public_datasets() -> pd.DataFrame:
    ednet = load_ednet()
    assist = load_assistments()
    if ednet.empty and assist.empty:
        return pd.DataFrame()
    frames = [f for f in [ednet, assist] if not f.empty]
    merged = pd.concat(frames, ignore_index=True, sort=False)
    return merged
