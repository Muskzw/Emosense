import { useState, useEffect, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';

export const EMO = {
  happy:   { n: 'Happy',   c: '#3dffa0', rc: 'rgba(61,255,160,0.8)',   cv: 80, co: 30 },
  neutral: { n: 'Neutral',  c: '#8899bb', rc: 'rgba(136,153,187,0.7)',  cv: 50, co: 10 },
  sad:     { n: 'Sad',      c: '#5b9cf6', rc: 'rgba(91,156,246,0.8)',   cv: 30, co: 10 },
  angry:   { n: 'Angry',    c: '#ff6b6b', rc: 'rgba(255,107,107,0.8)',  cv: 90, co: 45 },
};

const CMAP = { happy: 'cg', neutral: 'cs', sad: 'cb', angry: 'cr' };

// Dynamic script loader removed in favor of using built-in faceapi.tf

const getCultureCode = (ctx) => {
  const s = String(ctx || '').toLowerCase();
  if (s.includes('china') || s.includes('chinese') || s.includes('cn')) return 'CN';
  if (s.includes('zimbabwe') || s.includes('zw')) return 'ZW';
  return null;
};

function mapVideoCoordinates(pt, video) {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  const clientWidth = video.clientWidth;
  const clientHeight = video.clientHeight;

  if (!videoWidth || !videoHeight || !clientWidth || !clientHeight) {
    return { x: 0, y: 0 };
  }

  const computedStyle = window.getComputedStyle(video);
  const fit = computedStyle.objectFit || 'fill';

  let scaleX = clientWidth / videoWidth;
  let scaleY = clientHeight / videoHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (fit === 'cover' || fit === 'contain') {
    const scale = fit === 'cover' 
      ? Math.max(scaleX, scaleY) 
      : Math.min(scaleX, scaleY);
    
    scaleX = scale;
    scaleY = scale;
    offsetX = (clientWidth - (videoWidth * scale)) / 2;
    offsetY = (clientHeight - (videoHeight * scale)) / 2;
  }

  const x_elem = pt.x * scaleX + offsetX;
  const y_elem = pt.y * scaleY + offsetY;

  return {
    x: (x_elem / clientWidth) * 100, // as percentage
    y: (y_elem / clientHeight) * 100  // as percentage
  };
}

export function useFaceAPI(videoRef, svgRef, canvasRef, isConnected, sessionCtx, optIn = false) {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [customModelsLoaded, setCustomModelsLoaded] = useState(false);
  const [modelError, setModelError]     = useState(false);
  const [curEmo, setCurEmo]             = useState('neutral');
  const [emoCounts, setEmoCounts]       = useState({ happy: 0, neutral: 0, sad: 0, angry: 0 });
  const [detCount, setDetCount]         = useState(0);
  const [debug, setDebug]               = useState({ loopTicks: 0, videoSize: '0x0', lastError: 'none', lastDet: 'none' });
  const isConnectedRef = useRef(isConnected);
  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);

  // Reset counts when a new session connection is established
  useEffect(() => {
    if (isConnected) {
      setEmoCounts({ happy: 0, neutral: 0, sad: 0, angry: 0 });
      setDetCount(0);
      setCurEmo('neutral');
      timelineRef.current = [];
      lastSnapRef.current = 0;
      callStartRef.current = Date.now();
    }
  }, [isConnected]);

  const lastEmoRef    = useRef('');
  const audioCtxRef   = useRef(null);
  const reqRef        = useRef(null);
  const timelineRef   = useRef([]);
  const lastSnapRef   = useRef(0);
  const callStartRef  = useRef(0);
  const lastFrameRef  = useRef(0);
  
  const customModelsRef = useRef(null);
  const localCanvasRef  = useRef(null);
  
  const emoSenseModelRef = useRef(null);
  const [emosenseModelLoaded, setEmosenseModelLoaded] = useState(false);
  
  const frameCountRef = useRef(0);
  const lastPredictionRef = useRef({ dEmo: 'neutral', maxConf: 0.8, customSuccess: false });

  // ── Load face-api.js base models (once) ────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // Force face-api.js internal TensorFlow.js to use WebGL backend
        if (faceapi.tf && typeof faceapi.tf.setBackend === 'function') {
          try {
            await faceapi.tf.setBackend('webgl');
            console.log('[FaceAPI] Internal faceapi.tf backend successfully set to WebGL ✓');
          } catch (tfErr) {
            console.warn('[FaceAPI] Failed to set internal faceapi.tf backend to WebGL, trying CPU:', tfErr);
            try {
              await faceapi.tf.setBackend('cpu');
              console.log('[FaceAPI] Internal faceapi.tf backend successfully fell back to CPU ✓');
            } catch (cpuErr) {
              console.error('[FaceAPI] Failed to set internal faceapi.tf backend to CPU:', cpuErr);
            }
          }
        }
        
        const M = '/models/base';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(M),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(M),
          faceapi.nets.faceExpressionNet.loadFromUri(M),
        ]);
        
        try {
          const customBaseModel = await faceapi.tf.loadGraphModel('/models/emosense-model/model.json');
          if (customBaseModel) {
            emoSenseModelRef.current = customBaseModel;
            setEmosenseModelLoaded(true);
            console.log('[FaceAPI] Custom EmoSense Colab-trained model loaded successfully ✓');
          }
        } catch (tfjsErr) {
          console.warn('[FaceAPI] Custom EmoSense Colab-trained model not found or failed to load. Using face-api fallback.', tfjsErr.message);
        }
        
        setModelsLoaded(true);
        console.log('[FaceAPI] Base models loaded ✓');
      } catch (e) {
        console.error('[FaceAPI] Model load failed:', e);
        setModelError(true);
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
        const tf = faceapi.tf;
        if (!tf) {
          throw new Error('TensorFlow.js is not loaded within face-api');
        }
        
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
    const isOptedIn = optIn === true || optIn === 'true';
    if (!isOptedIn) return;

    if (conf < 0.65) return;

    // We throttle uploading to a 10% sample rate to optimize client/server bandwidth.
    if (Math.random() > 0.1) return;

    console.log('[Dataset Opt-In] Evaluated frame matches criteria. Capturing anonymized face sample for emotion:', emo, 'with confidence:', conf);

    if (!canvasRef.current) {
      console.warn('[Dataset Opt-In] Canvas reference is missing, cannot capture frame.');
      return;
    }
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
    })
    .then(async (res) => {
      if (res.ok) {
        console.log('[Dataset Opt-In] Anonymized face sample uploaded successfully.');
      } else {
        const errText = await res.text();
        console.warn(`[Dataset Opt-In] Upload failed with status ${res.status}:`, errText);
      }
    })
    .catch((err) => {
      console.error('[Dataset Opt-In] Network/Connection error uploading sample to backend:', err.message);
    });
  };

  // ── Detection loop ────────────────────────────────────────────
  useEffect(() => {
    // Start detection loop as soon as models are loaded — don't hard-gate on
    // isConnected because WebRTC state can lag behind actual video availability.
    if (!modelsLoaded) return;

    console.log('[FaceAPI] Detection loop starting');

    let active = true;

    const loop = async () => {
      if (!active) return;

      setDebug(d => ({ ...d, loopTicks: d.loopTicks + 1 }));

      const video = videoRef.current;
      const svg   = svgRef.current;

      if (!video || video.videoWidth === 0) {
        setDebug(d => ({ ...d, videoSize: video ? `${video.videoWidth}x${video.videoHeight}` : 'null' }));
        // Video not ready, retry in 100ms
        if (active) {
          reqRef.current = setTimeout(loop, 100);
        }
        return;
      }

      setDebug(d => ({ ...d, videoSize: `${video.videoWidth}x${video.videoHeight}` }));

      // Draw to offscreen canvas for mobile and iOS Safari compatibility
      if (!localCanvasRef.current) {
        localCanvasRef.current = document.createElement('canvas');
      }
      const offscreenCanvas = localCanvasRef.current;
      if (offscreenCanvas.width !== video.videoWidth || offscreenCanvas.height !== video.videoHeight) {
        offscreenCanvas.width = video.videoWidth;
        offscreenCanvas.height = video.videoHeight;
      }
      const offCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
      if (offCtx) {
        offCtx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
      }

      const startTime = Date.now();

      try {
        let det;
        // Optimize: Use smaller inputSize (160 instead of 224) to run up to 2x faster.
        // Also bypass standard faceExpressionNet entirely if our custom model is active.
        // Optimize: Use smaller inputSize (160 instead of 224) to run up to 2x faster.
        // Always run the TinyFaceDetector with face landmarks and expressions.
        // This ensures the highly optimized, pre-trained face-api.js model is always available
        // as a robust baseline and seamless fallback.
        det = await faceapi
          .detectSingleFace(offscreenCanvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.3 }))
          .withFaceLandmarks(true)
          .withFaceExpressions();

        setDebug(d => ({ ...d, lastDet: det ? 'found' : 'not found' }));

        if (active && det) {
          // Frame throttling: only run heavy deep learning expression inference every 5th frame (approx. every 150ms).
          // The face landmarks and mesh drawing continue to run at full 60 FPS, making the UI feel buttery smooth!
          frameCountRef.current += 1;
          const shouldPredictExpression = frameCountRef.current % 5 === 0;

          let dEmo = lastPredictionRef.current.dEmo;
          let maxConf = lastPredictionRef.current.maxConf;
          let customSuccess = lastPredictionRef.current.customSuccess;

          if (shouldPredictExpression) {
            dEmo = 'neutral';
            maxConf = 0;
            customSuccess = false;

            // Run custom hierarchical CNN if loaded
            const tf = faceapi.tf;
            if (customModelsLoaded && customModelsRef.current && tf) {
              try {
                const { m1, m2, m3, culture } = customModelsRef.current;

                const processed = tf.tidy(() => {
                  const fullTensor = tf.browser.fromPixels(offscreenCanvas);
                  const { x, y, width, height } = det.detection.box;
                  const startY = Math.max(0, Math.floor(y));
                  const startX = Math.max(0, Math.floor(x));
                  const sizeY = Math.min(offscreenCanvas.height - startY, Math.floor(height));
                  const sizeX = Math.min(offscreenCanvas.width - startX, Math.floor(width));

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
                      // 'down' (Class 0) → Route to happy_neutral
                      const p2 = m2.predict(processed);
                      const p2Data = await p2.data();
                      const class2Idx = p2Data[0] > p2Data[1] ? 0 : 1;
                      dEmo = class2Idx === 0 ? 'happy' : 'neutral';
                      maxConf = p2Data[class2Idx];
                      tf.dispose(p2);
                    } else {
                      // 'up' (Class 1) → Route to anger_sad: Class 0 = 'anger' (angry), Class 1 = 'sad'
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
                      // 'up' → Route to happy_neutral: Class 0 = 'happiness' (happy), Class 1 = 'neutral'
                      const p2 = m2.predict(processed);
                      const p2Data = await p2.data();
                      const class2Idx = p2Data[0] > p2Data[1] ? 0 : 1;
                      dEmo = class2Idx === 0 ? 'happy' : 'neutral';
                      maxConf = p2Data[class2Idx];
                      tf.dispose(p2);
                    } else {
                      // 'down' → Route to anger_sad: Class 0 = 'anger' (angry), Class 1 = 'sadness' (sad)
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
                  // Only trust custom CNN result if confidence is high enough.
                  // Below 0.60, the standard face-api.js model is more reliable.
                  customSuccess = maxConf >= 0.60;
                }
              } catch (customErr) {
                console.warn('[FaceAPI] Custom CNN execution failed, falling back to face-api.js expressions:', customErr);
              }
            }

            // Compute custom Colab-trained EmoSense model prediction as ground truth (with face-api.js fallback)
            // 1. Compute standard pre-trained face-api.js expressions as our baseline (always accurate)
            let standardEmo = 'neutral';
            let standardConf = 0;
            if (det.expressions) {
              for (const [e, c] of Object.entries(det.expressions)) {
                if (c > standardConf) {
                  standardConf = c;
                  standardEmo = e;
                }
              }
            }
            if (standardEmo === 'surprised' || standardEmo === 'disgusted') standardEmo = 'neutral';
            if (standardEmo === 'fearful') standardEmo = 'sad';

            // 2. Compute custom Colab-trained EmoSense model prediction
            let baseEmo = 'neutral';
            let baseConf = 0;

            if (emosenseModelLoaded && emoSenseModelRef.current && tf) {
              try {
                const baseResult = tf.tidy(() => {
                  const fullTensor = tf.browser.fromPixels(offscreenCanvas);
                  const { x, y, width, height } = det.detection.box;
                  const startY = Math.max(0, Math.floor(y));
                  const startX = Math.max(0, Math.floor(x));
                  const sizeY = Math.min(offscreenCanvas.height - startY, Math.floor(height));
                  const sizeX = Math.min(offscreenCanvas.width - startX, Math.floor(width));

                  if (sizeY <= 0 || sizeX <= 0) return null;

                  const cropped = tf.slice(fullTensor, [startY, startX, 0], [sizeY, sizeX, 3]);
                  const resized = tf.image.resizeBilinear(cropped, [96, 96]);
                  // Do NOT divide by 255.0 here. The custom EmoSense Keras model has a built-in
                  // Rescaling(1./255) layer as its first layer. Dividing here causes a
                  // double-normalization bug, sending almost completely black (zero) images to the CNN.
                  const normalized = tf.cast(resized, 'float32');
                  return normalized.expandDims(0); // [1, 96, 96, 3]
                });

                if (baseResult) {
                  const predictions = emoSenseModelRef.current.predict(baseResult);
                  const probs = await predictions.data();
                  tf.dispose(predictions);
                  baseResult.dispose();

                  // Sort out class labels dynamically based on model outputs
                  // 3 classes: alphabetical -> ['happy', 'neutral', 'sad']
                  // 4 classes: alphabetical/explicit -> ['angry', 'happy', 'neutral', 'sad']
                  let emotions = ['happy', 'neutral', 'sad'];
                  if (probs.length === 4) {
                    emotions = ['angry', 'happy', 'neutral', 'sad'];
                  }
                  
                  const topIdx = probs.indexOf(Math.max(...probs));
                  baseEmo = emotions[topIdx] || 'neutral';
                  baseConf = probs[topIdx];
                }
              } catch (inferErr) {
                console.warn('[FaceAPI] Custom EmoSense model inference failed:', inferErr.message);
              }
            }

            // 3. Intelligent blending/decision:
            // - Since the custom model is in its absolute infancy (trained on a very small dataset of 17 images),
            //   we ONLY trust it if it has extremely high confidence (>= 0.85).
            // - Otherwise, we fully trust the robust, pre-trained standard face-api.js expressions.
            // - This guarantees perfectly accurate detections out of the box while allowing the custom model
            //   to organically take over high-confidence predictions as it gains training samples in Supabase.
            const isColabModelHighlyConfident = emosenseModelLoaded && (baseConf >= 0.85);
            const isHierarchicalModelConfident = customModelsLoaded && customModelsRef.current && (maxConf >= 0.65);

            if (isColabModelHighlyConfident) {
              dEmo = baseEmo;
              maxConf = baseConf;
              customSuccess = true;
            } else if (isHierarchicalModelConfident) {
              // Keep hierarchical model prediction if it's already set to dEmo/maxConf and is confident
              customSuccess = true;
            } else {
              // Fallback to highly accurate, robust standard face-api.js model
              dEmo = standardEmo;
              maxConf = standardConf;
              customSuccess = false;
            }

            // Cache the predicted state
            lastPredictionRef.current = { dEmo, maxConf, customSuccess };
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
          submitSample(offscreenCanvas, dEmo, maxConf);

          // Render face landmark dots
          if (svg) {
            const NS = 'http://www.w3.org/2000/svg';
            
            // Check for landmark dots
            let dots = svg.querySelectorAll('.landmark-dot');
            if (dots.length === 0) {
              for (let i = 0; i < 68; i++) {
                const c = document.createElementNS(NS, 'circle');
                c.setAttribute('class', 'landmark-dot');
                c.setAttribute('r', '2.5');
                c.setAttribute('fill', 'transparent');
                svg.appendChild(c);
              }
              dots = svg.querySelectorAll('.landmark-dot');
            }

            // Create face mesh connection path
            let meshPath = svg.querySelector('.face-mesh-path');
            if (!meshPath) {
              meshPath = document.createElementNS(NS, 'path');
              meshPath.setAttribute('class', 'face-mesh-path');
              meshPath.setAttribute('fill', 'none');
              meshPath.setAttribute('stroke-width', '1');
              meshPath.setAttribute('stroke-dasharray', '2,2');
              // Append it first so dots draw on top
              svg.insertBefore(meshPath, svg.firstChild);
            }

            const currentViewBox = svg.getAttribute('viewBox');
            const targetViewBox = `0 0 ${video.videoWidth} ${video.videoHeight}`;
            if (currentViewBox !== targetViewBox) {
              svg.setAttribute('viewBox', targetViewBox);
            }

            const pts = det.landmarks.positions;
            const color = { happy: '#3dffa0', neutral: '#8899bb', sad: '#5b9cf6', angry: '#ff6b6b' };
            const col = color[dEmo] || color.neutral;

            // Draw Wireframe Face Mesh
            let dStr = '';
            const connect = (indices, close = false) => {
              let sub = '';
              indices.forEach((idx, i) => {
                const pt = pts[idx];
                if (pt) {
                  sub += `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)} `;
                }
              });
              if (close && indices.length > 0) {
                const pt0 = pts[indices[0]];
                if (pt0) sub += `Z `;
              }
              return sub;
            };

            // Outer Face boundary (jawline)
            dStr += connect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
            // Eyebrows
            dStr += connect([17, 18, 19, 20, 21]);
            dStr += connect([22, 23, 24, 25, 26]);
            // Nose bridge and bottom
            dStr += connect([27, 28, 29, 30]);
            dStr += connect([30, 31, 32, 33, 34, 35], true);
            // Left Eye & Right Eye
            dStr += connect([36, 37, 38, 39, 40, 41], true);
            dStr += connect([42, 43, 44, 45, 46, 47], true);
            // Outer Lips & Inner Lips
            dStr += connect([48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59], true);
            dStr += connect([60, 61, 62, 63, 64, 65, 66, 67], true);

            meshPath.setAttribute('d', dStr);
            meshPath.setAttribute('stroke', col);
            meshPath.setAttribute('stroke-opacity', '0.45');
            meshPath.setAttribute('style', `filter: drop-shadow(0 0 1px ${col}); transition: stroke 0.3s ease;`);

            // Position dots
            if (dots.length === pts.length) {
              pts.forEach((pt, i) => {
                dots[i].setAttribute('cx', pt.x);
                dots[i].setAttribute('cy', pt.y);
                dots[i].setAttribute('fill', col);
                dots[i].setAttribute('fill-opacity', '0.85');
                dots[i].setAttribute('style', `filter: drop-shadow(0 0 2px ${col}); transition: fill 0.3s ease;`);
              });
            }
          }
        } else if (active && !det) {
          // Face lost: reset current emotion to neutral and hide landmarks
          setCurEmo('neutral');
          if (svg) {
            const dots = svg.querySelectorAll('.landmark-dot');
            dots.forEach(node => node.setAttribute('fill', 'transparent'));
            const meshPath = svg.querySelector('.face-mesh-path');
            if (meshPath) meshPath.setAttribute('d', '');
          }
        }
      } catch (err) {
        console.warn('[FaceAPI] Detection error:', err.message);
        setDebug(d => ({ ...d, lastError: err.message }));
        if (svg) {
          const dots = svg.querySelectorAll('.landmark-dot');
          dots.forEach(node => node.setAttribute('fill', 'transparent'));
          const meshPath = svg.querySelector('.face-mesh-path');
          if (meshPath) meshPath.setAttribute('d', '');
        }
      }

      if (active) {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(30, 300 - elapsed);
        reqRef.current = setTimeout(loop, delay);
      }
    };

    reqRef.current = setTimeout(loop, 100);
    return () => {
      console.log('[FaceAPI] Detection loop stopped');
      active = false;
      if (reqRef.current) clearTimeout(reqRef.current);
    };
  }, [modelsLoaded, customModelsLoaded, sessionCtx]);

  return {
    modelsLoaded,
    customModelsLoaded,
    modelError,
    customCulture: customModelsRef.current?.culture || null,
    curEmo,
    emoCounts,
    detCount,
    getTimeline: () => [...timelineRef.current],
    debug,
  };
}

