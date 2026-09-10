from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.database.connection import ACTIVE_TRAINS
from backend.api.routes.train import DEFAULT_TELEMETRY
from backend.services.eta_predictor import predict_remaining_minutes
from datetime import datetime, timezone
import asyncio, random

router = APIRouter()

@router.websocket("/ws/telemetry/{train_no}")
async def telemetry_ws(websocket: WebSocket, train_no: str):
    await websocket.accept()
    state = ACTIVE_TRAINS.setdefault(
        train_no,
        {
            **DEFAULT_TELEMETRY,
            "train_no": train_no,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

    try:
        while True:
            # Lightweight demo movement around Kolkata/Howrah area.
            state["speed_kmph"] = round(max(0, state["speed_kmph"] + random.uniform(-4, 4)), 1)
            state["distance_to_station_km"] = round(
                max(0, state["distance_to_station_km"] - state["speed_kmph"] / 3600 * 2.5), 2
            )
            state["latitude"] = round(state["latitude"] + random.uniform(-0.0012, 0.0012), 6)
            state["longitude"] = round(state["longitude"] + random.uniform(-0.0012, 0.0012), 6)
            state["congestion_index"] = round(min(1, max(0, state["congestion_index"] + random.uniform(-0.03, 0.03))), 2)
            state["timestamp"] = datetime.now(timezone.utc).isoformat()

            eta_min, source = predict_remaining_minutes(state)
            await websocket.send_json({**state, "predicted_remaining_time_min": eta_min, "model_source": source})
            await asyncio.sleep(2.5)
    except WebSocketDisconnect:
        return
