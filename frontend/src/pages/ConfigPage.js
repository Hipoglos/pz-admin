import { useState, useEffect } from 'react';
import { config } from '../lib/api';
import toast from 'react-hot-toast';

const KNOWN = {
  PublicName:          { label:'Server Name',     group:'General' },
  PublicDescription:   { label:'Description',     group:'General' },
  MaxPlayers:          { label:'Max Players',     group:'General', type:'number' },
  PVP:                 { label:'PVP',             group:'General', type:'bool' },
  Password:            { label:'Password',        group:'General' },
  GlobalChat:          { label:'Global Chat',     group:'General', type:'bool' },
  ServerWelcomeMessage:{ label:'Welcome Message', group:'General' },
  PauseEmpty:          { label:'Pause When Empty',group:'General', type:'bool' },
  Mods:                { label:'Active Mods',     group:'World' },
  Map:                 { label:'Map',             group:'World' },
  DefaultPort:         { label:'Game Port',       group:'Network', type:'number' },
  RCONPort:            { label:'RCON Port',       group:'Network', type:'number' },
  SaveWorldEveryMinutes:{ label:'Auto-Save (min)',group:'Saving', type:'number' },
  BackupsOnStart:      { label:'Backup On Start', group:'Saving', type:'bool' },
};

export default function ConfigPage() {
  const [files,    setFiles]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [parsed,   setParsed]   = useState({});
  const [raw,      setRaw]      = useState('');
  const [edits,    setEdits]    = useState({});
  const [mode,     setMode]     = useState('visual'); // 'visual' | 'raw'
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    config.files().then(r => {
      const f = r.data.files || [];
      setFiles(f);
      if (f.length) loadFile(f[0].name);
    }).catch(() => toast.error('Cannot load config files'));
  }, []);

  const loadFile = async (name) => {
    setEdits({});
    try {
      const r = await config.getFile(name);
      setSelected(name);
      setParsed(r.data.parsed || {});
      setRaw(r.data.content || '');
    } catch { toast.error('Failed to load file'); }
  };

  const save = async () => {
    setSaving(true);
    try {
      if (mode === 'raw') await config.saveRaw(selected, raw);
      else await config.save(selected, edits);
      toast.success('Saved! Restart server to apply.');
      setEdits({});
      loadFile(selected);
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const val = (k) => k in edits ? edits[k] : (parsed[k] ?? '');
  const set = (k, v) => setEdits(e => ({ ...e, [k]: v }));

  const groups = {};
  Object.keys(KNOWN).forEach(k => {
    if (!(k in parsed)) return;
    const g = KNOWN[k].group;
    if (!groups[g]) groups[g] = [];
    groups[g].push(k);
  });
  const others = Object.keys(parsed).filter(k => !(k in KNOWN));

  const BoolToggle = ({ k }) => {
    const on = val(k) === 'true';
    return (
      <div onClick={() => set(k, on ? 'false' : 'true')} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
        <div style={{ width:36, height:20, borderRadius:10, background: on ? 'var(--green)' : 'var(--border)', position:'relative', transition:'background 0.2s' }}>
          <div style={{ position:'absolute', top:3, left: on ? 17 : 3, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
        </div>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.72rem', color: on ? 'var(--green)' : 'var(--text-dim)' }}>{on ? 'ON' : 'OFF'}</span>
      </div>
    );
  };

  const inputStyle = (k) => ({
    width:'100%', padding:'7px 10px', background: k in edits ? 'rgba(74,222,128,0.04)' : 'var(--bg-dark)',
    border:`1px solid ${k in edits ? 'var(--green)' : 'var(--border)'}`,
    color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontSize:'0.8rem', outline:'none',
  });

  return (
    <div style={{ display:'flex', height:'100%', animation:'fadeIn 0.3s ease' }}>
      {/* Sidebar */}
      <div style={{ width:190, borderRight:'1px solid var(--border)', background:'var(--bg-panel)', flexShrink:0, padding:'12px 0' }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.6rem', color:'var(--green)', letterSpacing:'0.18em', padding:'0 14px 10px' }}>◢ FILES</div>
        {files.length === 0 && <div style={{ padding:'0 14px', fontFamily:'var(--font-mono)', fontSize:'0.68rem', color:'var(--text-dim)' }}>No .ini files found</div>}
        {files.map(f => (
          <button key={f.name} onClick={()=>loadFile(f.name)} style={{
            width:'100%', padding:'9px 14px', textAlign:'left', background: selected===f.name ? 'var(--green-glow)' : 'transparent',
            borderLeft:`2px solid ${selected===f.name ? 'var(--green)' : 'transparent'}`, border:'none',
            color: selected===f.name ? 'var(--green)' : 'var(--text-secondary)',
            fontFamily:'var(--font-mono)', fontSize:'0.7rem', cursor:'pointer',
          }}>{f.name}</button>
        ))}
      </div>

      {/* Editor */}
      <div style={{ flex:1, overflow:'auto', padding:24 }}>
        {!selected
          ? <div style={{ fontFamily:'var(--font-mono)', color:'var(--text-dim)' }}>Select a file</div>
          : <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <div>
                  <h2 style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'1.3rem' }}>{selected}</h2>
                  {Object.keys(edits).length > 0 && <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.62rem', color:'var(--amber)' }}>● {Object.keys(edits).length} unsaved change(s)</span>}
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <div style={{ display:'flex', border:'1px solid var(--border)', overflow:'hidden' }}>
                    {['visual','raw'].map(m => (
                      <button key={m} onClick={()=>setMode(m)} style={{ padding:'6px 14px', background: mode===m ? 'var(--green)' : 'transparent', color: mode===m ? 'var(--bg-dark)' : 'var(--text-secondary)', border:'none', fontFamily:'var(--font-mono)', fontSize:'0.68rem', cursor:'pointer' }}>{m.toUpperCase()}</button>
                    ))}
                  </div>
                  <button onClick={save} disabled={saving} style={{ padding:'7px 18px', background:'var(--green)', color:'var(--bg-dark)', border:'none', fontFamily:'var(--font-mono)', fontSize:'0.75rem', fontWeight:700, cursor:'pointer' }}>
                    {saving ? 'SAVING...' : 'SAVE'}
                  </button>
                </div>
              </div>

              {mode === 'raw'
                ? <textarea value={raw} onChange={e=>setRaw(e.target.value)} style={{ width:'100%', height:'calc(100vh - 200px)', background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontSize:'0.8rem', padding:14, outline:'none', resize:'vertical', lineHeight:1.6 }} />
                : <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                    {Object.entries(groups).map(([group, keys]) => (
                      <div key={group} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', padding:18 }}>
                        <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.6rem', color:'var(--green)', letterSpacing:'0.18em', marginBottom:14 }}>◢ {group.toUpperCase()}</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 20px' }}>
                          {keys.map(k => {
                            const m = KNOWN[k];
                            return (
                              <div key={k}>
                                <label style={{ fontFamily:'var(--font-mono)', fontSize:'0.6rem', color:'var(--text-secondary)', letterSpacing:'0.08em', display:'block', marginBottom:5 }}>{m.label}</label>
                                {m.type === 'bool'
                                  ? <BoolToggle k={k} />
                                  : <input type={m.type||'text'} value={val(k)} onChange={e=>set(k,e.target.value)} style={inputStyle(k)} />
                                }
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {others.length > 0 && (
                      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', padding:18 }}>
                        <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.6rem', color:'var(--text-dim)', letterSpacing:'0.18em', marginBottom:14 }}>◢ OTHER SETTINGS</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 20px' }}>
                          {others.map(k => (
                            <div key={k}>
                              <label style={{ fontFamily:'var(--font-mono)', fontSize:'0.6rem', color:'var(--text-dim)', display:'block', marginBottom:4 }}>{k}</label>
                              <input value={val(k)} onChange={e=>set(k,e.target.value)} style={inputStyle(k)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
              }
            </>
        }
      </div>
    </div>
  );
}
