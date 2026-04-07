import { useState, useEffect, useCallback, useRef } from 'react';
import { players } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';

// ─────────────────────────────────────────────────────────────────────────────
//  PZ Live Map
//
//  Player positions are read from a JSON file written by the ZM_PlayerTracker
//  Lua mod (included in /game-server/mods/). The backend watches this file and
//  exposes the data via /api/players/positions.
//
//  Map rendering uses Leaflet with CRS.Simple so PZ world coordinates map
//  directly to pixel coordinates. Without tiles installed a coordinate grid
//  is shown instead.
// ─────────────────────────────────────────────────────────────────────────────

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

// Load Leaflet dynamically (avoid SSR / build issues)
function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) { resolve(window.L); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = LEAFLET_CSS;
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
}

function createMarkerIcon(L, status, name) {
  const colors = { online: '#4ade80', offline: '#9ca3af', dead: '#ef4444' };
  const color = colors[status] || colors.offline;
  return L.divIcon({
    className: 'pz-marker',
    html: `<div style="display:flex;align-items:center;gap:5px;white-space:nowrap;">
      <div style="width:14px;height:14px;min-width:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 6px ${color};"></div>
      <span style="font-size:12px;font-weight:600;color:${color};text-shadow:0 0 4px rgba(0,0,0,0.9);">${name}</span>
    </div>`,
    iconSize: [140, 20],
    iconAnchor: [9, 10],
    popupAnchor: [0, -12],
  });
}

function addCoordinateGrid(L, map) {
  const style = { color: '#2a3a2a', weight: 0.5, opacity: 0.7 };
  for (let c = 0; c <= 20000; c += 1000) {
    L.polyline([[-0, c], [-20000, c]], style).addTo(map);
    L.polyline([[-c, 0], [-c, 20000]], style).addTo(map);
  }
  [2000, 4000, 6000, 8000, 10000, 12000].forEach(x => {
    [2000, 4000, 6000, 8000, 10000, 12000].forEach(y => {
      L.marker([-y, x], {
        icon: L.divIcon({
          className: '',
          html: `<span style="font-size:9px;color:#2a3a2a;white-space:nowrap;">${x},${y}</span>`,
          iconSize: [50, 12], iconAnchor: [25, 6],
        }),
        interactive: false,
      }).addTo(map);
    });
  });
}

