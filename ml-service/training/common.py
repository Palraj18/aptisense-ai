from __future__ import annotations

from pathlib import Path
import json
import joblib
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "synthetic" / "behavior_dataset.csv"
MODELS_DIR = ROOT / "models"
METRICS_DIR = ROOT / "evaluation"

BASE_FEATURES = [
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


def load_dataset() -> pd.DataFrame:
    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_FILE}. Run training/generate_synthetic_data.py first."
        )
    return pd.read_csv(DATA_FILE)


def save_model(model, file_name: str) -> Path:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    out = MODELS_DIR / file_name
    joblib.dump(model, out)
    return out


def save_metrics(payload: dict, file_name: str) -> Path:
    METRICS_DIR.mkdir(parents=True, exist_ok=True)
    out = METRICS_DIR / file_name
    with out.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    return out
