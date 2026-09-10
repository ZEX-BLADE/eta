from fastapi import APIRouter, HTTPException
from backend.models.train import TrainStartRequest
from backend.database.connection import ACTIVE_TRAINS
from backend.services.eta_predictor import predict_remaining_minutes, arrival_iso
from backend.services.delay_classifier import classify_delay
from backend.utils.config import ROUTE_PATH, SCHEDULE_PATH
import json
from datetime import datetime, timezone

router = APIRouter(prefix="/api/train", tags=["train"])

DEFAULT_TELEMETRY = {
    "latitude": 22.5726,
    "longitude": 88.3639,
    "speed_kmph": 92,
    "current_delay_min": 8,
    "distance_to_station_km": 38,
    "historical_travel_time_min": 31,
    "previous_delay_min": 6,
    "congestion_index": 0.4,
    "expected_dwell_min": 3,
    "signal_delay_min": 2,
    "maintenance_block": 0,
    "level_crossing_delay_min": 1,
}

@router.post("/start")
def start_train(payload: TrainStartRequest):
    ACTIVE_TRAINS[payload.train_no] = {
        **DEFAULT_TELEMETRY,
        "train_no": payload.train_no,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    return {
        "train_no": payload.train_no,
        "status": "started",
        "message": "Telemetry simulation initialized",
    }

@router.get("/{train_no}/telemetry")
def telemetry(train_no: str):
    if train_no not in ACTIVE_TRAINS:
        ACTIVE_TRAINS[train_no] = {
            **DEFAULT_TELEMETRY,
            "train_no": train_no,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    return ACTIVE_TRAINS[train_no]

@router.get("/{train_no}/eta")
def eta(train_no: str):
    data = telemetry(train_no)
    minutes, source = predict_remaining_minutes(data)
    delay_info = classify_delay(
        data["current_delay_min"],
        data["signal_delay_min"],
        data["congestion_index"],
        data["maintenance_block"],
    )
    return {
        "train_no": train_no,
        "next_station": "Howrah Jn",
        "predicted_remaining_time_min": minutes,
        "predicted_arrival_iso": arrival_iso(minutes),
        "current_delay_min": data["current_delay_min"],
        "model_source": source,
        "delay": delay_info,
    }

@router.get("/{train_no}/schedule")
def schedule(train_no: str):
    if not SCHEDULE_PATH.exists():
        raise HTTPException(status_code=404, detail="Schedule file not found")
    payload = json.loads(SCHEDULE_PATH.read_text(encoding="utf-8"))
    payload["train_no"] = train_no
    return payload

@router.get("/{train_no}/route")
def route(train_no: str):
    if not ROUTE_PATH.exists():
        raise HTTPException(status_code=404, detail="Route file not found")
    return json.loads(ROUTE_PATH.read_text(encoding="utf-8"))
