import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes.train import router as train_router
from backend.api.routes.alerts import router as alerts_router
from backend.api.websocket import router as websocket_router

app = FastAPI(
    title="YatraSuchak API",
    version="0.1.0",
    description="Dynamic ETA forecasting starter backend for coaching trains.",
)

origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(train_router)
app.include_router(alerts_router)
app.include_router(websocket_router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "YatraSuchak"}
