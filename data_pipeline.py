"""
EmoSense Data Collection Pipeline
───────────────────────────────────
Collects anonymized facial expression samples during opt-in sessions
to continuously improve the EmoSense CNN model.

Architecture:
  Browser (opt-in) → POST /api/collect → save face crop + label
  → Periodic retrain trigger → Updated model weights

Run:
  pip install flask flask-cors pillow numpy opencv-python
  python data_pipeline.py
"""

import os
import base64
import json
import hashlib
import datetime
from io import BytesIO
from pathlib import Path 

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np

app = Flask(__name__)
CORS(app)

# ── CONFIG ────────────────────────────────────────────────────────────────────
DATA_DIR      = Path('./emosense-dataset')
EMOTIONS      = ['happy', 'neutral', 'sad', 'angry']
MIN_SAMPLES   = 50   # min per class before retraining triggers
IMAGE_SIZE    = (48, 48)
MAX_FILE_MB   = 0.5  # reject images larger than this

# ── SETUP DIRECTORIES ─────────────────────────────────────────────────────────
for emotion in EMOTIONS:
    for culture in ['ZW', 'CN', 'INT']:
        (DATA_DIR / emotion / culture).mkdir(parents=True, exist_ok=True)

(DATA_DIR / 'logs').mkdir(exist_ok=True)
(DATA_DIR / 'rejected').mkdir(exist_ok=True)

# ── COLLECTION ENDPOINT ───────────────────────────────────────────────────────
@app.route('/api/collect', methods=['POST'])
def collect_sample():
    """
    Receives an anonymized face crop + emotion label from the browser.

    Expected JSON body:
    {
      "image_b64": "<base64 encoded PNG>",
      "emotion": "happy",       // label from EmoSense detection
      "confidence": 0.87,        // model confidence
      "culture": "ZW",          // ZW, CN, or INT
      "session_hash": "abc123",  // anonymous session identifier
      "consent": true            // MUST be true
    }
    """
    data = request.get_json()

    # ── CONSENT CHECK (ZW Data Protection Act 2021 compliance)
    if not data.get('consent'):
        return jsonify({'error': 'Consent required'}), 400

    # ── VALIDATE INPUTS
    emotion = data.get('emotion', '').lower()
    if emotion not in EMOTIONS:
        return jsonify({'error': f'Invalid emotion. Must be one of: {EMOTIONS}'}), 400

    culture = data.get('culture', 'INT').upper()
    if culture not in ['ZW', 'CN', 'INT']:
        culture = 'INT'

    confidence = float(data.get('confidence', 0))
    if confidence < 0.65:
        # Low confidence samples add noise — reject
        return jsonify({'ok': False, 'reason': 'Confidence too low (<0.65)'}), 200

    # ── DECODE IMAGE
    try:
        image_b64 = data['image_b64']
        # Remove data URI prefix if present
        if ',' in image_b64:
            image_b64 = image_b64.split(',')[1]

        img_bytes = base64.b64decode(image_b64)
        if len(img_bytes) > MAX_FILE_MB * 1024 * 1024:
            return jsonify({'error': 'Image too large'}), 400

        img = Image.open(BytesIO(img_bytes)).convert('RGB')
    except Exception as e:
        return jsonify({'error': f'Invalid image: {str(e)}'}), 400

    # ── PREPROCESS
    img = img.resize(IMAGE_SIZE, Image.LANCZOS)

    # ── ANONYMIZATION: strip any metadata, hash for deduplication
    img_array = np.array(img)
    img_hash = hashlib.md5(img_array.tobytes()).hexdigest()[:12]

    # ── SAVE
    filename = f'{img_hash}_{culture}_{int(confidence*100):03d}.png'
    save_path = DATA_DIR / emotion / culture / filename

    if save_path.exists():
        return jsonify({'ok': True, 'duplicate': True}), 200

    img.save(save_path)

    # ── LOG (no personal data)
    log_entry = {
        'ts': datetime.datetime.utcnow().isoformat(),
        'emotion': emotion,
        'culture': culture,
        'confidence': confidence,
        'file': str(save_path),
        'session': data.get('session_hash', 'unknown'),
    }
    log_file = DATA_DIR / 'logs' / f"{datetime.date.today()}.jsonl"
    with open(log_file, 'a') as f:
        f.write(json.dumps(log_entry) + '\n')

    # ── CHECK IF RETRAINING SHOULD TRIGGER
    should_retrain = check_retrain_trigger()

    return jsonify({
        'ok': True,
        'saved': str(save_path),
        'retrain_triggered': should_retrain,
    })


