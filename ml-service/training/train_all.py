from __future__ import annotations

from pathlib import Path
import json
import sys
import warnings
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.svm import SVC
from xgboost import XGBClassifier


warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from training.data_sources import merge_public_datasets
from feature_pipeline.behavioral_features import engineer_features, label_cognitive_state

OUT_MODELS = ROOT / "models"
OUT_EVAL = ROOT / "evaluation"
OUT_SYN = ROOT / "data" / "synthetic" / "behavior_dataset.csv"

BASE_FEATURES = [
    "typing_speed",
    "hesitation_index",
    "average_response_time_ms",
    "backspace_frequency",
    "rewrite_frequency",
    "attempt_count",
    "accuracy_rate",
    "confidence_score",
    "focus_score",
    "struggle_score",
    "interaction_frequency",
]


def _build_dataset() -> pd.DataFrame:
    public_df = merge_public_datasets()
    if public_df.empty:
        from training.generate_synthetic_data import build_dataset

        syn = build_dataset(2800).rename(
            columns={
                "typing_speed_wpm": "typing_speed",
                "avg_pause_ms": "average_response_time_ms",
                "backspace_rate": "backspace_frequency",
                "quiz_score": "accuracy_rate_proxy",
                "question_time_sec": "interaction_frequency",
            }
        )
        syn["accuracy_rate"] = (syn["accuracy_rate_proxy"] / 100.0).clip(0, 1)
        syn["attempt_count"] = np.clip((syn["rewrite_frequency"] * 8).round() + 1, 1, 10)
        syn["interaction_frequency"] = np.clip(
            40 - syn["average_response_time_ms"] / 100 + np.random.normal(0, 3, len(syn)),
            1,
            80,
        )
        df = engineer_features(syn)
    else:
        df = engineer_features(public_df)

    df["cognitive_state"] = label_cognitive_state(df)
    df["quiz_score"] = (df["accuracy_rate"] * 100).round(2)
    df["fake_understanding"] = (
        ((df["confidence_score"] > 0.75) & (df["quiz_score"] < 55))
        | ((df["confidence_score"] < 0.35) & (df["quiz_score"] > 78))
    ).astype(int)
    flip_mask = np.random.rand(len(df)) < 0.08
    df.loc[flip_mask, "fake_understanding"] = 1 - df.loc[flip_mask, "fake_understanding"]
    df["time_to_master_min"] = np.clip(
        15
        + 50 * df["hesitation_index"]
        + 35 * df["struggle_score"]
        + 20 * (1 - df["focus_score"])
        - 12 * df["confidence_score"]
        + np.random.normal(0, 5, len(df)),
        8,
        150,
    )
    df["burnout_risk"] = (
        (df["focus_score"] < 0.32)
        | ((df["average_response_time_ms"] > 1500) & (df["accuracy_rate"] < 0.55))
    ).astype(int)
    OUT_SYN.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_SYN, index=False)
    return df


def _clean(df: pd.DataFrame) -> pd.DataFrame:
    x = df.copy()
    for col in BASE_FEATURES:
        q1, q3 = x[col].quantile(0.25), x[col].quantile(0.75)
        iqr = q3 - q1
        low, high = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        x = x[(x[col] >= low) & (x[col] <= high)]
    return x


def _class_metrics(y_true, y_pred, y_prob=None):
    out = {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision_macro": round(float(precision_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "recall_macro": round(float(recall_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "f1_macro": round(float(f1_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
        "classification_report": classification_report(y_true, y_pred, output_dict=True, zero_division=0),
    }
    if y_prob is not None:
        try:
            out["roc_auc_ovr"] = round(float(roc_auc_score(y_true, y_prob, multi_class="ovr")), 4)
        except Exception:
            pass
    return out


def _reg_metrics(y_true, y_pred):
    rmse = mean_squared_error(y_true, y_pred) ** 0.5
    return {
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 4),
        "rmse": round(float(rmse), 4),
        "r2_score": round(float(r2_score(y_true, y_pred)), 4),
    }


def _prep_pipeline(feature_cols):
    return ColumnTransformer(
        [("num", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]), feature_cols)]
    )


