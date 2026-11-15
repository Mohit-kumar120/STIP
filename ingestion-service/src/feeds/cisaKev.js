const URLS = [
  'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
  'https://raw.githubusercontent.com/cisagov/kev-data/main/known_exploited_vulnerabilities.json',
];

async function download() {
  const errors = [];
  for (const url of URLS) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; STIP-ingestion/1.0)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      const host = new URL(url).hostname;
      errors.push(`${host}: ${e.message}${e.cause ? ` (${e.cause.code || e.cause.message})` : ''}`);
    }
  }
  throw new Error(`All KEV sources failed -> ${errors.join(' | ')}`);
}

async function fetchCisaKev({ days, max }) {
  const data = await download();
  const cutoff = Date.now() - days * 86400000;

  return data.vulnerabilities
    .filter((v) => new Date(v.dateAdded).getTime() >= cutoff)
    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
    .slice(0, max)
    .map((v) => ({
      type: 'CVE',
      value: v.cveID,
      source: 'CISA KEV',
      severity: v.knownRansomwareCampaignUse === 'Known' ? 'CRITICAL' : 'HIGH',
      confidenceScore: 95,
      category: 'vulnerability',
      tags: ['kev', v.vendorProject, v.product].filter(Boolean).map((t) => t.slice(0, 40)),
      description: `${v.vulnerabilityName}. ${v.shortDescription}`.slice(0, 2000),
    }));
}

module.exports = { fetchCisaKev };