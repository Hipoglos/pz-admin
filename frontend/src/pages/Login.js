import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await login(username, password); navigate('/'); }
    catch { toast.error('Invalid credentials'); }
    finally { setLoading(false); }
  };

  const inputStyle = {
    width:'100%', padding:'11px 14px', background:'var(--bg-dark)',
    border:'1px solid var(--border)', color:'var(--text-primary)',
    fontFamily:'var(--font-mono)', fontSize:'0.9rem', outline:'none', marginTop:6, marginBottom:16,
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-dark)' }}>
      <div style={{ width:360, padding:36, background:'var(--bg-panel)', border:'1px solid var(--border)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontFamily:'var(--font-mono)', color:'var(--green)', fontSize:'0.65rem', letterSpacing:'0.2em' }}>PROJECT ZOMBOID</div>
          <div style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'1.8rem', marginTop:4 }}>ADMIN PANEL</div>
        </div>

        <form onSubmit={submit}>
          <label style={{ fontFamily:'var(--font-mono)', fontSize:'0.62rem', color:'var(--text-secondary)', letterSpacing:'0.12em' }}>USERNAME</label>
          <input type="text" value={username} onChange={e=>setUsername(e.target.value)} required style={inputStyle}
            onFocus={e=>e.target.style.borderColor='var(--green)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />

          <label style={{ fontFamily:'var(--font-mono)', fontSize:'0.62rem', color:'var(--text-secondary)', letterSpacing:'0.12em' }}>PASSWORD</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={inputStyle}
            onFocus={e=>e.target.style.borderColor='var(--green)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />

          <button type="submit" disabled={loading} style={{
            width:'100%', padding:'13px', background:'var(--green)', color:'var(--bg-dark)',
            border:'none', fontFamily:'var(--font-mono)', fontSize:'0.85rem', fontWeight:700,
            letterSpacing:'0.15em', cursor: loading ? 'wait' : 'pointer',
          }}>
            {loading ? 'AUTHENTICATING...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
