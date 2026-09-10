# YatraSuchak — SIH 2026 Starter Project

Problem Statement: **Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains**  
Architecture: GNSS/RTIS + signalling + historical data → validation/data fusion → delay features → ML ETA → passenger/station/control-room dashboard.

## Included

- FastAPI backend
- REST endpoints
  - `GET /health`
  - `POST /api/train/start`
  - `GET /api/train/{train_no}/telemetry`
  - `GET /api/train/{train_no}/schedule`
  - `GET /api/train/{train_no}/route`
  - `GET /api/train/{train_no}/eta`
- WebSocket: `ws://localhost:8000/ws/telemetry/{train_no}`
- Synthetic railway dataset
- XGBoost training script
- Model evaluation script
- React + Vite + Leaflet frontend
- Demo route and train data

## 1. Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open: http://localhost:8000/docs

## 2. Train the ML model

From the repository root:

```bash
pip install -r requirements.txt
python ml/training/train_xgboost.py
```

The trained model is saved to:

`ml/models/eta_xgboost.joblib`

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL, usually http://localhost:5173

## Demo train

Use train number:

`12301`

## Example prediction input

- speed: 92 km/h
- current delay: 8 min
- distance to next station: 38 km
- historical travel time: 31 min
- previous delay: 6 min
- congestion: 0.4
- expected dwell: 3 min

The starter backend can use the trained model if present. If the model has not been trained yet, it falls back to a deterministic ETA estimator so the demo still runs.

## Suggested next steps

Replace the synthetic dataset with authenticated railway/RTIS/signalling feeds, add a persistent database, validate data-quality rules, add authentication/authorization, and retrain the model with route-specific historical data.
