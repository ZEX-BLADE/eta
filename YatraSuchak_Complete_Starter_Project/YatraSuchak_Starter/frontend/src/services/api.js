const API = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

async function request(path, options = {}, timeoutMs = 7000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { Accept: "application/json", "Content-Type": "application/json", ...(options.headers || {}) }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  health: () => request("/health"),
  start: (train) => request("/api/train/start", {method:"POST", body:JSON.stringify({train_no:train})}),
  eta: (train) => request(`/api/train/${encodeURIComponent(train)}/eta`),
  telemetry: (train) => request(`/api/train/${encodeURIComponent(train)}/telemetry`),
  route: (train) => request(`/api/train/${encodeURIComponent(train)}/route`),
  schedule: (train) => request(`/api/train/${encodeURIComponent(train)}/schedule`),
};

export function telemetrySocket(train) {
  const wsBase = API.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  return new WebSocket(`${wsBase}/ws/telemetry/${encodeURIComponent(train)}`);
}
