from __future__ import annotations

from pathlib import Path
import json
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "synthetic" / "behavior_dataset.csv"
OUT_DIR = ROOT / "evaluation" / "plots"
COMPARE_PATH = ROOT / "evaluation" / "model_comparison.json"


def run() -> None:
    if not DATA_PATH.exists():
        raise FileNotFoundError("Run training/train_all.py first to generate dataset.")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(DATA_PATH)

    # 1) Correlation matrix
    num_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    plt.figure(figsize=(12, 9))
    sns.heatmap(df[num_cols].corr(), cmap="coolwarm", center=0)
    plt.title("Behavioral Feature Correlation Matrix")
    plt.tight_layout()
    plt.savefig(OUT_DIR / "correlation_matrix.png", dpi=180)
    plt.close()

    # 2) Distributions
    for col in ["typing_speed", "hesitation_index", "confidence_score", "struggle_score", "focus_score"]:
        if col in df.columns:
            plt.figure(figsize=(7, 4))
            sns.histplot(df[col], kde=True, bins=30)
            plt.title(f"Distribution - {col}")
            plt.tight_layout()
            plt.savefig(OUT_DIR / f"dist_{col}.png", dpi=180)
            plt.close()

    # 3) Cognitive state distribution
    if "cognitive_state" in df.columns:
        plt.figure(figsize=(7, 4))
        sns.countplot(data=df, x="cognitive_state", order=df["cognitive_state"].value_counts().index)
        plt.xticks(rotation=15)
        plt.title("Cognitive State Distribution")
        plt.tight_layout()
        plt.savefig(OUT_DIR / "cognitive_state_distribution.png", dpi=180)
        plt.close()

    # 4) Feature importance from saved comparison (best model summary only)
    if COMPARE_PATH.exists():
        payload = json.loads(COMPARE_PATH.read_text(encoding="utf-8"))
        (OUT_DIR / "summary.txt").write_text(json.dumps(payload, indent=2), encoding="utf-8")

    print(f"EDA plots saved at: {OUT_DIR}")


if __name__ == "__main__":
    run()
