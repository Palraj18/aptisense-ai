from __future__ import annotations

from pathlib import Path
import json


ROOT = Path(__file__).resolve().parents[1]
METRIC_FILES = [
    "cognitive_classifier_metrics.json",
    "fake_understanding_metrics.json",
    "learning_efficiency_metrics.json",
    "burnout_detector_metrics.json",
]


def summarize() -> dict:
    summary = {}
    for name in METRIC_FILES:
        p = ROOT / "evaluation" / name
        if not p.exists():
            summary[name] = "missing"
            continue
        with p.open("r", encoding="utf-8") as f:
            payload = json.load(f)
        summary[name] = {
            "accuracy": payload.get("accuracy"),
            "f1_macro": payload.get("f1_macro"),
            "r2_score": payload.get("r2_score"),
            "mae": payload.get("mae"),
            "rmse": payload.get("rmse"),
        }
    return summary


if __name__ == "__main__":
    print(json.dumps(summarize(), indent=2))
