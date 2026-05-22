from __future__ import annotations

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from common import BASE_FEATURES, load_dataset, save_metrics, save_model


def train() -> None:
    df = load_dataset()
    features = BASE_FEATURES + ["quiz_score"]
    X = df[features]
    y = df["time_to_master_min"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    model = RandomForestRegressor(
        n_estimators=320,
        max_depth=16,
        min_samples_leaf=2,
        random_state=42,
    )
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    rmse = mean_squared_error(y_test, y_pred) ** 0.5
    metrics = {
        "mae": round(float(mean_absolute_error(y_test, y_pred)), 4),
        "rmse": round(float(rmse), 4),
        "r2_score": round(float(r2_score(y_test, y_pred)), 4),
        "features": features,
    }
    model_path = save_model(model, "learning_efficiency.pkl")
    metrics_path = save_metrics(metrics, "learning_efficiency_metrics.json")
    print(f"Saved model -> {model_path}")
    print(f"Saved metrics -> {metrics_path}")
    print(metrics)


if __name__ == "__main__":
    train()
