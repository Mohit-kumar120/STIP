const cfg = require('../config');

async function callOllama(prompt) {
  const res = await fetch(`${cfg.ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.ollamaModel,
      prompt,
      stream: false,
      format: 'json',
      keep_alive: '30m',
      options: { temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(cfg.ollamaTimeoutMs),
  });
  if (res.status === 404) {
    throw new Error(`Model "${cfg.ollamaModel}" not found. Run: docker exec ollama ollama pull ${cfg.ollamaModel}`);
  }
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  return (await res.json()).response;
}

module.exports = { callOllama };