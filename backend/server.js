/**
 * EmoSense Production Backend
 * ─────────────────────────────
 * Stack: Node.js + Express + PeerJS Server + CORS
 *
 * What this does:
 *  1. Serves your own PeerJS signaling server (replaces the free peerjs.com cloud)
 *  2. Provides STUN/TURN config endpoint for reliable cross-network calls (ZW ↔ CN)
 *  3. Serves the static app files (index.html, emo-detect.html)
 *  4. Session logging endpoint for analytics
 *
 * Install:
 *   npm install express peer cors dotenv
 *
 * Run:
 *   node server.js
 *   OR for production:
 *   npm install -g pm2 && pm2 start server.js --name emosense
 *
 * Deploy to:
 *   - Railway.app (free tier, 1-click deploy)
 *   - Render.com (free tier)
 *   - DigitalOcean App Platform ($5/mo)
 *   - Any VPS with Node.js
 */

require('dotenv').config();
const express    = require('express');
const { ExpressPeerServer } = require('peer');
const cors       = require('cors');
const http       = require('http');
const path       = require('path');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 3000;

// ── MIDDLEWARE ─────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// ── STATIC FILES ───────────────────────────────────────
// Serve compiled React frontend in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// ── PEERJS SIGNALING SERVER ────────────────────────────
// This replaces 0.peerjs.com — runs on YOUR server
// Peers connect to: wss://your-domain.com/peerjs
const peerServer = ExpressPeerServer(server, {
  debug: process.env.NODE_ENV !== 'production',
  path: '/',
  allow_discovery: false,    // don't expose peer list
  proxied: true,             // behind a reverse proxy (Railway, Render, etc.)
  generateClientIds: true,
});

app.use('/peerjs', peerServer);

// Log peer connections for monitoring
peerServer.on('connection', (client) => {
  console.log(`[PeerJS] Peer connected: ${client.getId()}`);
});
peerServer.on('disconnect', (client) => {
  console.log(`[PeerJS] Peer disconnected: ${client.getId()}`);
});

// ── ICE / TURN CONFIGURATION ENDPOINT ─────────────────
// The frontend calls this to get fresh TURN credentials
// TURN servers are needed when peers are behind strict NATs
// (common in Zimbabwe + China cross-network calls)
//
// Free TURN options:
//   - Metered.ca (free tier: 50GB/mo)  → https://dashboard.metered.ca/
//   - Open Relay Project               → https://www.metered.ca/tools/openrelay/
//
app.get('/api/ice-config', (req, res) => {
  const getTurnConfig = () => {
    const url  = process.env.TURN_URL;
    const user = process.env.TURN_USERNAME;
    const pass = process.env.TURN_PASSWORD?.replace(/['"]/g, ''); // strip quotes
    
    if (!url) return [
      {
        urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'],
        username: 'openrelayproject',
        credential: 'openrelayproject',
      }
    ];

    // Some browsers/networks prefer turns: (TLS)
    const tlsUrl = url.replace('turn:', 'turns:').replace(':80', ':443');

    return [
      {
        urls: [url, tlsUrl],
        username: user,
        credential: pass,
      }
    ];
  };

  const iceServers = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
    ...getTurnConfig()
  ];
  res.json({ iceServers });
});

// ── SESSION LOGGING (Postgres/Supabase) ───────────────────
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err, client, release) => {
  if (err) return console.error('[Postgres] Error connecting to DB', err.stack);
  console.log('[Postgres] Connected successfully.');
  release();
});