export default function MapPage() {
  const mapRef       = useRef(null);
  const leafletRef   = useRef(null);
  const markersRef   = useRef(null);
  const mapReadyRef  = useRef(false);

  const [positions, setPositions]   = useState([]);
  const [showOffline, setShowOffline] = useState(false);
  const [mapReady, setMapReady]     = useState(false);

  // ── Fetch positions ─────────────────────────────────────────────────────────
  const fetchPositions = useCallback(async () => {
    try {
      const r = await players.positions();
      setPositions(r.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPositions();
    const i = setInterval(fetchPositions, 10000);
    return () => clearInterval(i);
  }, [fetchPositions]);

  const onWsMessage = useCallback((msg) => {
    if (msg.type === 'player_positions') setPositions(msg.data || []);
  }, []);
  useWebSocket(onWsMessage);

  // ── Init Leaflet map ────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapReadyRef.current) return;
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !mapRef.current || mapReadyRef.current) return;

      leafletRef.current = L;
      mapReadyRef.current = true;

      const map = L.map(mapRef.current, {
        crs: L.CRS.Simple,
        minZoom: -4,
        maxZoom: 4,
        zoomControl: true,
        attributionControl: false,
      });

      // Center on Knox County (roughly 7000, 6000)
      map.setView([-6000, 7000], -2);

      // Try official PZ map tiles (CORS permitting)
      // These load fine in most setups; if they fail the grid still shows
      try {
        L.tileLayer('https://map.projectzomboid.com/minimap/{z}/{x}/{y}.png', {
          tileSize: 256, minZoom: -4, maxZoom: 0,
          noWrap: true, opacity: 0.85,
          errorTileUrl: '',
        }).addTo(map);
      } catch {}

      addCoordinateGrid(L, map);

      markersRef.current = L.layerGroup().addTo(map);
      leafletRef.current._pzMap = map;

      setMapReady(true);
    });

    return () => { cancelled = true; };
  }, []);

  // ── Update player markers when positions change ─────────────────────────────
  useEffect(() => {
    const L = leafletRef.current;
    const layer = markersRef.current;
    if (!L || !layer || !mapReady) return;

    layer.clearLayers();

    const visible = positions.filter(p =>
      p.x != null && p.y != null && (showOffline || p.online)
    );

    visible.forEach(p => {
      const status = p.online ? (p.is_dead ? 'dead' : 'online') : 'offline';
      const icon = createMarkerIcon(L, status, p.name || p.username || '?');
      const statusColors = { online:'#4ade80', offline:'#9ca3af', dead:'#ef4444' };
      const c = statusColors[status];

      L.marker([-p.y, p.x], { icon })
        .bindPopup(`
          <div style="min-width:140px;font-family:monospace;background:#0f1410;color:#d4e8d4;padding:8px;border:1px solid #2a3a2a;">
            <div style="font-weight:bold;color:${c};margin-bottom:4px;">${p.name || p.username}</div>
            <div style="font-size:11px;color:#7a9a7a;">X: ${Math.round(p.x)}  Y: ${Math.round(p.y)}</div>
            <div style="font-size:11px;color:${c};margin-top:4px;">● ${status.toUpperCase()}</div>
            ${p.lastSeen ? `<div style="font-size:10px;color:#4a6a4a;margin-top:2px;">${new Date(p.lastSeen).toLocaleTimeString()}</div>` : ''}
          </div>
        `)
        .addTo(layer);
    });
  }, [positions, showOffline, mapReady]);

  const online = positions.filter(p => p.online);
  const visible = positions.filter(p => p.x != null && (showOffline || p.online));

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', animation:'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ padding:'16px 28px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'1.8rem', letterSpacing:'0.05em' }}>LIVE MAP</h1>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.62rem', color:'var(--text-dim)', marginTop:2 }}>
            Positions from server mod · updates every 10s · hover markers for details
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.7rem', color:'var(--green)' }}>
            ● {online.length} ONLINE · {visible.length} SHOWN
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'var(--font-mono)', fontSize:'0.7rem', color:'var(--text-secondary)', cursor:'pointer' }}>
            <input type="checkbox" checked={showOffline} onChange={e => setShowOffline(e.target.checked)} />
            Show offline
          </label>
          <button onClick={fetchPositions} style={{
            padding:'6px 14px', background:'transparent', border:'1px solid var(--border)',
            color:'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:'0.68rem', cursor:'pointer',
          }}>↻ REFRESH</button>
        </div>
      </div>

      {/* Map container */}
      <div style={{ flex:1, position:'relative', background:'#0a0f0a' }}>
        <div ref={mapRef} style={{ width:'100%', height:'100%' }} />

        {/* Legend */}
        <div style={{
          position:'absolute', bottom:16, left:16, zIndex:1000,
          background:'var(--bg-panel)', border:'1px solid var(--border)', padding:'12px 16px',
        }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.62rem', color:'var(--green)', letterSpacing:'0.15em', marginBottom:10 }}>◢ LEGEND</div>
          {[
            { color:'var(--green)', label:'Online' },
            { color:'var(--red)',   label:'Dead' },
            { color:'#9ca3af',     label:'Offline (last seen)' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:color, boxShadow:`0 0 4px ${color}` }} />
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.68rem', color:'var(--text-secondary)' }}>{label}</span>
            </div>
          ))}
          <div style={{ marginTop:10, fontFamily:'var(--font-mono)', fontSize:'0.6rem', color:'var(--text-dim)', lineHeight:1.5, maxWidth:180 }}>
            Requires ZM_PlayerTracker<br/>mod on your PZ server.<br/>See /game-server/mods/
          </div>
        </div>

        {/* No players notice */}
        {mapReady && visible.length === 0 && (
          <div style={{
            position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            zIndex:999, background:'var(--bg-panel)', border:'1px solid var(--border)',
            padding:'20px 32px', textAlign:'center',
          }}>
            <div style={{ fontFamily:'var(--font-mono)', color:'var(--text-dim)', fontSize:'0.85rem' }}>
              No player positions available
            </div>
            <div style={{ fontFamily:'var(--font-mono)', color:'var(--text-dim)', fontSize:'0.65rem', marginTop:8, lineHeight:1.6 }}>
              Install the ZM_PlayerTracker mod on your PZ server<br/>
              to enable live player tracking.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
