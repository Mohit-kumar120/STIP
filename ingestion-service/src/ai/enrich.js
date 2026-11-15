const cfg = require('../config');
const { listUnenriched, setAiNote } = require('../coreApi');
const { classifyIndicator } = require('./classifier');

const aiState = { running: false, lastRun: null, lastResult: null };

async function enrichBatch() {
  if (aiState.running) return { skipped: 'already running' };
  aiState.running = true;
  const r = { checked: 0, enriched: 0, failed: 0, error: null };

  try {
    const items = await listUnenriched(cfg.enrichBatch);
    r.checked = items.length;
    for (const ind of items) {
      try {
        const ai = await classifyIndicator(ind);
        const note = `AI assessment: ${ai.severity} / ${ai.category} (${ai.confidence}% confidence). ${ai.reasoning}`;
        await setAiNote(ind.id, note.slice(0, 1900));
        r.enriched++;
      } catch (e) {
        r.failed++;
        r.error = e.message;
        console.error(`[ai] ${ind.value}: ${e.message}`);
      }
    }
  } catch (e) {
    r.error = e.message;
  }

  aiState.running = false;
  aiState.lastRun = new Date().toISOString();
  aiState.lastResult = r;
  console.log('[ai]', r);
  return r;
}

module.exports = { enrichBatch, aiState };