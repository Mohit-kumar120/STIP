import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/Badge';
import { useLiveEvents } from '../context/LiveContext';

const SEVS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const timer = useRef();

  const load = useCallback(
    () =>
      Promise.all([
        api.get('/api/stats'),
        api.get('/api/alerts', { params: { status: 'OPEN', size: 5 } }),
      ])
        .then(([s, a]) => {
          setStats(s.data);
          setAlerts(a.data.content);
          setError('');
        })
        .catch(() => setError('Could not load data')),
    []
  );

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);   // fallback if the socket is down
    return () => clearInterval(t);
  }, [load]);

  // refetch shortly after any pushed event (debounced so bursts cause one reload)
  useLiveEvents(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(load, 400);
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p>Loading...</p>;

  const max = Math.max(1, ...SEVS.map((s) => stats.indicatorsBySeverity[s] || 0));

  return (
    <>
      <h2>Overview</h2>
      <div className="cards">
        <div className="card"><span>Total indicators</span><b>{stats.totalIndicators}</b></div>
        <div className="card"><span>Open alerts</span><b>{stats.openAlerts}</b></div>
        <div className="card"><span>Investigating</span><b>{stats.investigatingAlerts}</b></div>
      </div>

      <h3>Indicators by severity</h3>
      <div className="bars">
        {SEVS.map((s) => {
          const n = stats.indicatorsBySeverity[s] || 0;
          return (
            <div className="bar-row" key={s}>
              <Badge value={s} />
              <div className="bar-track"><div className={`bar-fill f-${s}`} style={{ width: `${(n / max) * 100}%` }} /></div>
              <span>{n}</span>
            </div>
          );
        })}
      </div>

      <h3>Latest open alerts <Link to="/alerts" className="more">View all</Link></h3>
      {alerts.length === 0 ? <p>No open alerts.</p> : (
        <table>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id}>
                <td><Badge value={a.severity} /></td>
                <td>{a.title}</td>
                <td>{new Date(a.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}