const path = require('path');
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = Number(process.env.PORT || 10000);
const ROOT = __dirname;
const HAS_DATABASE = Boolean(process.env.DATABASE_URL);

app.disable('x-powered-by');
app.use(express.json({ limit: '5mb' }));
app.use(express.static(ROOT, { extensions: ['html'] }));

let pool = null;
let memoryState = null;

if (HAS_DATABASE) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
  });
  pool.on('error', (err) => console.error('PostgreSQL pool error:', err.message));
}

async function ensureDatabase() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS planner_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      state JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function normalizeStatePayload(body) {
  if (!body || typeof body !== 'object' || !body.state || typeof body.state !== 'object') {
    return null;
  }
  return body.state;
}

app.get('/api/health', async (_req, res) => {
  try {
    if (pool) await pool.query('SELECT 1');
    res.json({ ok: true, database: Boolean(pool), time: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ ok: false, database: true, error: 'Database unavailable' });
  }
});

app.get('/api/state', async (_req, res) => {
  try {
    if (!pool) {
      return res.json({ state: memoryState, updatedAt: memoryState?.updatedAt || '' });
    }
    const result = await pool.query('SELECT state, updated_at FROM planner_state WHERE id = 1');
    if (!result.rowCount) return res.json({ state: null, updatedAt: '' });
    res.json({ state: result.rows[0].state, updatedAt: result.rows[0].updated_at.toISOString() });
  } catch (err) {
    console.error('GET /api/state:', err.message);
    res.status(503).json({ error: 'Database unavailable' });
  }
});

app.put('/api/state', async (req, res) => {
  const nextState = normalizeStatePayload(req.body);
  if (!nextState) return res.status(400).json({ error: 'Invalid state payload' });

  try {
    const updatedAt = new Date().toISOString();
    if (!pool) {
      memoryState = nextState;
      return res.json({ ok: true, updatedAt });
    }

    await pool.query(`
      INSERT INTO planner_state (id, state, updated_at)
      VALUES (1, $1::jsonb, $2::timestamptz)
      ON CONFLICT (id) DO UPDATE
      SET state = EXCLUDED.state, updated_at = EXCLUDED.updated_at
    `, [JSON.stringify(nextState), updatedAt]);

    res.json({ ok: true, updatedAt });
  } catch (err) {
    console.error('PUT /api/state:', err.message);
    res.status(503).json({ error: 'Could not save cloud state' });
  }
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).end();
  res.sendFile(path.join(ROOT, 'index.html'));
});

async function start() {
  try {
    await ensureDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`ExamForge running on port ${PORT}`);
      console.log(`Cloud database: ${HAS_DATABASE ? 'PostgreSQL' : 'memory fallback'}`);
    });
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
}

start();
