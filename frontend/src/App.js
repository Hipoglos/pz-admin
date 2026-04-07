import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout    from './components/Layout';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Players   from './pages/Players';
import ConfigPage from './pages/ConfigPage';
import Console   from './pages/Console';

function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--green)', fontFamily:'var(--font-mono)' }}>
      LOADING...
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background:'#141a14', color:'#d4e8d4', border:'1px solid #2a3a2a', fontFamily:'Rajdhani, sans-serif' },
          success: { iconTheme: { primary:'#4ade80', secondary:'#0f1410' } },
          error:   { iconTheme: { primary:'#f87171', secondary:'#0f1410' } },
        }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Private><Layout /></Private>}>
            <Route index         element={<Dashboard />} />
            <Route path="players" element={<Players />} />
            <Route path="config"  element={<ConfigPage />} />
            <Route path="console" element={<Console />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
