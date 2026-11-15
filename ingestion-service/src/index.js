require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cfg = require('./config');
const { runIngestion, state } = require('./ingest');
const { enrichBatch, aiState } = require('./ai/enrich');

const app = express();
app.use(cors());
app.use(express.json());

const keyOk = (req) => !cfg.triggerKey || req.get('x-api-key') === cfg.triggerKey;

app.get('/health', (req, res) => {
  res.json({
    service: 'ingestion-service',
    status: 'UP',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/ingest/status', (req, res) => res.json(state));
app.get('/ai/status', (req, res) => res.json(aiState));

app.post('/ingest/run', async (req, res) => {
  if (!keyOk(req)) return res.status(401).json({ error: 'Invalid API key' });
  res.json(await runIngestion());
});

app.post('/ai/enrich', async (req, res) => {
  if (!keyOk(req)) return res.status(401).json({ error: 'Invalid API key' });
  res.json(await enrichBatch());
});

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stip')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

app.listen(cfg.port, () => {
  console.log(`ingestion-service on port ${cfg.port}`);
  setTimeout(runIngestion, 15000);
  setInterval(runIngestion, cfg.intervalMin * 60 * 1000);
  setTimeout(enrichBatch, 60000);
  setInterval(enrichBatch, cfg.enrichIntervalMin * 60 * 1000);
});