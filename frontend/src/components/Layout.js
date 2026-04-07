import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import { server } from '../lib/api';

const NAV = [
  { to: '/',        label: 'Dashboard' },
  { to: '/players', label: 'Players'   },
  { to: '/config',  label: 'Config'    },
  { to: '/console', label: 'Console'   },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rconOk, setRconOk] = useState(null);

  useEffect(() => {
    const check = () => server.status().then(r => setRconOk(r.data.connected)).catch(() => setRconOk(false));
    check();
    const i = setInterval(check, 15000);
    return () => clearInterval(i);
  }, []);

  const dot = rconOk === true ? 'var(--green)' : rconOk === false ? 'var(--red)' : 'var(--amber)';
  const label = rconOk === true ? 'RCON ONLINE' : rconOk === false ? 'RCON OFFLINE' : 'CONNECTING';

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <aside style={{ width:200, background:'var(--bg-panel)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink:0 }}>
        {/* Logo */}
        <div style={{ padding:'20px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontFamily:'var(--font-mono)', color:'var(--green)', fontSize:'0.65rem', letterSpacing:'0.15em' }}>PROJECT ZOMBOID</div>
          <div style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'1.2rem', marginTop:2 }}>ADMIN</div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:dot }} />
            <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.6rem', color:'var(--text-secondary)' }}>{label}</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px 0' }}>
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to==='/'} style={({ isActive }) => ({
              display:'block', padding:'10px 16px',
              color: isActive ? 'var(--green)' : 'var(--text-secondary)',
              background: isActive ? 'var(--green-glow)' : 'transparent',
              borderLeft: `2px solid ${isActive ? 'var(--green)' : 'transparent'}`,
              textDecoration:'none', fontFamily:'var(--font-ui)', fontWeight:600,
              fontSize:'0.95rem', letterSpacing:'0.05em',
            })}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.6rem', color:'var(--text-dim)', marginBottom:10 }}>
            {user?.username?.toUpperCase()}
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            width:'100%', padding:'7px', background:'transparent',
            border:'1px solid var(--border)', color:'var(--text-secondary)',
            fontFamily:'var(--font-mono)', fontSize:'0.65rem', cursor:'pointer',
          }}
          onMouseEnter={e => { e.target.style.borderColor='var(--red)'; e.target.style.color='var(--red)'; }}
          onMouseLeave={e => { e.target.style.borderColor='var(--border)'; e.target.style.color='var(--text-secondary)'; }}>
            LOGOUT
          </button>
        </div>
      </aside>

      <main style={{ flex:1, overflow:'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
