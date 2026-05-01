import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

export const EMO = {
  happy:   { n: 'Joyful',   c: '#3dffa0', rc: 'rgba(61,255,160,0.8)',   cv: 80, co: 30 },
  neutral: { n: 'Neutral',  c: '#8899bb', rc: 'rgba(136,153,187,0.7)',  cv: 50, co: 10 },
  sad:     { n: 'Sad',      c: '#5b9cf6', rc: 'rgba(91,156,246,0.8)',   cv: 30, co: 10 },
  angry:   { n: 'Angry',    c: '#ff6b6b', rc: 'rgba(255,107,107,0.8)',  cv: 90, co: 45 },
};

const CMAP = { happy: 'cg', neutral: 'cs', sad: 'cb', angry: 'cr' };

// ── Detect if OffscreenCanvas + Worker are supported ───────────
const WORKER_SUPPORTED =
  typeof OffscreenCanvas !== 'undefined' &&
  typeof Worker !== 'undefined';

// ── Audio micro-interaction ─────────────────────────────────────
function createPop(audioCtx) {
  try {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
  } catch (_) {}
}

export function useFaceAPI(videoRef, svgRef, canvasRef, isConnected, sessionCtx) {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [curEmo, setCurEmo]             = useState('neutral');
  const [emoCounts, setEmoCounts]       = useState({ happy: 0, neutral: 0, sad: 0, angry: 0 });
  const [detCount, setDetCount]         = useState(0);
  const [usingWorker, setUsingWorker]   = useState(false);

  const lastEmoRef        = useRef('');
  const audioCtxRef       = useRef(null);
  const reqRef            = useRef(null);
  const workerRef         = useRef(null);
  const timelineRef       = useRef([]);
  const lastTimelineSnap  = useRef(0);
  const callStartRef      = useRef(0);

  // ── Load models ───────────────────────────────────────────────
  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();

    if (WORKER_SUPPORTED) {
      // Spin up the Web Worker — face-api loads there
      const worker = new Worker('/faceWorker.js');
      workerRef.current = worker;
      worker.postMessage({ type: 'LOAD_MODELS' });

      worker.onmessage = ({ data }) => {
        if (data.type === 'MODELS_LOADED') {
          setModelsLoaded(true);
          setUsingWorker(true);
        }
        if (data.type === 'MODELS_ERROR') {
          console.warn('[Worker] Model load failed, falling back to main thread', data.error);
          loadMainThreadModels();
        }
      };
      worker.onerror = (e) => {
        console.warn('[Worker] Error, falling back to main thread', e.message);
        loadMainThreadModels();
      };
    } else {
      loadMainThreadModels();
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const loadMainThreadModels = async () => {
    try {
      const M = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(M),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(M),
        faceapi.nets.faceExpressionNet.loadFromUri(M),
      ]);
      setModelsLoaded(true);
      setUsingWorker(false);
    } catch (e) { console.error('FaceAPI Models failed to load', e); }
  };

  // ── Helpers ───────────────────────────────────────────────────
  const handleMicroInteractions = (emo) => {
    if (emo !== lastEmoRef.current) {
      if (emo === 'angry' || emo === 'sad' || emo === 'happy') {
        createPop(audioCtxRef.current);
        if (navigator.vibrate) navigator.vibrate([30]);
      }
      lastEmoRef.current = emo;
    }
  };

  const applyLandmarks = (landmarks, width, height) => {
    const svg = svgRef.current;
    if (!svg) return;
    if (svg.children.length === 0) {
      for (let i = 0; i < 68; i++) {
        const d = document.createElement('div');
        d.className = 'lm cg';
        d.style.position = 'absolute';
        svg.appendChild(d);
      }
    }
    const nodes = svg.children;
    const dEmo = lastEmoRef.current || 'neutral';
    if (nodes.length === landmarks.length) {
      landmarks.forEach((pt, i) => {
        nodes[i].className = `lm ${CMAP[dEmo] || 'cs'}`;
        nodes[i].style.left = `${(pt.x / width) * 100}%`;
        nodes[i].style.top  = `${(pt.y / height) * 100}%`;
      });
    }
  };

  const recordTimeline = (dEmo) => {
    const now = Date.now();
    if (now - lastTimelineSnap.current >= 2000) {
      timelineRef.current.push({ t: Math.floor((now - callStartRef.current) / 1000), emo: dEmo });
      lastTimelineSnap.current = now;
    }
  };

  const submitSample = async (video, emo, conf) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 160; canvas.height = 120;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg', 0.7);
    const rCult = sessionCtx?.includes('-') ? sessionCtx.split('-')[1] : 'INT';
    try {
      await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: b64, emotion: emo, confidence: conf, context: rCult }),
      });
    } catch (_) {}
  };

  const processDetectionResult = (dEmoRaw, expressions, landmarks, width, height) => {
    let dEmo = dEmoRaw;
    if (dEmo === 'surprised' || dEmo === 'disgusted') dEmo = 'neutral';
    if (dEmo === 'fearful') dEmo = 'sad';

    handleMicroInteractions(dEmo);
    setCurEmo(dEmo);
    setDetCount(p => p + 1);
    setEmoCounts(p => ({ ...p, [dEmo]: (p[dEmo] || 0) + 1 }));
    recordTimeline(dEmo);
    applyLandmarks(landmarks, width, height);
  };

  // ── Detection loop ────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected || !modelsLoaded || !videoRef.current || !svgRef.current) return;
    timelineRef.current   = [];
    lastTimelineSnap.current = 0;
    callStartRef.current  = Date.now();

    const video = svgRef.current; // just to trigger re-run when svgRef changes

    if (usingWorker && workerRef.current) {
      // ── WORKER PATH ─────────────────────────────────────────
      const worker = workerRef.current;
      let throttle = 0;
      let pendingDetect = false;

      const sendFrame = () => {
        reqRef.current = requestAnimationFrame(sendFrame);
        const now = performance.now();
        if (now - throttle < 300) return; // ~3fps
        throttle = now;

        const vid = videoRef.current;
        if (!vid || vid.videoWidth === 0 || pendingDetect) return;

        // Capture frame as transferable ImageBitmap (zero-copy)
        createImageBitmap(vid).then(bitmap => {
          pendingDetect = true;
          worker.postMessage(
            { type: 'DETECT', payload: { bitmap, width: vid.videoWidth, height: vid.videoHeight } },
            [bitmap] // transfer ownership — no copy
          );
        }).catch(() => {});
      };

      worker.onmessage = ({ data }) => {
        pendingDetect = false;
        if (data.type === 'DETECTION') {
          const { expressions, landmarks, width, height } = data.payload;
          let maxEmo = 'neutral', maxConf = 0;
          for (const [e, c] of Object.entries(expressions)) {
            if (c > maxConf) { maxConf = c; maxEmo = e; }
          }
          processDetectionResult(maxEmo, expressions, landmarks, width, height);

          // Submit sample still on main thread (needs canvas)
          if (videoRef.current) submitSample(videoRef.current, maxEmo, maxConf);
        }
        if (data.type === 'MODELS_LOADED') setModelsLoaded(true);
      };

      reqRef.current = requestAnimationFrame(sendFrame);
    } else {
      // ── MAIN THREAD FALLBACK PATH ────────────────────────────
      const vid = videoRef.current;
      let lastTime = 0;

      if (svgRef.current.children.length === 0) {
        for (let i = 0; i < 68; i++) {
          const d = document.createElement('div');
          d.className = 'lm cg';
          d.style.position = 'absolute';
          svgRef.current.appendChild(d);
        }
      }

      const detect = async (time) => {
        reqRef.current = requestAnimationFrame(detect);
        if (time - lastTime < 300) return;
        lastTime = time;
        if (vid.videoWidth === 0) return;

        const det = await faceapi
          .detectSingleFace(vid, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
          .withFaceLandmarks(true)
          .withFaceExpressions();

        if (det) {
          const exps = det.expressions;
          let dEmo = 'neutral', maxConf = 0;
          for (const [e, c] of Object.entries(exps)) { if (c > maxConf) { maxConf = c; dEmo = e; } }

          const dims = faceapi.matchDimensions({ width: vid.videoWidth, height: vid.videoHeight }, vid);
          const rDet = faceapi.resizeResults(det, dims);
          const landmarks = rDet.landmarks.positions.map(p => ({ x: p.x, y: p.y }));

          processDetectionResult(dEmo, exps, landmarks, vid.videoWidth, vid.videoHeight);
          submitSample(vid, dEmo, maxConf);
        }
      };

      reqRef.current = requestAnimationFrame(detect);
    }

    return () => cancelAnimationFrame(reqRef.current);
  }, [isConnected, modelsLoaded, usingWorker, sessionCtx]);

  return {
    modelsLoaded,
    curEmo,
    emoCounts,
    detCount,
    usingWorker,
    getTimeline: () => [...timelineRef.current],
  };
}