const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        ts TEXT,
        duration INTEGER,
        ctx TEXT,
        happy INTEGER,
        neutral INTEGER,
        sad INTEGER,
        angry INTEGER
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS room_codes (
        code TEXT PRIMARY KEY,
        peer_id TEXT NOT NULL,
        expires_at BIGINT NOT NULL
      )
    `);
    // Clean up expired codes on startup
    await pool.query(`DELETE FROM room_codes WHERE expires_at < $1`, [Date.now()]);
    console.log('[Postgres] Tables initialized.');
  } catch (err) {
    console.error('[Postgres] Init Error:', err);
  }
};
initDb();

app.post('/api/session', async (req, res) => {
  const { duration, ctx, emoCounts } = req.body;
  const ts = new Date().toISOString();
  
  try {
    const result = await pool.query(
      `INSERT INTO sessions (ts, duration, ctx, happy, neutral, sad, angry) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        ts, 
        duration || 0, 
        ctx || 'INT', 
        emoCounts?.happy || 0, 
        emoCounts?.neutral || 0, 
        emoCounts?.sad || 0, 
        emoCounts?.angry || 0
      ]
    );
    console.log('[Session Saved]', result.rows[0].id);
    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error('[Session Error]', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sessions ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── HEALTH CHECK ───────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    peers: peerServer.connections ? Object.keys(peerServer.connections).length : 0,
    ts: new Date().toISOString(),
  });
});

// ── ROOM CODE REGISTRY (SQLite-backed) ─────────────────────
const ADJECTIVES = ['swift','bold','calm','bright','keen','wise','cool','warm','zeal','pure'];
const NOUNS      = ['hawk','lion','crane','tiger','lotus','river','drum','stone','cloud','flame'];

function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /api/rooms  { peerId }  → { code }
app.post('/api/rooms', async (req, res) => {
  const { peerId } = req.body;
  if (!peerId) return res.status(400).json({ error: 'peerId required' });

  const now = Date.now();
  const expiresAt = now + 2 * 60 * 60 * 1000; // 2 hours

  try {
    // Clean up expired codes first
    await pool.query(`DELETE FROM room_codes WHERE expires_at < $1`, [now]);

    // Check if this peer already has a live code
    const existing = await pool.query(`SELECT code FROM room_codes WHERE peer_id = $1 AND expires_at > $2`, [peerId, now]);
    if (existing.rows.length > 0) return res.json({ code: existing.rows[0].code });

    // Generate a unique code
    const tryInsert = async () => {
      const roomId = generateRoomId();
      const insertRes = await pool.query(
        `INSERT INTO room_codes (code, peer_id, expires_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [roomId, peerId, expiresAt]
      );
      if (insertRes.rowCount === 0) return tryInsert(); // collision, try again
      
      console.log(`[Room] ${roomId} -> ${peerId.slice(0,8)}...`);
      res.json({ code: roomId });
    };
    await tryInsert();
  } catch (err) {
    console.error('[Room Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rooms/:code  → { peerId }
app.get('/api/rooms/:code', async (req, res) => {
  const code = req.params.code.toLowerCase().trim();
  try {
    const result = await pool.query(`SELECT peer_id FROM room_codes WHERE code = $1 AND expires_at > $2`, [code, Date.now()]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Room not found or expired' });
    res.json({ peerId: result.rows[0].peer_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DATA COLLECTION PROXY ────────────────────────────
// Proxies requests from the frontend to the Python backend
// This allows Ngrok to handle both signaling and data collection seamlessly
app.post('/api/collect', async (req, res) => {
  try {
    const pythonRes = await fetch('http://127.0.0.1:5000/api/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (!pythonRes.ok) throw new Error('Python server error');
    const data = await pythonRes.json();
    res.json(data);
  } catch (err) {
    console.error('[Proxy Error] Could not reach Python server:', err.message);
    res.status(500).json({ error: 'Data collection backend offline' });
  }
});

// ── CATCH-ALL → index.html ─────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// ── START ──────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   EmoSense Backend running            ║
  ║   http://localhost:${PORT}               ║
  ║                                       ║
  ║   PeerJS: /peerjs                     ║
  ║   ICE config: GET /api/ice-config     ║
  ║   Health: GET /health                 ║
  ╚═══════════════════════════════════════╝
  `);
});
