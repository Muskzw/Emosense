import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

export const EMO = {
  happy:   { n: 'Joyful',   c: '#3dffa0', rc: 'rgba(61,255,160,0.8)',   cv: 80, co: 30 },
  neutral: { n: 'Neutral',  c: '#8899bb', rc: 'rgba(136,153,187,0.7)',  cv: 50, co: 10 },
  sad:     { n: 'Sad',      c: '#5b9cf6', rc: 'rgba(91,156,246,0.8)',   cv: 30, co: 10 },
  angry:   { n: 'Angry',    c: '#ff6b6b', rc: 'rgba(255,107,107,0.8)',  cv: 90, co: 45 },
};

const CMAP = { happy: 'cg', neutral: 'cs', sad: 'cb', angry: 'cr' };

export function useFaceAPI(videoRef, svgRef, canvasRef, isConnected, sessionCtx) {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [curEmo, setCurEmo]             = useState('neutral');
  const [emoCounts, setEmoCounts]       = useState({ happy: 0, neutral: 0, sad: 0, angry: 0 });
  const [detCount, setDetCount]         = useState(0);

  const lastEmoRef       = useRef('');
  const audioCtxRef      = useRef(null);
  const reqRef           = useRef(null);
  const timelineRef      = useRef([]);
  const lastSnapRef      = useRef(0);
  const callStartRef     = useRef(0);

  // ── Load models once ────────────────────────────────────────
  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const loadModels = async () => {
      try {
        const M = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(M),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(M),
          faceapi.nets.faceExpressionNet.loadFromUri(M),
        ]);
        setModelsLoaded(true);
      } catch (e) { console.error('FaceAPI models failed to load', e); }
    };
    loadModels();
  }, []);

  // ── Audio micro-interaction ──────────────────────────────────
  const playPop = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } catch (_) {}
  };

  const handleMicroInteractions = (emo) => {
    if (emo !== lastEmoRef.current) {
      if (emo === 'angry' || emo === 'sad' || emo === 'happy') {
        playPop();
        if (navigator.vibrate) navigator.vibrate([30]);
      }
      lastEmoRef.current = emo;
    }
  };

  // ── Data collection sample ───────────────────────────────────
  const submitSample = async (video, emo, conf) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 160; canvas.height = 120;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const b64   = canvas.toDataURL('image/jpeg', 0.7);
    const rCult = sessionCtx?.includes('-') ? sessionCtx.split('-')[1] : 'INT';
    try {
      await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: b64, emotion: emo, confidence: conf, context: rCult }),
      });
    } catch (_) {}
  };

  // ── Detection loop (main thread) ─────────────────────────────
  useEffect(() => {
    if (!isConnected || !modelsLoaded) return;

    // Reset timeline for new call
    timelineRef.current  = [];
    lastSnapRef.current  = 0;
    callStartRef.current = Date.now();

    const video = videoRef.current;
    const svg   = svgRef.current;
    if (!video || !svg) return;

    // Inject 68 landmark dots into the SVG overlay
    if (svg.children.length === 0) {
      for (let i = 0; i < 68; i++) {
        const d = document.createElement('div');
        d.className   = 'lm cg';
        d.style.position = 'absolute';
        svg.appendChild(d);
      }
    }

    let lastTime = 0;

    const detect = async (time) => {
      reqRef.current = requestAnimationFrame(detect);
      if (time - lastTime < 300) return; // ~3 fps — keeps main thread free
      lastTime = time;

      // Wait until video has actual frame data
      if (!video || video.readyState < 2 || video.videoWidth === 0) return;

      const det = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
        .withFaceLandmarks(true)
        .withFaceExpressions();

      if (!det) return;

      // Map raw expression label to our 4-emotion vocabulary
      const exps = det.expressions;
      let dEmo = 'neutral', maxConf = 0;
      for (const [e, c] of Object.entries(exps)) {
        if (c > maxConf) { maxConf = c; dEmo = e; }
      }
      if (dEmo === 'surprised' || dEmo === 'disgusted') dEmo = 'neutral';
      if (dEmo === 'fearful') dEmo = 'sad';

      handleMicroInteractions(dEmo);
      setCurEmo(dEmo);
      setDetCount(p => p + 1);
      setEmoCounts(p => ({ ...p, [dEmo]: (p[dEmo] || 0) + 1 }));

      // Record timeline snapshot every 2 s
      const now = Date.now();
      if (now - lastSnapRef.current >= 2000) {
        timelineRef.current.push({ t: Math.floor((now - callStartRef.current) / 1000), emo: dEmo });
        lastSnapRef.current = now;
      }

      // Opt-in data collection
      submitSample(video, dEmo, maxConf);

      // Render face landmarks in the SVG overlay
      const dims = faceapi.matchDimensions({ width: video.videoWidth, height: video.videoHeight }, video);
      const rDet = faceapi.resizeResults(det, dims);
      const pts  = rDet.landmarks.positions;
      const nodes = svg.children;

      if (nodes.length === pts.length) {
        pts.forEach((pt, i) => {
          nodes[i].className   = `lm ${CMAP[dEmo] || 'cs'}`;
          nodes[i].style.left  = `${(pt.x / video.videoWidth)  * 100}%`;
          nodes[i].style.top   = `${(pt.y / video.videoHeight) * 100}%`;
        });
      }
    };

    reqRef.current = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(reqRef.current);
  }, [isConnected, modelsLoaded, sessionCtx]);

  return {
    modelsLoaded,
    curEmo,
    emoCounts,
    detCount,
    getTimeline: () => [...timelineRef.current],
  };
}
