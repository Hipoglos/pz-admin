import { useState, useEffect } from 'react';
import { players } from '../lib/api';
import toast from 'react-hot-toast';

const PERKS = ['Strength','Fitness','Sprinting','Lightfooted','Nimble','Sneaking','Axe','Blunt','SmallBlunt','LongBlade','SmallBlade','Spear','Maintenance','Carpentry','Cooking','Farming','FirstAid','Mechanics','MetalWelding','Electricity','Tailoring','Aiming','Reloading','Fishing','Trapping','PlantTending','Foraging'];
const ACCESS_LEVELS = ['none','observer','gm','overseer','moderator','admin'];

const QUICK_ITEMS = [
  { label:'🔫 Pistol',        module:'Base', item:'Pistol' },
  { label:'🔫 Shotgun',       module:'Base', item:'Shotgun' },
  { label:'🗡️ Katana',        module:'Base', item:'Katana' },
  { label:'🪓 Axe',           module:'Base', item:'Axe' },
  { label:'🔦 Flashlight',    module:'Base', item:'FlashLight' },
  { label:'🩹 Bandage',       module:'Base', item:'Bandage' },
  { label:'💊 Painkillers',   module:'Base', item:'Painkillers' },
  { label:'🥫 Tinned Beans',  module:'Base', item:'TinnedBeans' },
  { label:'🎒 ALICE Pack',    module:'Base', item:'Bag_ALICEpack' },
  { label:'⛽ Gas Can',       module:'Base', item:'PetrolCan' },
  { label:'🔋 Battery',       module:'Base', item:'Battery' },
  { label:'🧰 First Aid Kit', module:'Base', item:'FirstAidKit' },
];

function Modal({ title, onClose, children }) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
      <div style={{ background:'var(--bg-panel)', border:'1px solid var(--border-bright)', padding:28, width:'100%', maxWidth:460, position:'relative' }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.62rem', color:'var(--green)', letterSpacing:'0.2em', marginBottom:16 }}>◢ {title}</div>
        {children}
        <button onClick={onClose} style={{ position:'absolute', top:14, right:14, background:'transparent', border:'none', color:'var(--text-dim)', fontSize:'1.1rem', cursor:'pointer' }}>✕</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type='text', options, placeholder }) {
  const s = { width:'100%', padding:'9px 12px', background:'var(--bg-dark)', border:'1px solid var(--border)', color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontSize:'0.85rem', outline:'none', marginTop:5, marginBottom:12 };
  return (
    <div>
      <label style={{ fontFamily:'var(--font-mono)', fontSize:'0.6rem', color:'var(--text-secondary)', letterSpacing:'0.1em' }}>{label}</label>
      {options
        ? <select value={value} onChange={e=>onChange(e.target.value)} style={{...s,appearance:'none'}}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>
        : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s}
            onFocus={e=>e.target.style.borderColor='var(--green)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
      }
    </div>
  );
}

function GreenBtn({ label, onClick }) {
  return <button onClick={onClick} style={{ padding:'9px 20px', background:'var(--green)', color:'var(--bg-dark)', border:'none', fontFamily:'var(--font-mono)', fontSize:'0.78rem', fontWeight:700, cursor:'pointer' }}>{label}</button>;
}
function RedBtn({ label, onClick }) {
  return <button onClick={onClick} style={{ padding:'9px 20px', background:'var(--red-dim)', color:'#fff', border:'none', fontFamily:'var(--font-mono)', fontSize:'0.78rem', fontWeight:700, cursor:'pointer' }}>{label}</button>;
}

