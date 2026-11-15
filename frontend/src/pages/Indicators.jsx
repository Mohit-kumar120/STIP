import { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';

const TYPES = ['IP', 'DOMAIN', 'URL', 'HASH', 'CVE', 'EMAIL'];
const SEVS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const EMPTY = { type: '', severity: '', status: '', category: '', days: '', q: '' };

export default function Indicators() {
  const { user } = useAuth();
  const canWrite = user.role === 'ADMIN' || user.role === 'ANALYST';

  const [draft, setDraft] = useState(EMPTY);
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [nl, setNl] = useState('');
  const [asking, setAsking] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const params = { page, size: 15 };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get('/api/indicators', { params })
      .then((res) => { setData(res.data); setError(''); })
      .catch(() => setError('Could not load indicators'));
  }, [filters, page]);

  const applyManual = (e) => {
    e.preventDefault();
    setPage(0);
    setFallback(false);
    setFilters({ ...EMPTY, ...draft });
  };

  const clearAll = () => {
    setPage(0);
    setFallback(false);
    setDraft(EMPTY);
    setFilters(EMPTY);
    setNl('');
  };

  const askAI = async (e) => {
    e.preventDefault();
    if (!nl.trim()) return;
    setAsking(true);
    setError('');
    try {
      const { data: p } = await api.post('/api/indicators/parse-query', { query: nl });
      setFilters({
        type: (p.type || []).join(','),
        severity: (p.severity || []).join(','),
        status: p.status || '',
        category: p.category || '',
        days: p.days ? String(p.days) : '',
        q: p.text || '',
      });
      setDraft(EMPTY);
      setFallback(p.fallback);
      setPage(0);
    } catch {
      setError('AI search failed');
    } finally {
      setAsking(false);
    }
  };

  const markFalsePositive = async (id) => {
    await api.patch(`/api/indicators/${id}/status`, { status: 'FALSE_POSITIVE' });
    setData((d) => ({ ...d, content: d.content.map((i) => (i.id === id ? { ...i, status: 'FALSE_POSITIVE' } : i)) }));
  };

  const chips = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k, v]) => {
      if (k === 'days') return `Last ${v} days`;
      if (k === 'q') return `Text: ${v}`;
      return `${k[0].toUpperCase()}${k.slice(1)}: ${v.split(',').join(' or ')}`;
    });

  return (
    <>
      <h2>Indicators</h2>

      <form className="ask" onSubmit={askAI}>
        <input
          placeholder='Ask in plain English, e.g. "critical IPs from this week" or "Microsoft vulnerabilities"'
          value={nl}
          onChange={(e) => setNl(e.target.value)}
        />
        <button disabled={asking}>{asking ? 'Thinking...' : 'Ask AI'}</button>
      </form>

      <form className="filters" onSubmit={applyManual}>
        <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value })}>
          <option value="">All severities</option>
          {SEVS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input placeholder="Search text..." value={draft.q}
               onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
        <button>Apply</button>
      </form>

      {chips.length > 0 && (
        <div className="chips">
          <span>Showing:</span>
          {chips.map((c) => <span className="chip" key={c}>{c}</span>)}
          <button type="button" className="small ghost" onClick={clearAll}>Clear all</button>
        </div>
      )}
      {fallback && <p className="error">The AI was unavailable, so this is a plain text search.</p>}
      {error && <p className="error">{error}</p>}

      {!data ? <p>Loading...</p> : (
        <>
          <table>
            <thead>
              <tr><th>Type</th><th>Value</th><th>Severity</th><th>Conf.</th><th>Category</th>
                  <th>Source</th><th>Last seen</th><th>Status</th>{canWrite && <th />}</tr>
            </thead>
            <tbody>
              {data.content.map((i) => (
                <tr key={i.id}>
                  <td>{i.type}</td>
                  <td className="mono" title={i.description}>
                    {i.value}
                    {i.aiReasoning && <div className="ai-note">{i.aiReasoning}</div>}
                  </td>
                  <td><Badge value={i.severity} /></td>
                  <td>{i.confidenceScore ?? '-'}</td>
                  <td>{i.category}</td>
                  <td>{i.source}</td>
                  <td>{new Date(i.lastSeen).toLocaleString()}</td>
                  <td>{i.status}</td>
                  {canWrite && (
                    <td>
                      {i.status === 'ACTIVE' && (
                        <button className="small ghost" onClick={() => markFalsePositive(i.id)}>False positive</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {data.content.length === 0 && <p>No indicators match.</p>}
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