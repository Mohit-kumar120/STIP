import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const LiveContext = createContext(null);

const API = import.meta.env.VITE_CORE_API_URL || 'http://localhost:8081';
const WS_URL = API.replace(/^http/, 'ws') + '/ws/alerts';

export function LiveProvider({ children }) {
  const [status, setStatus] = useState('connecting');   // connecting | live | offline
  const [toasts, setToasts] = useState([]);
  const listeners = useRef(new Set());

  const subscribe = useCallback((fn) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  useEffect(() => {
    let ws;
    let timer;
    let retry = 0;
    let closed = false;

    const connect = () => {
      setStatus('connecting');
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth', token: localStorage.getItem('stip_token') }));
      };

      ws.onmessage = (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }
        if (msg.type === 'auth.ok') {
          retry = 0;
          setStatus('live');
          return;
        }
        listeners.current.forEach((fn) => fn(msg));
        if (msg.type === 'alert.created' && msg.alert) {
          const id = `${Date.now()}-${Math.random()}`;
          setToasts((t) => [...t, { id, severity: msg.alert.severity, title: msg.alert.title }].slice(-4));
          setTimeout(() => dismiss(id), 8000);
        }
      };

      ws.onclose = (e) => {
        if (closed) return;
        setStatus('offline');
        if (e.code === 1008) return;                     // rejected (bad or expired token): don't hammer the server
        timer = setTimeout(connect, Math.min(15000, 1000 * 2 ** retry++));
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      ws?.close();
    };
  }, [dismiss]);

  return (
    <LiveContext.Provider value={{ status, toasts, dismiss, subscribe }}>
      {children}
    </LiveContext.Provider>
  );
}

export const useLive = () => useContext(LiveContext);

/** Run a function whenever the server pushes an event. */
export function useLiveEvents(handler) {
  const { subscribe } = useLive();
  const ref = useRef(handler);
  useEffect(() => { ref.current = handler; });
  useEffect(() => subscribe((msg) => ref.current(msg)), [subscribe]);
}