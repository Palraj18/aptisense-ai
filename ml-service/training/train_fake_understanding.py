from __future__ import annotations

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

from common import BASE_FEATURES, load_dataset, save_metrics, save_model


def train() -> None:
    df = load_dataset()
    features = BASE_FEATURES + ["quiz_score"]
    X = df[features]
    y = df["fake_understanding"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    model = RandomForestClassifier(
        n_estimators=250,
        max_depth=10,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision_macro": round(float(precision_score(y_test, y_pred, average="macro")), 4),
        "recall_macro": round(float(recall_score(y_test, y_pred, average="macro")), 4),
        "f1_macro": round(float(f1_score(y_test, y_pred, average="macro")), 4),
        "classification_report": classification_report(y_test, y_pred, output_dict=True),
        "features": features,
    }
    model_path = save_model(model, "fake_understanding.pkl")
    metrics_path = save_metrics(metrics, "fake_understanding_metrics.json")
    print(f"Saved model -> {model_path}")
    print(f"Saved metrics -> {metrics_path}")
    print({k: metrics[k] for k in ["accuracy", "precision_macro", "recall_macro", "f1_macro"]})


if __name__ == "__main__":
    train()
