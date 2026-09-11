import { useEffect, useRef, useState } from "react";
import { api, telemetrySocket } from "../services/api";

const POLL_MS = 5000;
const STALE_MS = 12000;

export function useRailwayRealtime(trainNo) {
  const [data, setData] = useState({
    telemetry:null, eta:null, route:null, schedule:null,
    connection:"CONNECTING", lastUpdate:null, error:""
  });
  const ws = useRef(null);
  const alive = useRef(false);
  const retry = useRef(0);
  const retryTimer = useRef(null);
  const pollTimer = useRef(null);
  const staleTimer = useRef(null);
  const lastPacket = useRef(0);

  useEffect(() => {
    alive.current = true;
    let cancelled = false;

    const updateTelemetry = (t, e) => {
      const now = Date.now();
      lastPacket.current = now;
      setData(prev => ({
        ...prev,
        telemetry:t,
        eta:e ? {...prev.eta, ...e} : prev.eta,
        lastUpdate:now,
        error:""
      }));
    };

    const poll = async () => {
      try {
        const [t,e] = await Promise.all([api.telemetry(trainNo), api.eta(trainNo)]);
        if (alive.current) {
          updateTelemetry(t,e);
          setData(prev => ({...prev, connection:"POLLING"}));
        }
      } catch (err) {
        if (alive.current) setData(prev => ({...prev, error:`Live data fallback unavailable (${err.message})`}));
      }
    };

    const connect = () => {
      if (!alive.current) return;
      try {
        const socket = telemetrySocket(trainNo);
        ws.current = socket;
        setData(prev => ({...prev, connection:"CONNECTING"}));

        socket.onopen = () => {
          retry.current = 0;
          setData(prev => ({...prev, connection:"LIVE", error:""}));
        };

        socket.onmessage = ev => {
          try {
            const t = JSON.parse(ev.data);
            updateTelemetry(t, {
              train_no:t.train_no,
              current_delay_min:t.current_delay_min,
              predicted_remaining_time_min:t.predicted_remaining_time_min,
              model_source:t.model_source,
              next_station:t.next_station
            });
            setData(prev => ({...prev, connection:"LIVE"}));
          } catch {
            setData(prev => ({...prev, error:"Telemetry packet rejected: invalid JSON."}));
          }
        };

        socket.onerror = () => {};
        socket.onclose = () => {
          if (!alive.current) return;
          setData(prev => ({...prev, connection:"POLLING"}));
          poll();
          const delay = Math.min(30000, 1000 * 2 ** retry.current++);
          retryTimer.current = setTimeout(connect, delay);
        };
      } catch {
        poll();
        retryTimer.current = setTimeout(connect, 2000);
      }
    };

    (async () => {
      try {
        await api.start(trainNo);
        const [health, eta, route, schedule] = await Promise.all([
          api.health(), api.eta(trainNo), api.route(trainNo), api.schedule(trainNo)
        ]);
        if (cancelled) return;
        if (health?.status !== "ok") throw new Error("Backend health check failed");
        setData(prev => ({...prev, eta, route, schedule}));
        connect();
      } catch (err) {
        if (!cancelled) setData(prev => ({...prev, connection:"OFFLINE", error:`Backend unavailable: ${err.message}`}));
      }
    })();

    pollTimer.current = setInterval(() => {
      if (ws.current?.readyState !== WebSocket.OPEN) poll();
    }, POLL_MS);

    staleTimer.current = setInterval(() => {
      if (lastPacket.current && Date.now() - lastPacket.current > STALE_MS) {
        setData(prev => ({...prev, connection:"STALE"}));
      }
    }, 2000);

    return () => {
      alive.current = false;
      clearTimeout(retryTimer.current);
      clearInterval(pollTimer.current);
      clearInterval(staleTimer.current);
      ws.current?.close();
      ws.current = null;
    };
  }, [trainNo]);

  return data;
}
