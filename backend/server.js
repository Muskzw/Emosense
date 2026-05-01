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
  const iceServers = [
    // STUN — free, always include
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    // TURN — relay fallback for strict NATs
    // Replace with your Metered.ca or other TURN credentials:
    ...(process.env.TURN_URL ? [{
      urls: process.env.TURN_URL,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD,
    }] : [
      // Open Relay fallback (no auth, less reliable but free)
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ]),
  ];
  res.json({ iceServers });
});

// ── SESSION LOGGING (SQLite) ───────────────────────────
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, 'emosense.db'));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT,
      duration INTEGER,
      ctx TEXT,
      happy INTEGER,
      neutral INTEGER,
      sad INTEGER,
      angry INTEGER
    )
  `);
  // Room codes table — survives backend restarts
  db.run(`
    CREATE TABLE IF NOT EXISTS room_codes (
      code TEXT PRIMARY KEY,
      peer_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);
  // Clean up expired codes on startup
  db.run(`DELETE FROM room_codes WHERE expires_at < ?`, [Date.now()]);
});

app.post('/api/session', (req, res) => {
  const { duration, ctx, emoCounts } = req.body;
  const ts = new Date().toISOString();
  
  const stmt = db.prepare(`INSERT INTO sessions (ts, duration, ctx, happy, neutral, sad, angry) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  stmt.run([
    ts, 
    duration || 0, 
    ctx || 'INT', 
    emoCounts?.happy || 0, 
    emoCounts?.neutral || 0, 
    emoCounts?.sad || 0, 
    emoCounts?.angry || 0
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    console.log('[Session Saved]', this.lastID);
    res.json({ ok: true, id: this.lastID });
  });
  stmt.finalize();
});

app.get('/api/sessions', (req, res) => {
  db.all('SELECT * FROM sessions ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
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

function generateCode() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num  = Math.floor(Math.random() * 900) + 100;
  return `${adj}-${noun}-${num}`;
}

// POST /api/rooms  { peerId }  → { code }
app.post('/api/rooms', (req, res) => {
  const { peerId } = req.body;
  if (!peerId) return res.status(400).json({ error: 'peerId required' });

  const now = Date.now();
  const expiresAt = now + 2 * 60 * 60 * 1000; // 2 hours

  // Clean up expired codes first
  db.run(`DELETE FROM room_codes WHERE expires_at < ?`, [now]);

  // Check if this peer already has a live code
  db.get(`SELECT code FROM room_codes WHERE peer_id = ? AND expires_at > ?`, [peerId, now], (err, row) => {
    if (row) return res.json({ code: row.code });

    // Generate a unique code
    const tryInsert = () => {
      const code = generateCode();
      db.run(
        `INSERT OR IGNORE INTO room_codes (code, peer_id, expires_at) VALUES (?, ?, ?)`,
        [code, peerId, expiresAt],
        function(insertErr) {
          if (insertErr || this.changes === 0) return tryInsert(); // collision, try again
          console.log(`[Room] ${code} -> ${peerId.slice(0,8)}...`);
          res.json({ code });
        }
      );
    };
    tryInsert();
  });
});

// GET /api/rooms/:code  → { peerId }
app.get('/api/rooms/:code', (req, res) => {
  const code = req.params.code.toLowerCase().trim();
  db.get(`SELECT peer_id FROM room_codes WHERE code = ? AND expires_at > ?`, [code, Date.now()], (err, row) => {
    if (!row) return res.status(404).json({ error: 'Room not found or expired' });
    res.json({ peerId: row.peer_id });
  });
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
