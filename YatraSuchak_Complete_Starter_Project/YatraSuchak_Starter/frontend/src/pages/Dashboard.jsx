import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import Kpi from "../components/Kpi";
import StatusPill from "../components/StatusPill";
import RailMap from "../components/RailMap";
import { useRailwayRealtime } from "../hooks/useRailwayRealtime";

const TRAINS = [
  {no:"12301", name:"Howrah Rajdhani", route:"HWH → NDLS"},
  {no:"12302", name:"Delhi–Howrah Rajdhani", route:"NDLS → HWH"},
  {no:"12019", name:"Howrah–Ranchi Shatabdi", route:"HWH → RNC"},
  {no:"12020", name:"Ranchi–Howrah Shatabdi", route:"RNC → HWH"}
];

export default function Dashboard() {
  const [trainNo,setTrainNo] = useState("12301");
  const [follow,setFollow] = useState(true);
  const [nav,setNav] = useState("operations");
  const {telemetry,eta,route,schedule,connection,lastUpdate,error} = useRailwayRealtime(trainNo);
  const train = TRAINS.find(x=>x.no===trainNo) || TRAINS[0];

  const freshness = useMemo(() => {
    if(!lastUpdate) return "Waiting";
    const sec = Math.max(0,Math.floor((Date.now()-lastUpdate)/1000));
    return sec < 2 ? "Just now" : `${sec}s ago`;
  },[lastUpdate]);

  const arrival = eta?.predicted_eta || eta?.predicted_arrival || "—";
  const delay = Number(eta?.current_delay_min ?? telemetry?.current_delay_min ?? 0);
  const speed = telemetry?.speed_kmph ?? "—";
  const distance = telemetry?.distance_to_station_km ?? "—";
  const congestion = telemetry?.congestion_index ?? "—";
  const nextStation = eta?.next_station || telemetry?.next_station || "—";

  return <div className="portal">
    <div className="top-strip"><span>GOVERNMENT RAILWAY OPERATIONS</span><span>YATRASUCHAK · SIH 2026</span></div>

    <header className="navbar">
      <div className="brand">
        <div className="emblem">YR</div>
        <div><strong>YatraSuchak</strong><small>Dynamic Railway ETA Intelligence</small></div>
      </div>
      <nav>
        <button className={nav==="operations"?"active":""} onClick={()=>setNav("operations")}><Icon name="signal"/>Operations</button>
        <button className={nav==="trains"?"active":""} onClick={()=>setNav("trains")}><Icon name="train"/>Trains</button>
        <button className={nav==="network"?"active":""} onClick={()=>setNav("network")}><Icon name="map"/>Network</button>
      </nav>
      <StatusPill status={connection}/>
    </header>

    <main>
      <section className="page-head">
        <div>
          <div className="crumb">CONTROL ROOM / LIVE MONITORING</div>
          <h1>Train operations dashboard</h1>
          <p>Real-time movement, dynamic ETA and operational intelligence.</p>
        </div>
        <div className="data-fresh"><span>Last telemetry</span><b>{freshness}</b></div>
      </section>

      <section className="selector-row">
        <div className="train-select">
          <Icon name="train"/>
          <div><label>Selected train</label><select value={trainNo} onChange={e=>setTrainNo(e.target.value)}>{TRAINS.map(t=><option key={t.no} value={t.no}>{t.no} · {t.name}</option>)}</select></div>
        </div>
        <div className="route-name"><span>Route</span><b>{train.route}</b></div>
        <button className="refresh-btn" onClick={()=>window.location.reload()}><Icon name="refresh"/>Reconnect</button>
      </section>

      {error && <div className="system-alert"><Icon name="alert"/><div><b>System notice</b><span>{error}</span></div></div>}

      <section className="kpi-grid">
        <Kpi label="Predicted arrival" value={arrival} sub={`Next station: ${nextStation}`} accent="orange"/>
        <Kpi label="Current delay" value={`${delay >= 0 ? "+" : ""}${delay} min`} sub={delay>10?"Requires attention":"Within operational range"} accent={delay>10?"red":""}/>
        <Kpi label="Current speed" value={`${speed} km/h`} sub={`Distance: ${distance} km`}/>
        <Kpi label="Congestion index" value={congestion} sub="Network load indicator"/>
      </section>

      <section className="workspace">
        <div className="map-panel">
          <div className="panel-head">
            <div><span className="section-label">NETWORK VIEW</span><h2>Live train movement</h2></div>
            <div className="map-actions"><button className={follow?"selected":""} onClick={()=>setFollow(x=>!x)}>◉ Follow train</button><span className="legend"><i/>Route <i/>Train</span></div>
          </div>
          <RailMap telemetry={telemetry} route={route} follow={follow}/>
        </div>

        <aside className="side-panel">
          <div className="panel-head"><div><span className="section-label">PREDICTION</span><h2>Dynamic ETA</h2></div><span className="ai-badge">XGBOOST</span></div>
          <div className="eta-hero"><span>Estimated remaining time</span><strong>{eta?.predicted_remaining_time_min != null ? `${Number(eta.predicted_remaining_time_min).toFixed(1)} min` : "—"}</strong></div>
          <div className="confidence"><span>Prediction confidence</span><b>{eta?.confidence != null ? `${Math.round(eta.confidence*100)}%` : "—"}</b><div><i style={{width:`${Math.min(100,(eta?.confidence||0)*100)}%`}}/></div></div>
          <div className="factor-list">
            <Factor label="Speed" value={`${speed} km/h`}/>
            <Factor label="Delay history" value={`+${telemetry?.previous_delay_min ?? 0} min`}/>
            <Factor label="Signal impact" value={`+${telemetry?.signal_delay_min ?? 0} min`}/>
            <Factor label="Congestion" value={congestion}/>
          </div>
          <div className="model-source">Prediction engine: <b>{eta?.model_source || "XGBoost ETA model"}</b></div>
        </aside>
      </section>

      <section className="bottom-grid">
        <div className="table-panel">
          <div className="panel-head"><div><span className="section-label">FORECAST</span><h2>Station arrival board</h2></div><span className="live-mini">● LIVE</span></div>
          <div className="table-wrap"><table><thead><tr><th>Station</th><th>Scheduled</th><th>Predicted</th><th>Delay</th><th>Status</th></tr></thead>
          <tbody>{schedule?.stations?.length ? schedule.stations.map((s,i)=><tr key={i}><td><b>{s.station}</b></td><td>{s.scheduled}</td><td className="orange-text">{s.predicted}</td><td>+{s.delay_min} min</td><td><span className="station-status">{s.delay_min>10?"Attention":"On monitoring"}</span></td></tr>) : <tr><td colSpan="5">Waiting for schedule data…</td></tr>}</tbody></table></div>
        </div>
        <div className="alerts-panel">
          <div className="panel-head"><div><span className="section-label">OPERATIONS</span><h2>Active indicators</h2></div></div>
          <Alert icon="signal" title="Signal network" value={telemetry?.signal_delay_min ? `${telemetry.signal_delay_min} min impact` : "Normal"}/>
          <Alert icon="clock" title="Maintenance block" value={telemetry?.maintenance_block ? "Detected" : "None detected"}/>
          <Alert icon="alert" title="Level crossing" value={`${telemetry?.level_crossing_delay_min ?? 0} min impact`}/>
        </div>
      </section>
    </main>

    <footer><span>YatraSuchak · Railway ETA Intelligence Platform</span><span>Secure operations interface · Prototype</span></footer>
  </div>;
}

function Factor({label,value}) { return <div className="factor"><span>{label}</span><b>{value}</b></div>; }
function Alert({icon,title,value}) { return <div className="op-alert"><span className="alert-icon"><Icon name={icon}/></span><div><b>{title}</b><small>{value}</small></div><Icon name="chevron"/></div>; }
