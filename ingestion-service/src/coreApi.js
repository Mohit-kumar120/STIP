const cfg = require('./config');

let token = null;

async function login() {
  const res = await fetch(`${cfg.coreApiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cfg.email, password: cfg.password }),
  });
  if (!res.ok) throw new Error(`Core API login failed (${res.status})`);
  token = (await res.json()).token;
}

async function authed(path, options = {}, retry = true) {
  if (!token) await login();
  const res = await fetch(`${cfg.coreApiUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 && retry) {
    token = null;
    return authed(path, options, false);
  }
  if (res.status === 403) throw new Error('Ingestion user is not ANALYST/ADMIN');
  if (!res.ok) throw new Error(`${options.method || 'GET'} ${path} failed (${res.status})`);
  return res.json();
}

const upsertIndicator = (body) =>
  authed('/api/indicators', { method: 'POST', body: JSON.stringify(body) });

const listUnenriched = async (size) =>
  (await authed(`/api/indicators?unenriched=true&size=${size}`)).content;

const setAiNote = (id, aiReasoning) =>
  authed(`/api/indicators/${id}/ai`, { method: 'PATCH', body: JSON.stringify({ aiReasoning }) });

module.exports = { upsertIndicator, listUnenriched, setAiNote };