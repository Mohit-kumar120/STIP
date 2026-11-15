const URL = 'https://feodotracker.abuse.ch/downloads/ipblocklist.json';

async function fetchFeodo({ max }) {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Feodo HTTP ${res.status}`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : data.blocklist || [];

  return list
    .sort((a, b) => new Date(b.last_online || 0) - new Date(a.last_online || 0))
    .slice(0, max)
    .map((e) => ({
      type: 'IP',
      value: e.ip_address,
      source: 'abuse.ch Feodo',
      severity: e.status === 'online' ? 'CRITICAL' : 'HIGH',
      confidenceScore: 90,
      category: 'c2',
      tags: ['botnet-c2', e.malware, e.country].filter(Boolean).map((t) => String(t).slice(0, 40)),
      description: `Botnet C2 (${e.malware || 'unknown'}) on port ${e.port}, status ${e.status}, last online ${e.last_online || 'n/a'}`,
    }));
}

module.exports = { fetchFeodo };