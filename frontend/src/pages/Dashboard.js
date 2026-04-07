import { useState, useEffect } from 'react';
import { server, players } from '../lib/api';
import toast from 'react-hot-toast';

function Card({ title, children }) {
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', padding:20 }}>
      {title && <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.62rem', color:'var(--green)', letterSpacing:'0.18em', marginBottom:14 }}>◢ {title}</div>}
      {children}
    </div>
  );
}

function Btn({ label, onClick, danger }) {
  const [busy, setBusy] = useState(false);
  const click = async () => { setBusy(true); try { await onClick(); } finally { setBusy(false); } };
  return (
    <button onClick={click} disabled={busy} style={{
      padding:'9px 14px', background:'transparent', cursor: busy ? 'wait' : 'pointer',
      border:`1px solid ${danger ? 'var(--red-dim)' : 'var(--border-bright)'}`,
      color: danger ? 'var(--red)' : 'var(--text-primary)',
      fontFamily:'var(--font-mono)', fontSize:'0.72rem', opacity: busy ? 0.6 : 1,
    }}
    onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      {busy ? '...' : label}
    </button>
  );
}

export default function Dashboard() {
  const [status,     setStatus]     = useState(null);
  const [playerList, setPlayerList] = useState([]);
  const [message,    setMessage]    = useState('');

  const refresh = async () => {
    try {
      const [s, p] = await Promise.all([server.status(), players.list()]);
      setStatus(s.data);
      setPlayerList(p.data.players || []);
    } catch {}
  };

  useEffect(() => { refresh(); const i = setInterval(refresh, 30000); return () => clearInterval(i); }, []);

  const act = (fn, msg) => async () => {
    const r = await fn();
    r.data?.success !== false ? toast.success(msg) : toast.error(r.data?.error || 'Failed');
  };

  const sendMsg = async () => {
    if (!message.trim()) return;
    await server.broadcast(message);
    toast.success('Broadcast sent');
    setMessage('');
  };

  const Stat = ({ label, value, color='var(--green)' }) => (
    <div style={{ textAlign:'center', padding:16 }}>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.8rem', color, textShadow:`0 0 10px ${color}` }}>{value}</div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.6rem', color:'var(--text-secondary)', marginTop:4 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ padding:28, animation:'fadeIn 0.3s ease' }}>
      <h1 style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'1.8rem', marginBottom:24 }}>DASHBOARD</h1>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:20 }}>
        <Card><Stat label="PLAYERS ONLINE" value={playerList.length} /></Card>
        <Card><Stat label="RCON" value={status?.connected ? 'ONLINE' : 'OFFLINE'} color={status?.connected ? 'var(--green)' : 'var(--red)'} /></Card>
        <Card><Stat label="SERVER" value={status?.host || '—'} color="var(--amber)" /></Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card title="SERVER CONTROLS">
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            <Btn label="💾 SAVE"       onClick={act(server.save,      'World saved')} />
            <Btn label="🌧 RAIN ON"   onClick={act(server.startRain, 'Rain started')} />
            <Btn label="☀ RAIN OFF"  onClick={act(server.stopRain,  'Rain stopped')} />
            <Btn label="🚁 CHOPPER"  onClick={act(server.chopper,   'Chopper triggered')} />
            <Btn label="🔫 GUNSHOT"  onClick={act(server.gunshot,   'Gunshot triggered')} />
            <Btn label="🛑 SHUTDOWN" onClick={act(server.quit,      'Server shutting down...')} danger />
          </div>
        </Card>

        <Card title="BROADCAST MESSAGE">
          <div style={{ display:'flex', gap:8 }}>
            <input value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMsg()}
              placeholder="Message to all players..."
              style={{ flex:1, padding:'9px 12px', background:'var(--bg-dark)', border:'1px solid var(--border)', color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontSize:'0.85rem', outline:'none' }}
              onFocus={e=>e.target.style.borderColor='var(--green)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
            <button onClick={sendMsg} style={{ padding:'9px 16px', background:'var(--green)', color:'var(--bg-dark)', border:'none', fontFamily:'var(--font-mono)', fontSize:'0.75rem', fontWeight:700, cursor:'pointer' }}>SEND</button>
          </div>
        </Card>

        <Card title="ONLINE PLAYERS" style={{ gridColumn:'1 / -1' }}>
          {playerList.length === 0
            ? <div style={{ fontFamily:'var(--font-mono)', color:'var(--text-dim)', fontSize:'0.8rem' }}>No players online</div>
            : <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                {playerList.map(p => (
                  <div key={p.name} style={{ padding:'10px 14px', background:'var(--bg-dark)', border:'1px solid var(--border-bright)', display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 5px var(--green)' }} />
                    <span style={{ fontFamily:'var(--font-ui)', fontWeight:600 }}>{p.name}</span>
                  </div>
                ))}
              </div>
          }
        </Card>
      </div>
    </div>
  );
}
