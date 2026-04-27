# EmoSense — Production Package

Cross-cultural emotion detection AI for Zimbabwean and Chinese business contexts.

## What's in this package

```
emosense/
  index.html          ← Landing/marketing page
  server.js           ← Node.js backend (PeerJS + TURN + session logging)
  package.json        ← Node dependencies
  .env.example        ← Environment variable template
  data_pipeline.py    ← Python data collection server
  MODEL_SWAP_GUIDE.md ← Step-by-step guide to swap in your EmoSense CNN
  public/             ← Put emo-detect.html here when deploying
```

---

## Quick start (local)

```bash
# 1. Install Node dependencies
npm install

# 2. Copy env template
cp .env.example .env

# 3. Put your app files in public/
mkdir public
cp /path/to/emo-detect.html public/

# 4. Start backend
npm start
# → App at http://localhost:3000
# → PeerJS at http://localhost:3000/peerjs
# → Health: http://localhost:3000/health
```

---

## Deploy to Railway (recommended — free tier)

1. Push this folder to a GitHub repo
2. Go to railway.app → New Project → Deploy from GitHub
3. Add environment variables from .env.example
4. Done — Railway gives you a public URL like `https://emosense-production.up.railway.app`

Update `emo-detect.html` to point at your Railway URL:

```javascript
// In emo-detect.html, replace the PeerJS init:
peer = new Peer(undefined, {
  host: 'emosense-production.up.railway.app',
  port: 443,
  path: '/peerjs',
  secure: true,
  // ...
});

// And fetch ICE config from your server:
const res = await fetch('https://emosense-production.up.railway.app/api/ice-config');
const { iceServers } = await res.json();
```

---

## Swap in your EmoSense CNN model

See `MODEL_SWAP_GUIDE.md` for full instructions.

Short version:
1. Export your Keras model: `tensorflowjs_converter`
2. Put output in `public/emosense-model/`
3. Update 6 lines in `emo-detect.html`
4. Done — 87.3% accuracy active

---

## Priority order

| # | Task | Time | Impact |
|---|------|------|--------|
| 1 | Deploy backend to Railway | 20 min | Reliable ZW↔CN calls |
| 2 | Swap in EmoSense CNN | 1-2 hours | Real 87.3% accuracy |
| 3 | Enable data collection | 30 min | Growing dataset |
| 4 | Custom domain | 10 min | Professional presentation |

---

## Architecture diagram

```
User A (Harare)                    User B (Shanghai)
    │                                    │
    ├── Browser (emo-detect.html)        ├── Browser (emo-detect.html)
    │   ├── Camera (WebRTC)              │   ├── Camera (WebRTC)
    │   ├── face-api.js / EmoSense CNN   │   ├── face-api.js / EmoSense CNN
    │   └── Cultural context layer       │   └── Cultural context layer
    │                                    │
    └─────────────── PeerJS Signaling ───┘
                     (server.js)
                         │
                    STUN/TURN relay
                 (for strict NAT/firewall)
```

---

## Compliance

All inference runs locally in-browser (TensorFlow.js).
No facial data is transmitted to any server.
Data collection is opt-in only.
Compliant with Zimbabwe's Cyber and Data Protection Act (2021).
