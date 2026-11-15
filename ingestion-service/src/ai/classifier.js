const { callOllama } = require('./ollamaClient');
const { classifyPrompt } = require('./prompts');

const SEVERITIES = ['low', 'medium', 'high', 'critical'];

async function classifyIndicator(ind) {
  const raw = await callOllama(classifyPrompt(ind));

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Model returned invalid JSON');
  }

  const severity = String(parsed.severity || '').toLowerCase();
  if (!SEVERITIES.includes(severity)) throw new Error('Model returned an invalid severity');

  const reasoning = String(parsed.reasoning || '').replace(/\s+/g, ' ').trim().slice(0, 400);
  if (!reasoning) throw new Error('Model returned no reasoning');

  return {
    severity,
    confidence: Math.min(100, Math.max(0, Math.round(Number(parsed.confidence) || 0))),
    category: String(parsed.category || 'unknown').toLowerCase().slice(0, 30),
    reasoning,
  };
}

module.exports = { classifyIndicator };