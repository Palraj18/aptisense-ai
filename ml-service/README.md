# NeuroLearn++ ML Service

Production-style MCA pipeline for behavior-based educational intelligence.

## Folder Structure

```text
ml-service/
├── data/
│   ├── raw/                    # EdNet / ASSISTments CSV samples
│   └── synthetic/              # generated behavior dataset
├── feature_pipeline/
│   ├── behavioral_features.py  # feature derivation + cognitive rules
│   └── build_features.py       # runtime feature calculator for API inference
├── training/
│   ├── data_sources.py         # EdNet/ASSISTments adapters
│   ├── generate_synthetic_data.py
│   └── train_all.py            # full train + benchmark pipeline
├── evaluation/
│   ├── run_eda.py              # correlation/distribution plots
│   └── model_comparison.json
├── inference/
│   └── predict.py
└── models/
    ├── cognitive_classifier.pkl
    ├── fake_understanding.pkl
    ├── efficiency_predictor.pkl
    └── burnout_detector.pkl
```

## Features and Psychological Meaning

- `typing_speed`: processing fluency / retrieval confidence
- `hesitation_index`: uncertainty and cognitive load
- `average_response_time_ms`: decision latency
- `backspace_frequency`: correction behavior and doubt
- `rewrite_frequency`: reformulation pressure
- `attempt_count`: retry burden
- `accuracy_rate`: objective understanding
- `confidence_score`: self-belief proxy from smooth behavior + focus
- `focus_score`: engagement and sustained attention
- `struggle_score`: cumulative friction in problem solving

## Labeling Logic (Cognitive State)

- **Confused**: high response time + many attempts + low accuracy
- **Clear**: fast response + few attempts + high accuracy
- **Fatigued**: low focus + high response delay + low interactions
- **Overconfident**: high confidence signals with poor actual accuracy
- **Guessing**: default when no strong profile above

## Supported Datasets

- **EdNet** and **ASSISTments** via `training/data_sources.py`
- If behavioral fields are absent, synthetic proxies are generated using realistic distributions:
  - Poisson for backspace/attempt behavior
  - Normal distributions for speed/latency
  - bounded scaling for confidence/focus/struggle

## End-to-End Run

```bash
pip install -r requirements.txt
python training/train_all.py
python evaluation/run_eda.py
python inference/predict.py
```

## Models Trained and Benchmarked

### Classification
- Random Forest
- XGBoost
- Logistic Regression
- SVM

### Regression
- Linear Regression
- Random Forest Regressor

Best-per-task models are persisted as:
- `cognitive_classifier.pkl`
- `fake_understanding.pkl`
- `efficiency_predictor.pkl`
- `burnout_detector.pkl`

Detailed comparison and metrics (accuracy, precision, recall, F1, ROC-AUC, confusion matrix, RMSE/MAE/R2) are stored in:
- `evaluation/model_comparison.json`

## Sample Inference Input

```json
{
  "typing_speed_wpm": 31,
  "avg_pause_ms": 1120,
  "backspace_rate": 0.16,
  "rewrite_frequency": 0.38,
  "focus_loss_events": 2,
  "tab_switch_count": 3,
  "question_time_sec": 92
}
```
