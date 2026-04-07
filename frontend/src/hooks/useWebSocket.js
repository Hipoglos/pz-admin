import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL || `ws://${window.location.hostname}:3001/ws`;

export function useWebSocket(onMessage) {
  const ws = useRef(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    const token = localStorage.getItem('pz_token');
    if (!token) return;
    const url = `${WS_URL}?token=${token}`;
    ws.current = new WebSocket(url);

    ws.current.onopen = () => setConnected(true);
    ws.current.onclose = () => {
      setConnected(false);
      setTimeout(connect, 3000); // reconnect
    };
    ws.current.onerror = () => ws.current?.close();
    ws.current.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)); } catch {}
    };
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);

  return { connected };
}
