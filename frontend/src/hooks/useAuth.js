import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pz_token');
    if (!token) { setLoading(false); return; }
    auth.verify()
      .then(r => setUser({ username: r.data.username, token }))
      .catch(() => localStorage.removeItem('pz_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const r = await auth.login(username, password);
    localStorage.setItem('pz_token', r.data.token);
    setUser({ username: r.data.username, token: r.data.token });
  };

  const logout = () => { localStorage.removeItem('pz_token'); setUser(null); };

  return <Ctx.Provider value={{ user, login, logout, loading }}>{children}</Ctx.Provider>;
}

export function useAuth() { return useContext(Ctx); }
