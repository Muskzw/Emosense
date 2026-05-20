import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

export const EMO = {
  happy:   { n: 'Happy',   c: '#3dffa0', rc: 'rgba(61,255,160,0.8)',   cv: 80, co: 30 },
  neutral: { n: 'Neutral',  c: '#8899bb', rc: 'rgba(136,153,187,0.7)',  cv: 50, co: 10 },
  sad:     { n: 'Sad',      c: '#5b9cf6', rc: 'rgba(91,156,246,0.8)',   cv: 30, co: 10 },
  angry:   { n: 'Angry',    c: '#ff6b6b', rc: 'rgba(255,107,107,0.8)',  cv: 90, co: 45 },
};

const CMAP = { happy: 'cg', neutral: 'cs', sad: 'cb', angry: 'cr' };

// ── Dynamic TensorFlow.js Script Loader ─────────────────────────
function loadTFJS() {
  return new Promise((resolve, reject) => {
    if (window.tf) {
      resolve(window.tf);
      return;
    }
    const script = document.createElement('script');
    script.src = '/tf.min.js';
    script.async = true;
    script.onload = () => {
      console.log('[FaceAPI] TensorFlow.js loaded dynamically ✓');
      resolve(window.tf);
    };
    script.onerror = (err) => {
      console.error('[FaceAPI] Failed to load TensorFlow.js:', err);
      reject(err);
    };
    document.head.appendChild(script);
  });
}

const getCultureCode = (ctx) => {
  const s = String(ctx || '').toLowerCase();
  if (s.includes('china') || s.includes('chinese') || s.includes('cn')) return 'CN';
  if (s.includes('zimbabwe') || s.includes('zw')) return 'ZW';
  return null;
};

