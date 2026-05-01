// EmoSense Face Detection Web Worker
// Runs TensorFlow.js / face-api.js off the main thread
// Uses OffscreenCanvas to process video frames without touching the DOM

importScripts('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js');

let modelsLoaded = false;
let isDetecting = false;

self.onmessage = async ({ data }) => {
  const { type, payload } = data;

  if (type === 'LOAD_MODELS') {
    try {
      const M = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(M),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(M),
        faceapi.nets.faceExpressionNet.loadFromUri(M),
      ]);
      modelsLoaded = true;
      self.postMessage({ type: 'MODELS_LOADED' });
    } catch (err) {
      self.postMessage({ type: 'MODELS_ERROR', error: err.message });
    }
  }

  if (type === 'DETECT' && modelsLoaded && !isDetecting) {
    isDetecting = true;
    const { bitmap, width, height } = payload;
    try {
      // Draw frame into OffscreenCanvas — no DOM access needed
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close(); // free transferable memory

      const det = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
        .withFaceLandmarks(true)
        .withFaceExpressions();

      if (det) {
        self.postMessage({
          type: 'DETECTION',
          payload: {
            expressions: { ...det.expressions },
            landmarks: det.landmarks.positions.map(p => ({ x: p.x, y: p.y })),
            width,
            height,
          },
        });
      } else {
        self.postMessage({ type: 'NO_FACE' });
      }
    } catch (err) {
      self.postMessage({ type: 'DETECT_ERROR', error: err.message });
    } finally {
      isDetecting = false;
    }
  }
};
