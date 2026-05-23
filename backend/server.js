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

// Trust proxy for proper secure WebSocket detection behind reverse proxies
app.enable('trust proxy');

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
    
    const turnServers = [];
    
    if (url) {
      // url is e.g. turn:emosense.metered.live:80
      const hostPort = url.replace('turn:', ''); // e.g. emosense.metered.live:80
      const host = hostPort.split(':')[0];       // e.g. emosense.metered.live
      
      const stun80 = `stun:${host}:80`;
      const stun443 = `stun:${host}:443`;
      const turn80udp = `turn:${host}:80?transport=udp`;
      const turn80tcp = `turn:${host}:80?transport=tcp`;
      const turn443udp = `turn:${host}:443?transport=udp`;
      const turn443tcp = `turn:${host}:443?transport=tcp`;
      const turns443 = `turns:${host}:443?transport=tcp`;

      // Some browsers/networks prefer turns: (TLS)
      const tlsUrl = url.replace('turn:', 'turns:').replace(':80', ':443');

      turnServers.push({
        urls: [
          stun80,
          stun443,
          url,
          tlsUrl,
          turn80udp,
          turn80tcp,
          turn443udp,
          turn443tcp,
          turns443
        ],
        username: user,
        credential: pass,
      });
    }

    // Always include Open Relay public TURN servers as a fallback
    turnServers.push({
      urls: [
        'stun:openrelay.metered.ca:80',
        'stun:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:80?transport=tcp',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    });

    return turnServers;
  };

  const iceServers = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
    ...getTurnConfig()
  ];
  res.json({ iceServers });
});

// ── SESSION LOGGING (Postgres/Supabase) ───────────────────
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('\n[Postgres] FATAL: DATABASE_URL is missing in .env');
  console.error('Please add your Supabase connection string to backend/.env\n');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
        angry INTEGER,
        user_id TEXT
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS room_codes (
        code TEXT PRIMARY KEY,
        peer_id TEXT NOT NULL,
        guest_peer_id TEXT,
        expires_at BIGINT NOT NULL,
        status TEXT DEFAULT 'waiting'
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS collected_samples (
        id SERIAL PRIMARY KEY,
        ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        image_b64 TEXT NOT NULL,
        emotion VARCHAR(20) NOT NULL,
        confidence NUMERIC NOT NULL,
        culture VARCHAR(10) NOT NULL,
        session_hash VARCHAR(50),
        consent BOOLEAN DEFAULT TRUE
      )
    `);
    await pool.query(`ALTER TABLE room_codes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'waiting'`);
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id TEXT`);
    // Clean up expired codes on startup
    await pool.query(`DELETE FROM room_codes WHERE expires_at < $1`, [Date.now()]);
    console.log('[Postgres] Tables initialized.');
  } catch (err) {
    console.error('[Postgres] Init Error:', err);
  }
};
initDb();

