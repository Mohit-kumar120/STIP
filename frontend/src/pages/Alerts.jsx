import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { useLiveEvents } from '../context/LiveContext';

const STATUSES = ['OPEN', 'INVESTIGATING', 'RESOLVED'];
const SEVS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export default function Alerts() {
  const { user } = useAuth();
  const canWrite = user.role === 'ADMIN' || user.role === 'ANALYST';

  const [status, setStatus] = useState('OPEN');
  const [severity, setSeverity] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const timer = useRef();

  const load = useCallback(() => {
    const params = { page, size: 15 };
    if (status) params.status = status;
    if (severity) params.severity = severity;
    api.get('/api/alerts', { params })
      .then((res) => { setData(res.data); setError(''); })
      .catch(() => setError('Could not load alerts'));
  }, [status, severity, page]);

  useEffect(load, [load]);

  // refetch shortly after any pushed event (debounced so bursts cause one reload)
  useLiveEvents(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(load, 400);
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  const act = async (fn) => {
    try { await fn(); load(); } catch { setError('Action failed'); }
  };
  const claim = (id) => act(() => api.post(`/api/alerts/${id}/claim`));
  const resolve = (id) => act(() => api.patch(`/api/alerts/${id}/status`, { status: 'RESOLVED' }));

  return (
    <>
      <h2>Alerts</h2>
      <div className="filters">
        <select value={status} onChange={(e) => { setPage(0); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={severity} onChange={(e) => { setPage(0); setSeverity(e.target.value); }}>
          <option value="">All severities</option>
          {SEVS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {!data ? <p>Loading...</p> : (
        <>
          <table>
            <thead>
              <tr><th>Severity</th><th>Title</th><th>Score</th><th>Status</th>
                  <th>Assigned</th><th>Created</th>{canWrite && <th />}</tr>
            </thead>
            <tbody>
              {data.content.map((a) => (
                <tr key={a.id}>
                  <td><Badge value={a.severity} /></td>
                  <td>{a.title}</td>
                  <td>{a.aiScore ?? '-'}</td>
                  <td><Badge value={a.status} /></td>
                  <td>{a.assignedTo || '-'}</td>
                  <td>{new Date(a.createdAt).toLocaleString()}</td>
                  {canWrite && (
                    <td className="actions">
                      {a.status === 'OPEN' && <button className="small" onClick={() => claim(a.id)}>Claim</button>}
                      {a.status !== 'RESOLVED' && <button className="small ghost" onClick={() => resolve(a.id)}>Resolve</button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {data.content.length === 0 && <p>No alerts match.</p>}
          <div className="pager">
            <button className="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button>
            <span>Page {data.page + 1} of {Math.max(data.totalPages, 1)} · {data.totalElements} total</span>
            <button className="ghost" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </>
      )}
    </>
  );
}