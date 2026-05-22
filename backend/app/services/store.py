from __future__ import annotations

from pathlib import Path
import json
from typing import Any, Dict


BASE_DIR = Path(__file__).resolve().parents[2]
DB_FILE = BASE_DIR / "data" / "store.json"


def _default_payload() -> Dict[str, Any]:
    return {
        "sessions": {},
        "behaviors": {},
        "quiz_results": {},
        "predictions": {},
        "analytics": {},
    }


def load_store() -> Dict[str, Any]:
    if not DB_FILE.exists():
        DB_FILE.parent.mkdir(parents=True, exist_ok=True)
        payload = _default_payload()
        save_store(payload)
        return payload

    with DB_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_store(payload: Dict[str, Any]) -> None:
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    with DB_FILE.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