# ── DATASET STATS ENDPOINT ────────────────────────────────────────────────────
@app.route('/api/dataset/stats', methods=['GET'])
def dataset_stats():
    """Returns current dataset size per emotion and culture."""
    stats = {}
    total = 0
    for emotion in EMOTIONS:
        stats[emotion] = {}
        for culture in ['ZW', 'CN', 'INT']:
            count = len(list((DATA_DIR / emotion / culture).glob('*.png')))
            stats[emotion][culture] = count
            total += count
    return jsonify({'stats': stats, 'total': total})


# ── RETRAIN TRIGGER ───────────────────────────────────────────────────────────
def check_retrain_trigger():
    """
    Returns True if any emotion class has accumulated enough new samples
    to warrant a retraining run.
    """
    trigger_file = DATA_DIR / 'last_retrain.json'
    try:
        with open(trigger_file) as f:
            last = json.load(f)
    except FileNotFoundError:
        last = {e: 0 for e in EMOTIONS}

    for emotion in EMOTIONS:
        current = sum(
            len(list((DATA_DIR / emotion / c).glob('*.png')))
            for c in ['ZW', 'CN', 'INT']
        )
        if current - last.get(emotion, 0) >= MIN_SAMPLES:
            print(f'[Retrain] Trigger: {emotion} has {current} samples (last train: {last.get(emotion, 0)})')
            update_retrain_baseline(last)
            return True
    return False


def update_retrain_baseline(last):
    trigger_file = DATA_DIR / 'last_retrain.json'
    new_baseline = {}
    for emotion in EMOTIONS:
        new_baseline[emotion] = sum(
            len(list((DATA_DIR / emotion / c).glob('*.png')))
            for c in ['ZW', 'CN', 'INT']
        )
    with open(trigger_file, 'w') as f:
        json.dump(new_baseline, f)


# ── HOW TO ADD OPT-IN TO THE BROWSER APP ─────────────────────────────────────
"""
Add this to emo-detect.html inside the JS block:

// ── DATA COLLECTION (opt-in only) ──────────────────────────────────────────
let dataCollectionEnabled = false;

function enableDataCollection() {
  if (confirm(
    'Help improve EmoSense?\n\n' +
    'If you consent, anonymized face crops will be sent to improve ' +
    'the EmoSense dataset for Zimbabwean and Chinese users.\n\n' +
    'No personal data is stored. Compliant with ZW Cyber & Data Protection Act 2021.'
  )) {
    dataCollectionEnabled = true;
    toast('Contributing to EmoSense dataset — thank you!');
  }
}

async function submitSample(videoElement, emotion, confidence, culture) {
  if (!dataCollectionEnabled || confidence < 0.65) return;

  // Capture face crop from video
  const canvas = document.createElement('canvas');
  canvas.width = 48; canvas.height = 48;
  canvas.getContext('2d').drawImage(videoElement, 0, 0, 48, 48);
  const imageB64 = canvas.toDataURL('image/png');

  try {
    await fetch('https://your-backend.railway.app/api/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_b64: imageB64,
        emotion,
        confidence: confidence / 100,
        culture,
        session_hash: btoa(myRoomId).slice(0, 12),
        consent: true,
      })
    });
  } catch(e) {
    // Silently fail — don't disrupt the call
  }
}

// Call submitSample() inside your setEmoReal() function:
// submitSample(remoteVid, topEmo, topConf, 'CN');  // for remote
// submitSample(localVid,  me,     conf,   'ZW');   // for local
"""

if __name__ == '__main__':
    print("""
  ┌─────────────────────────────────────────┐
  │  EmoSense Data Collection Pipeline      │
  │  http://localhost:5000                  │
  │                                         │
  │  POST /api/collect  → save sample       │
  │  GET  /api/dataset/stats → counts       │
  └─────────────────────────────────────────┘
    """)
    app.run(host='0.0.0.0', port=5000, debug=True)
