from __future__ import annotations

from pathlib import Path
import sys
from typing import Dict, Any


ROOT = Path(__file__).resolve().parents[3]
ML_SERVICE_PATH = ROOT / "ml-service"
sys.path.append(str(ML_SERVICE_PATH))

from inference.predict import predict_all  # noqa: E402


def run_prediction(raw_behavior: Dict[str, Any], quiz_score: float) -> Dict[str, Any]:
    return predict_all(raw_behavior=raw_behavior, quiz_score=quiz_score)
