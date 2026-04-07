import { useState, useRef, useEffect } from 'react';
import { server } from '../lib/api';

const QUICK = [
  { label:'Players', cmd:'players' },
  { label:'Save',    cmd:'save' },
  { label:'Chopper', cmd:'chopper' },
  { label:'Gunshot', cmd:'gunshot' },
  { label:'Rain On', cmd:'startrain' },
  { label:'Rain Off',cmd:'stoprain' },
];

export default function Console() {
  const [log,     setLog]     = useState([{ t:'info', s:'PZ Admin Console — type any RCON command and press Enter.' }]);
  const [input,   setInput]   = useState('');
  const [history, setHistory] = useState([]);
  const [hIdx,    setHIdx]    = useState(-1);
  const [busy,    setBusy]    = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [log]);

  const send = async (cmd) => {
    if (!cmd.trim()) return;
    setLog(l => [...l, { t:'cmd', s:`> ${cmd}` }]);
    setHistory(h => [cmd, ...h.slice(0,49)]);
    setHIdx(-1); setInput(''); setBusy(true);
    try {
      const r = await server.command(cmd);
      setLog(l => [...l, { t: r.data.success ? 'ok' : 'err', s: r.data.response || r.data.error || '(no output)' }]);
    } catch (e) {
      setLog(l => [...l, { t:'err', s: e.response?.data?.error || 'Connection error' }]);
    } finally { setBusy(false); }
  };

  const onKey = (e) => {
    if (e.key === 'Enter') { send(input); return; }
    if (e.key === 'ArrowUp')   { const i = Math.min(hIdx+1, history.length-1); setHIdx(i); setInput(history[i]||''); }
    if (e.key === 'ArrowDown') { const i = Math.max(hIdx-1, -1);               setHIdx(i); setInput(i===-1?'':history[i]); }
  };

  const colors = { info:'var(--text-dim)', cmd:'var(--green)', ok:'var(--text-primary)', err:'var(--red)' };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', animation:'fadeIn 0.3s ease' }}>
      <div style={{ padding:'16px 28px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <h1 style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'1.8rem' }}>RCON CONSOLE</h1>
        <button onClick={()=>setLog([])} style={{ padding:'5px 12px', background:'transparent', border:'1px solid var(--border)', color:'var(--text-dim)', fontFamily:'var(--font-mono)', fontSize:'0.65rem', cursor:'pointer' }}>CLEAR</button>
      </div>

      <div style={{ padding:'10px 28px', borderBottom:'1px solid var(--border)', display:'flex', gap:8, flexWrap:'wrap', background:'var(--bg-panel)', flexShrink:0 }}>
        {QUICK.map(({ label, cmd }) => (
          <button key={cmd} onClick={()=>send(cmd)} style={{ padding:'4px 12px', background:'transparent', border:'1px solid var(--border)', color:'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:'0.65rem', cursor:'pointer' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--green)'; e.currentTarget.style.color='var(--green)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)'; }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflow:'auto', padding:'14px 28px', fontFamily:'var(--font-mono)', fontSize:'0.82rem', lineHeight:1.7 }}>
        {log.map((e,i) => <div key={i} style={{ color:colors[e.t], whiteSpace:'pre-wrap', wordBreak:'break-all' }}>{e.s}</div>)}
        {busy && <div style={{ color:'var(--text-dim)' }}>...</div>}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding:'14px 28px', borderTop:'1px solid var(--border)', background:'var(--bg-panel)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, border:'1px solid var(--border-bright)', padding:'9px 14px', background:'var(--bg-dark)' }}>
          <span style={{ color:'var(--green)', fontFamily:'var(--font-mono)', userSelect:'none' }}>▶</span>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey}
            placeholder="RCON command... (↑↓ history)" disabled={busy} autoFocus
            style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontSize:'0.9rem' }} />
          <button onClick={()=>send(input)} disabled={busy} style={{ padding:'3px 12px', background:'var(--green)', color:'var(--bg-dark)', border:'none', fontFamily:'var(--font-mono)', fontSize:'0.68rem', fontWeight:700, cursor:'pointer' }}>SEND</button>
        </div>
      </div>
    </div>
  );
}