app.post('/api/session', async (req, res) => {
  const { duration, ctx, emoCounts, userId } = req.body;
  const ts = new Date().toISOString();
  
  try {
    const result = await pool.query(
      `INSERT INTO sessions (ts, duration, ctx, happy, neutral, sad, angry, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        ts, 
        duration || 0, 
        ctx || 'INT', 
        emoCounts?.happy || 0, 
        emoCounts?.neutral || 0, 
        emoCounts?.sad || 0, 
        emoCounts?.angry || 0,
        userId || null
      ]
    );
    console.log('[Session Saved]', result.rows[0].id, 'user:', userId);
    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error('[Session Error]', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const { userId } = req.query;
    let result;
    if (userId) {
      result = await pool.query('SELECT * FROM sessions WHERE user_id = $1 ORDER BY id DESC', [userId]);
    } else {
      result = await pool.query('SELECT * FROM sessions ORDER BY id DESC');
    }
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

// ── ROOM CODE REGISTRY (Postgres + Memory Fallback) ─────────────────────
let memoryRooms = {};
const ADJECTIVES = ['swift','bold','calm','bright','keen','wise','cool','warm','zeal','pure'];
const NOUNS      = ['hawk','lion','crane','tiger','lotus','river','drum','stone','cloud','flame'];

function generateRoomId() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}-${noun}-${num}`;
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
    if (existing.rows.length > 0) {
      const code = existing.rows[0].code;
      // Buffer in memory
      memoryRooms[code] = { peer_id: peerId, expires_at: expiresAt, guest_peer_id: null, status: 'waiting' };
      return res.json({ code });
    }

    // Generate a unique code
    const tryInsert = async () => {
      const roomId = generateRoomId();
      const insertRes = await pool.query(
        `INSERT INTO room_codes (code, peer_id, expires_at, status) VALUES ($1, $2, $3, 'waiting') ON CONFLICT DO NOTHING`,
        [roomId, peerId, expiresAt]
      );
      if (insertRes.rowCount === 0) return tryInsert(); // collision, try again
      
      // Buffer in memory in case DB fails for the guest
      memoryRooms[roomId] = { peer_id: peerId, expires_at: expiresAt, guest_peer_id: null, status: 'waiting' };
      
      console.log(`[Room] ${roomId} -> ${peerId.slice(0,8)}...`);
      res.json({ code: roomId });
    };
    await tryInsert();
  } catch (err) {
    console.warn('[Room Error] Falling back to memory', err.message);
    
    // Clean up memory
    for (const k of Object.keys(memoryRooms)) {
      if (memoryRooms[k].expires_at < now) delete memoryRooms[k];
    }
    
    let existingCode = Object.keys(memoryRooms).find(k => memoryRooms[k].peer_id === peerId);
    if (existingCode) return res.json({ code: existingCode });

    const roomId = generateRoomId();
    memoryRooms[roomId] = { peer_id: peerId, expires_at: expiresAt, guest_peer_id: null, status: 'waiting' };
    console.log(`[Room-Mem] ${roomId} -> ${peerId.slice(0,8)}...`);
    res.json({ code: roomId });
  }
});

// GET /api/rooms/:code  → { peerId }
app.get('/api/rooms/:code', async (req, res) => {
  const code = req.params.code.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  const { guestId } = req.query;

  if (!guestId) {
    return res.status(400).json({ error: 'guestId required' });
  }

  try {
    // 1. Try to lock the room to this guest if it's currently unassigned
    await pool.query(
      `UPDATE room_codes SET guest_peer_id = $1 WHERE code = $2 AND guest_peer_id IS NULL AND expires_at > $3`,
      [guestId, code, Date.now()]
    );

    // 2. Retrieve the room, ensuring it's either unassigned (if UPDATE missed?) or assigned to this guest
    const result = await pool.query(
      `SELECT peer_id, guest_peer_id FROM room_codes WHERE code = $1 AND expires_at > $2`, 
      [code, Date.now()]
    );

    if (result.rows.length === 0) {
      const memRoom = memoryRooms[code];
      if (!memRoom || memRoom.expires_at < Date.now()) {
        return res.status(404).json({ error: 'Room not found or expired' });
      }
      if (!memRoom.guest_peer_id) memRoom.guest_peer_id = guestId;
      if (memRoom.guest_peer_id !== guestId) {
        return res.status(403).json({ error: 'Room is already in session' });
      }
      return res.json({ peerId: memRoom.peer_id });
    }

    const room = result.rows[0];
    if (room.guest_peer_id !== guestId) {
      return res.status(403).json({ error: 'Room is already in session with another peer' });
    }

    res.json({ peerId: room.peer_id });
  } catch (err) {
    // FALLBACK to memory
    const room = memoryRooms[code];
    if (!room || room.expires_at < Date.now()) {
      return res.status(404).json({ error: 'Room not found or expired' });
    }
    if (!room.guest_peer_id) room.guest_peer_id = guestId;
    if (room.guest_peer_id !== guestId) {
      return res.status(403).json({ error: 'Room is already in session' });
    }
    res.json({ peerId: room.peer_id });
  }
});

// POST /api/rooms/:code/start → Mark room as active
app.post('/api/rooms/:code/start', async (req, res) => {
  const code = req.params.code.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  try {
    const result = await pool.query(`UPDATE room_codes SET status = 'active' WHERE code = $1`, [code]);
    if (memoryRooms[code]) {
      memoryRooms[code].status = 'active';
    }
    res.json({ ok: true });
  } catch (err) {
    if (memoryRooms[code]) {
      memoryRooms[code].status = 'active';
    }
    res.json({ ok: true });
  }
});

// GET /api/rooms/:code/status → Get room status
app.get('/api/rooms/:code/status', async (req, res) => {
  const code = req.params.code.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  try {
    const result = await pool.query(`SELECT status FROM room_codes WHERE code = $1`, [code]);
    if (result.rows.length === 0) {
      if (memoryRooms[code]) {
        return res.json({ status: memoryRooms[code].status });
      }
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ status: result.rows[0].status });
  } catch (err) {
    if (memoryRooms[code]) {
      return res.json({ status: memoryRooms[code].status });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── DATA COLLECTION ENDPOINT (Supabase + Local Python Proxy) ──────────
// Resolves Render 500 errors by writing directly to Supabase Postgres.
// In local development, also dual-writes to the local Python server if online.
app.post('/api/collect', async (req, res) => {
  const { image_b64, emotion, confidence, culture, session_hash, consent } = req.body;

  // 1. Consent check (ZW Data Protection Act compliance)
  if (!consent) {
    return res.status(400).json({ error: 'Consent required' });
  }

  // 2. Validate emotion class
  const validEmotions = ['happy', 'neutral', 'sad', 'angry'];
  const emoLower = String(emotion || '').toLowerCase();
  if (!validEmotions.includes(emoLower)) {
    return res.status(400).json({ error: `Invalid emotion. Must be one of: ${validEmotions.join(', ')}` });
  }

  // 3. Validate confidence threshold (minimum 0.65 to filter noise)
  const confNum = parseFloat(confidence || 0);
  if (confNum < 0.65) {
    return res.json({ ok: false, reason: 'Confidence too low (<0.65)' });
  }

  // 4. Validate image presence
  if (!image_b64) {
    return res.status(400).json({ error: 'Missing image_b64 string' });
  }

  // 5. Clean culture value
  let cultUpper = String(culture || 'INT').toUpperCase();
  if (!['ZW', 'CN', 'INT'].includes(cultUpper)) {
    cultUpper = 'INT';
  }

  const sessHash = String(session_hash || 'anon_unknown').slice(0, 50);

  let savedInSupabase = false;
  let dbError = null;

  // 6. Write to Supabase/Postgres
  try {
    const query = `
      INSERT INTO collected_samples (image_b64, emotion, confidence, culture, session_hash, consent)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const dbRes = await pool.query(query, [image_b64, emoLower, confNum, cultUpper, sessHash, true]);
    console.log(`[Supabase Collect] Saved sample ID: ${dbRes.rows[0].id} (Emotion: ${emoLower}, Culture: ${cultUpper})`);
    savedInSupabase = true;
  } catch (err) {
    console.error('[Supabase Collect] Database error:', err.message);
    dbError = err.message;
    // We do NOT crash the request if Supabase fails to keep the UI resilient
  }

  // 7. Dual-write: Proxy to local Python backend (port 5000) if running
  try {
    const pythonRes = await fetch('http://127.0.0.1:5000/api/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    if (pythonRes.ok) {
      const pyData = await pythonRes.json();
      console.log('[Supabase Collect] Successfully dual-wrote to local Python pipeline.');
      // Return the actual Python response which might trigger local retraining check
      return res.json({
        ...pyData,
        saved_in_supabase: savedInSupabase,
        supabase_error: dbError
      });
    } else {
      console.warn('[Supabase Collect] Local Python pipeline returned non-200 response.');
    }
  } catch (pyErr) {
    // Expected in production on Render when the Python backend is not running.
    console.log('[Supabase Collect] Local Python pipeline offline. Production cloud save only.');
  }

  // If local Python is offline or errored, return the standard successful cloud save response
  if (savedInSupabase) {
    res.json({
      ok: true,
      saved_in_supabase: true,
      retrain_triggered: false
    });
  } else {
    res.status(500).json({
      error: 'Failed to write sample to either cloud database or local pipeline',
      details: dbError
    });
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