def train_all() -> dict:
    OUT_MODELS.mkdir(parents=True, exist_ok=True)
    OUT_EVAL.mkdir(parents=True, exist_ok=True)

    df = _clean(_build_dataset())
    X = df[BASE_FEATURES]

    # 1) Cognitive state
    y_state = df["cognitive_state"]
    label_enc = LabelEncoder()
    y_state_enc = label_enc.fit_transform(y_state)
    Xtr, Xte, ytr, yte = train_test_split(X, y_state_enc, test_size=0.2, random_state=42, stratify=y_state_enc)
    pre = _prep_pipeline(BASE_FEATURES)
    cls_models = {
        "random_forest": RandomForestClassifier(n_estimators=300, random_state=42, class_weight="balanced"),
        "xgboost": XGBClassifier(
            n_estimators=250, max_depth=6, learning_rate=0.08, subsample=0.9, colsample_bytree=0.9, eval_metric="mlogloss"
        ),
        "logistic_regression": LogisticRegression(max_iter=1000, multi_class="auto"),
        "svm": SVC(probability=True),
    }
    cognitive_results = {}
    best_name, best_score, best_pipe = None, -1, None
    for name, model in cls_models.items():
        pipe = Pipeline([("prep", pre), ("model", model)])
        pipe.fit(Xtr, ytr)
        pred = pipe.predict(Xte)
        prob = pipe.predict_proba(Xte) if hasattr(pipe.named_steps["model"], "predict_proba") else None
        metrics = _class_metrics(yte, pred, prob)
        cognitive_results[name] = metrics
        if metrics["f1_macro"] > best_score:
            best_name, best_score, best_pipe = name, metrics["f1_macro"], pipe
    joblib.dump({"pipeline": best_pipe, "label_encoder": label_enc, "features": BASE_FEATURES}, OUT_MODELS / "cognitive_classifier.pkl")

    # 2) Fake understanding
    y_fake = df["fake_understanding"]
    X2 = df[BASE_FEATURES + ["quiz_score"]]
    Xtr, Xte, ytr, yte = train_test_split(X2, y_fake, test_size=0.2, random_state=42, stratify=y_fake)
    pre2 = _prep_pipeline(BASE_FEATURES + ["quiz_score"])
    fake_models = {
        "random_forest": RandomForestClassifier(n_estimators=250, random_state=42, class_weight="balanced"),
        "xgboost": XGBClassifier(n_estimators=220, max_depth=5, learning_rate=0.08, eval_metric="logloss"),
        "logistic_regression": LogisticRegression(max_iter=1000),
        "svm": SVC(probability=True),
    }
    fake_results = {}
    best_name_fake, best_score_fake, best_pipe_fake = None, -1, None
    for name, model in fake_models.items():
        pipe = Pipeline([("prep", pre2), ("model", model)])
        pipe.fit(Xtr, ytr)
        pred = pipe.predict(Xte)
        prob = None
        if hasattr(pipe.named_steps["model"], "predict_proba"):
            raw_prob = pipe.predict_proba(Xte)
            if raw_prob.ndim == 2 and raw_prob.shape[1] > 1:
                prob = raw_prob[:, 1]
        metrics = _class_metrics(yte, pred)
        if prob is not None:
            metrics["roc_auc"] = round(float(roc_auc_score(yte, prob)), 4)
        fake_results[name] = metrics
        if metrics["f1_macro"] > best_score_fake:
            best_name_fake, best_score_fake, best_pipe_fake = name, metrics["f1_macro"], pipe
    joblib.dump({"pipeline": best_pipe_fake, "features": BASE_FEATURES + ["quiz_score"]}, OUT_MODELS / "fake_understanding.pkl")

    # 3) Learning efficiency regression
    y_eff = df["time_to_master_min"]
    X3 = df[BASE_FEATURES + ["quiz_score"]]
    Xtr, Xte, ytr, yte = train_test_split(X3, y_eff, test_size=0.2, random_state=42)
    pre3 = _prep_pipeline(BASE_FEATURES + ["quiz_score"])
    reg_models = {
        "linear_regression": LinearRegression(),
        "random_forest_regressor": RandomForestRegressor(n_estimators=280, random_state=42),
    }
    reg_results = {}
    best_name_reg, best_rmse, best_pipe_reg = None, 10**9, None
    for name, model in reg_models.items():
        pipe = Pipeline([("prep", pre3), ("model", model)])
        pipe.fit(Xtr, ytr)
        pred = pipe.predict(Xte)
        metrics = _reg_metrics(yte, pred)
        reg_results[name] = metrics
        if metrics["rmse"] < best_rmse:
            best_name_reg, best_rmse, best_pipe_reg = name, metrics["rmse"], pipe
    joblib.dump({"pipeline": best_pipe_reg, "features": BASE_FEATURES + ["quiz_score"]}, OUT_MODELS / "efficiency_predictor.pkl")

    # 4) Burnout
    y_burn = df["burnout_risk"]
    X4 = df[BASE_FEATURES + ["quiz_score"]]
    Xtr, Xte, ytr, yte = train_test_split(X4, y_burn, test_size=0.2, random_state=42, stratify=y_burn)
    pre4 = _prep_pipeline(BASE_FEATURES + ["quiz_score"])
    burn_models = {
        "random_forest": RandomForestClassifier(n_estimators=260, random_state=42, class_weight="balanced"),
        "xgboost": XGBClassifier(n_estimators=220, max_depth=5, learning_rate=0.08, eval_metric="logloss"),
        "logistic_regression": LogisticRegression(max_iter=1000),
        "svm": SVC(probability=True),
    }
    burn_results = {}
    best_name_burn, best_score_burn, best_pipe_burn = None, -1, None
    for name, model in burn_models.items():
        pipe = Pipeline([("prep", pre4), ("model", model)])
        pipe.fit(Xtr, ytr)
        pred = pipe.predict(Xte)
        prob = None
        if hasattr(pipe.named_steps["model"], "predict_proba"):
            raw_prob = pipe.predict_proba(Xte)
            if raw_prob.ndim == 2 and raw_prob.shape[1] > 1:
                prob = raw_prob[:, 1]
        metrics = _class_metrics(yte, pred)
        if prob is not None:
            metrics["roc_auc"] = round(float(roc_auc_score(yte, prob)), 4)
        burn_results[name] = metrics
        if metrics["f1_macro"] > best_score_burn:
            best_name_burn, best_score_burn, best_pipe_burn = name, metrics["f1_macro"], pipe
    joblib.dump({"pipeline": best_pipe_burn, "features": BASE_FEATURES + ["quiz_score"]}, OUT_MODELS / "burnout_detector.pkl")

    summary = {
        "dataset_rows_after_cleaning": int(len(df)),
        "cognitive_state_best_model": best_name,
        "fake_understanding_best_model": best_name_fake,
        "efficiency_best_model": best_name_reg,
        "burnout_best_model": best_name_burn,
        "model_comparison": {
            "cognitive_state": cognitive_results,
            "fake_understanding": fake_results,
            "efficiency_regression": reg_results,
            "burnout": burn_results,
        },
    }
    with (OUT_EVAL / "model_comparison.json").open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(json.dumps({k: summary[k] for k in summary if k.endswith("_best_model")}, indent=2))
    return summary


if __name__ == "__main__":
    train_all()
