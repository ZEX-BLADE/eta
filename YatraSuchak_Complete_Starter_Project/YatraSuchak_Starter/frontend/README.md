# YatraSuchak — Best Frontend

A production-oriented prototype frontend for a real-time railway ETA/control-room application.

## Highlights

- Government-style white and Indian Railways-inspired orange visual system
- Real-time WebSocket telemetry
- Automatic reconnect with exponential backoff
- REST polling fallback
- Stale telemetry detection
- Backend health check
- Live GNSS train map
- Follow-train mode
- Dynamic ETA and confidence panel
- Delay/operational indicators
- Station-by-station forecast board
- Responsive control-room layout
- Componentized React architecture

## Run

```bash
npm install
npm run dev
```

Set the backend when needed:

```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

## Backend contract expected

- `GET /health`
- `POST /api/train/start`
- `GET /api/train/{train_no}/eta`
- `GET /api/train/{train_no}/telemetry`
- `GET /api/train/{train_no}/route`
- `GET /api/train/{train_no}/schedule`
- `WS /ws/telemetry/{train_no}`

## Important

This frontend is ready for a serious prototype/demo. A real railway deployment must add authenticated gateways, TLS, RBAC, audit logging, rate limiting, centralized observability, signed data feeds and horizontally scalable WebSocket/stream infrastructure. The browser must never directly access sensitive railway infrastructure.
