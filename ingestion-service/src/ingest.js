const cfg = require('./config');
const { upsertIndicator } = require('./coreApi');
const { fetchCisaKev } = require('./feeds/cisaKev');
const { fetchFeodo } = require('./feeds/feodo');

const state = { running: false, lastRun: null, lastResult: null };

const feeds = [
  { name: 'cisa-kev', fetch: () => fetchCisaKev({ days: cfg.kevDays, max: cfg.maxPerFeed }) },
  { name: 'feodo', fetch: () => fetchFeodo({ max: cfg.maxPerFeed }) },
];

async function runIngestion() {
  if (state.running) return { skipped: 'already running' };
  state.running = true;
  const result = {};

  for (const feed of feeds) {
    const r = { fetched: 0, sent: 0, failed: 0, error: null };
    try {
      const items = await feed.fetch();
      r.fetched = items.length;
      for (const item of items) {
        try {
          await upsertIndicator(item);
          r.sent++;
        } catch (e) {
          r.failed++;
          r.error = e.message;
        }
      }
    } catch (e) {
      r.error = e.message;
    }
    result[feed.name] = r;
    console.log(`[ingest] ${feed.name}:`, r);
  }

  state.running = false;
  state.lastRun = new Date().toISOString();
  state.lastResult = result;
  return result;
}

module.exports = { runIngestion, state };