export function useFaceAPI(videoRef, svgRef, canvasRef, isConnected, sessionCtx, optIn = false) {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [customModelsLoaded, setCustomModelsLoaded] = useState(false);
  const [curEmo, setCurEmo]             = useState('neutral');
  const [emoCounts, setEmoCounts]       = useState({ happy: 0, neutral: 0, sad: 0, angry: 0 });
  const [detCount, setDetCount]         = useState(0);

  const lastEmoRef    = useRef('');
  const audioCtxRef   = useRef(null);
  const reqRef        = useRef(null);
  const timelineRef   = useRef([]);
  const lastSnapRef   = useRef(0);
  const callStartRef  = useRef(0);
  const lastFrameRef  = useRef(0);
  
  const customModelsRef = useRef(null);

  // ── Load face-api.js base models (once) ────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const M = '/models/base';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(M),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(M),
          faceapi.nets.faceExpressionNet.loadFromUri(M),
        ]);
        setModelsLoaded(true);
        console.log('[FaceAPI] Base models loaded ✓');
      } catch (e) {
        console.error('[FaceAPI] Base model load failed:', e);
      }
    })();
  }, []);

  // ── Load custom cultural CNN submodels (as needed) ─────────────
  useEffect(() => {
    const culture = getCultureCode(sessionCtx);
    if (!culture) {
      setCustomModelsLoaded(false);
      customModelsRef.current = null;
      return;
    }

    let active = true;
    (async () => {
      try {
        console.log(`[FaceAPI] Loading custom models for culture: ${culture}...`);
        const tf = await loadTFJS();
        
        const base = `/models/${culture.toLowerCase()}`;
        const m1Path = culture === 'ZW' ? `${base}/down_up/model.json` : `${base}/up_down/model.json`;
        const m2Path = `${base}/happy_neutral/model.json`;
        const m3Path = `${base}/anger_sad/model.json`;

        const [m1, m2, m3] = await Promise.all([
          tf.loadGraphModel(m1Path),
          tf.loadGraphModel(m2Path),
          tf.loadGraphModel(m3Path),
        ]);

        if (active) {
          customModelsRef.current = { m1, m2, m3, culture };
          setCustomModelsLoaded(true);
          console.log(`[FaceAPI] Custom ${culture} hierarchical models loaded successfully ✓`);
        }
      } catch (err) {
        console.error(`[FaceAPI] Failed to load custom ${culture} models:`, err);
      }
    })();

    return () => {
      active = false;
    };
  }, [sessionCtx]);

  // ── Audio micro-interaction ───────────────────────────────────
  const playPop = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
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

  // ── Data collection ───────────────────────────────────────────
  const submitSample = (video, emo, conf) => {
    if (!optIn || conf < 0.65) return;
    if (Math.random() > 0.1) return;

    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx2d  = canvas.getContext('2d', { willReadFrequently: true });
    
    canvas.width = 48; canvas.height = 48;
    ctx2d.drawImage(video, 0, 0, 48, 48);
    
    const getCultureCodeForCollect = (ctx) => {
      const s = String(ctx || '').toLowerCase();
      if (s.includes('china') || s.includes('chinese') || s.includes('cn')) return 'CN';
      if (s.includes('zimbabwe') || s.includes('zw')) return 'ZW';
      return 'INT';
    };

    const b64 = canvas.toDataURL('image/png');
    const culture = getCultureCodeForCollect(sessionCtx);

    fetch('/api/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        image_b64: b64, 
        emotion: emo, 
        confidence: conf, 
        culture: culture,
        session_hash: 'anon_' + Math.random().toString(36).slice(2, 8),
        consent: true 
      }),
    }).catch(() => {});
  };

  // ── Detection loop ────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected || !modelsLoaded) return;

    timelineRef.current  = [];
    lastSnapRef.current  = 0;
    callStartRef.current = Date.now();
    lastFrameRef.current = 0;

    console.log('[FaceAPI] Detection loop starting');

    const loop = async (time) => {
      reqRef.current = requestAnimationFrame(loop);

      // Throttle to ~3 fps (300 ms interval)
      if (time - lastFrameRef.current < 300) return;
      lastFrameRef.current = time;

      const video = videoRef.current;
      const svg   = svgRef.current;
      if (!video || video.videoWidth === 0) return;

      try {
        const det = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.3 }))
          .withFaceLandmarks(true)
          .withFaceExpressions();

        if (!det) return;

        let dEmo = 'neutral';
        let maxConf = 0;
        let customSuccess = false;

        // Run custom hierarchical CNN if loaded
        if (customModelsLoaded && customModelsRef.current && window.tf) {
          try {
            const tf = window.tf;
            const { m1, m2, m3, culture } = customModelsRef.current;

            const processed = tf.tidy(() => {
              const fullTensor = tf.browser.fromPixels(video);
              const { x, y, width, height } = det.detection.box;
              const startY = Math.max(0, Math.floor(y));
              const startX = Math.max(0, Math.floor(x));
              const sizeY = Math.min(video.videoHeight - startY, Math.floor(height));
              const sizeX = Math.min(video.videoWidth - startX, Math.floor(width));

              if (sizeY <= 0 || sizeX <= 0) return null;

              const cropped = tf.slice(fullTensor, [startY, startX, 0], [sizeY, sizeX, 3]);
              const resized = tf.image.resizeBilinear(cropped, [96, 96]);
              const normalized = tf.cast(resized, 'float32').div(255.0);

              if (culture === 'ZW') {
                const gray = tf.image.rgbToGrayscale(normalized);
                return gray.expandDims(0); // [1, 96, 96, 1]
              } else {
                return normalized.expandDims(0); // [1, 96, 96, 3]
              }
            });

            if (processed) {
              const p1 = m1.predict(processed);
              const p1Data = await p1.data();

              if (culture === 'ZW') {
                // ZW: Level 1 (down_up): Class 0 = 'down', Class 1 = 'up'
                const classIdx = p1Data[0] > p1Data[1] ? 0 : 1;
                if (classIdx === 0) {
                  // Route to happy_neutral: Class 0 = 'happy', Class 1 = 'neutral'
                  const p2 = m2.predict(processed);
                  const p2Data = await p2.data();
                  const class2Idx = p2Data[0] > p2Data[1] ? 0 : 1;
                  dEmo = class2Idx === 0 ? 'happy' : 'neutral';
                  maxConf = p2Data[class2Idx];
                  tf.dispose(p2);
                } else {
                  // Route to anger_sad: Class 0 = 'anger' (angry), Class 1 = 'sad'
                  const p3 = m3.predict(processed);
                  const p3Data = await p3.data();
                  const class2Idx = p3Data[0] > p3Data[1] ? 0 : 1;
                  dEmo = class2Idx === 0 ? 'angry' : 'sad';
                  maxConf = p3Data[class2Idx];
                  tf.dispose(p3);
                }
              } else {
                // CN: Level 1 (up_down): Class 0 = 'down', Class 1 = 'up'
                const classIdx = p1Data[0] > p1Data[1] ? 0 : 1;
                if (classIdx === 1) {
                  // Route to happy_neutral: Class 0 = 'happiness' (happy), Class 1 = 'neutral'
                  const p2 = m2.predict(processed);
                  const p2Data = await p2.data();
                  const class2Idx = p2Data[0] > p2Data[1] ? 0 : 1;
                  dEmo = class2Idx === 0 ? 'happy' : 'neutral';
                  maxConf = p2Data[class2Idx];
                  tf.dispose(p2);
                } else {
                  // Route to anger_sad: Class 0 = 'anger' (angry), Class 1 = 'sadness' (sad)
                  const p3 = m3.predict(processed);
                  const p3Data = await p3.data();
                  const class2Idx = p3Data[0] > p3Data[1] ? 0 : 1;
                  dEmo = class2Idx === 0 ? 'angry' : 'sad';
                  maxConf = p3Data[class2Idx];
                  tf.dispose(p3);
                }
              }

              tf.dispose(p1);
              processed.dispose();
              customSuccess = true;
            }
          } catch (customErr) {
            console.warn('[FaceAPI] Custom CNN execution failed, falling back to face-api.js expressions:', customErr);
          }
        }

        // Fallback to standard face-api.js expression model
        if (!customSuccess) {
          const exps = det.expressions;
          for (const [e, c] of Object.entries(exps)) {
            if (c > maxConf) { maxConf = c; dEmo = e; }
          }
          if (dEmo === 'surprised' || dEmo === 'disgusted') dEmo = 'neutral';
          if (dEmo === 'fearful') dEmo = 'sad';
        }

        // Micro-interactions on emotion change
        if (dEmo !== lastEmoRef.current) {
          if (dEmo === 'angry' || dEmo === 'sad' || dEmo === 'happy') {
            playPop();
            if (navigator.vibrate) navigator.vibrate([30]);
          }
          lastEmoRef.current = dEmo;
        }

        // Update detection state
        setCurEmo(dEmo);
        setDetCount(p => p + 1);
        setEmoCounts(p => ({ ...p, [dEmo]: (p[dEmo] || 0) + 1 }));

        // Timeline snapshot every 2 s
        const now = Date.now();
        if (now - lastSnapRef.current >= 2000) {
          timelineRef.current.push({ t: Math.floor((now - callStartRef.current) / 1000), emo: dEmo });
          lastSnapRef.current = now;
        }

        // Data collection
        submitSample(video, dEmo, maxConf);

        // Render face landmark dots
        if (svg) {
          if (svg.children.length === 0) {
            for (let i = 0; i < 68; i++) {
              const d = document.createElement('div');
              d.className = 'lm cg';
              d.style.position = 'absolute';
              svg.appendChild(d);
            }
          }
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
        }
      } catch (err) {
        console.warn('[FaceAPI] Detection error:', err.message);
      }
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => {
      console.log('[FaceAPI] Detection loop stopped');
      cancelAnimationFrame(reqRef.current);
    };
  }, [isConnected, modelsLoaded, customModelsLoaded, sessionCtx]);

  return {
    modelsLoaded,
    customModelsLoaded,
    customCulture: customModelsRef.current?.culture || null,
    curEmo,
    emoCounts,
    detCount,
    getTimeline: () => [...timelineRef.current],
  };
}