export default function Players() {
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // { type, player }
  const [form,    setForm]    = useState({});

  const load = async () => {
    try { const r = await players.list(); setList(r.data.players || []); }
    catch { toast.error('Failed to fetch players'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const i = setInterval(load, 20000); return ()=>clearInterval(i); }, []);

  const open  = (type, player) => { setModal({ type, player }); setForm({}); };
  const close = () => setModal(null);

  const run = async (fn, msg) => {
    try {
      const r = await fn();
      if (r.data?.success !== false) { toast.success(msg); close(); load(); }
      else toast.error(r.data?.error || 'Failed');
    } catch (e) { toast.error(e.response?.data?.error || 'Error'); }
  };

  const f = (k) => form[k] || '';
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ padding:28, animation:'fadeIn 0.3s ease' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:24 }}>
        <h1 style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'1.8rem' }}>PLAYERS</h1>
        <button onClick={load} style={{ padding:'6px 14px', background:'transparent', border:'1px solid var(--border)', color:'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:'0.68rem', cursor:'pointer' }}>↻ REFRESH</button>
      </div>

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
        <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', fontFamily:'var(--font-mono)', fontSize:'0.6rem', color:'var(--text-dim)' }}>
          {loading ? 'LOADING...' : `${list.length} PLAYER(S) ONLINE`}
        </div>
        {!loading && list.length === 0 && (
          <div style={{ padding:32, textAlign:'center', fontFamily:'var(--font-mono)', color:'var(--text-dim)' }}>No players online</div>
        )}
        {list.map(p => (
          <div key={p.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid var(--border)' }}
            onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 5px var(--green)' }} />
              <span style={{ fontFamily:'var(--font-ui)', fontWeight:600 }}>{p.name}</span>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {[['ITEM','item'],['XP','xp'],['ACCESS','access'],['TP','teleport'],['KICK','kick'],['BAN','ban']].map(([l,t]) => (
                <button key={t} onClick={()=>open(t,p)} style={{
                  padding:'4px 10px', background:'transparent', cursor:'pointer',
                  border:`1px solid ${t==='ban'?'var(--red-dim)':t==='kick'?'#5a3a1a':'var(--border)'}`,
                  color:t==='ban'?'var(--red)':t==='kick'?'var(--amber)':'var(--text-secondary)',
                  fontFamily:'var(--font-mono)', fontSize:'0.62rem',
                }}>{l}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ITEM MODAL */}
      {modal?.type === 'item' && (
        <Modal title={`GIVE ITEM — ${modal.player.name}`} onClose={close}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
            {QUICK_ITEMS.map(it => (
              <button key={it.item} onClick={()=>setForm({module:it.module,item:it.item,count:'1'})}
                style={{ padding:'9px', background:f('item')===it.item?'var(--green-glow)':'var(--bg-dark)', border:`1px solid ${f('item')===it.item?'var(--green)':'var(--border)'}`, color:'var(--text-primary)', fontFamily:'var(--font-ui)', fontSize:'0.82rem', cursor:'pointer' }}>
                {it.label}
              </button>
            ))}
          </div>
          <Field label="MODULE"    value={f('module')} onChange={v=>set('module',v)} placeholder="Base" />
          <Field label="ITEM NAME" value={f('item')}   onChange={v=>set('item',v)}   placeholder="Axe" />
          <Field label="COUNT"     value={f('count')||'1'} onChange={v=>set('count',v)} type="number" />
          <GreenBtn label="GIVE ITEM" onClick={()=>run(()=>players.giveItem(modal.player.name,f('module')||'Base',f('item')||'Axe',f('count')||1),`Item given to ${modal.player.name}`)} />
        </Modal>
      )}

      {/* XP MODAL */}
      {modal?.type === 'xp' && (
        <Modal title={`GIVE XP — ${modal.player.name}`} onClose={close}>
          <Field label="PERK"   value={f('perk')||PERKS[0]} onChange={v=>set('perk',v)} options={PERKS} />
          <Field label="AMOUNT" value={f('xp')||'100'}       onChange={v=>set('xp',v)}   type="number" />
          <GreenBtn label="GIVE XP" onClick={()=>run(()=>players.giveXp(modal.player.name,f('perk')||PERKS[0],f('xp')||100),`XP given to ${modal.player.name}`)} />
        </Modal>
      )}

      {/* ACCESS MODAL */}
      {modal?.type === 'access' && (
        <Modal title={`SET ACCESS — ${modal.player.name}`} onClose={close}>
          <Field label="LEVEL" value={f('level')||'none'} onChange={v=>set('level',v)} options={ACCESS_LEVELS} />
          <GreenBtn label="SET" onClick={()=>run(()=>players.setAccessLevel(modal.player.name,f('level')||'none'),`Access updated for ${modal.player.name}`)} />
        </Modal>
      )}

      {/* TELEPORT MODAL */}
      {modal?.type === 'teleport' && (
        <Modal title={`TELEPORT — ${modal.player.name}`} onClose={close}>
          <Field label="TELEPORT TO (username)" value={f('target')} onChange={v=>set('target',v)} placeholder="OtherPlayer" />
          <GreenBtn label="TELEPORT" onClick={()=>run(()=>players.teleport(modal.player.name,f('target')),`${modal.player.name} teleported`)} />
        </Modal>
      )}

      {/* KICK MODAL */}
      {modal?.type === 'kick' && (
        <Modal title={`KICK — ${modal.player.name}`} onClose={close}>
          <Field label="REASON (optional)" value={f('reason')} onChange={v=>set('reason',v)} placeholder="Breaking rules" />
          <RedBtn label="KICK" onClick={()=>run(()=>players.kick(modal.player.name,f('reason')),`${modal.player.name} kicked`)} />
        </Modal>
      )}

      {/* BAN MODAL */}
      {modal?.type === 'ban' && (
        <Modal title={`BAN — ${modal.player.name}`} onClose={close}>
          <Field label="REASON (optional)" value={f('reason')} onChange={v=>set('reason',v)} placeholder="Cheating" />
          <div style={{ padding:'9px 12px', background:'rgba(220,38,38,0.08)', border:'1px solid var(--red-dim)', marginBottom:12, fontFamily:'var(--font-mono)', fontSize:'0.68rem', color:'var(--red)' }}>
            ⚠ This permanently bans the player.
          </div>
          <RedBtn label="BAN" onClick={()=>run(()=>players.ban(modal.player.name,f('reason')),`${modal.player.name} banned`)} />
        </Modal>
      )}
    </div>
  );
}
