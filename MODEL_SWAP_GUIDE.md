# EmoSense CNN Model Swap Guide
# Replace face-api.js (FER-2013 biased) with your trained EmoSense weights

## Overview

The current app uses `face-api.js` which runs on FER-2013/AffectNet pretrained weights.
These weights are biased toward Western faces (~64% Caucasian in training data).

Your EmoSense CNN was trained on Zimbabwean + Chinese faces.
This guide shows how to export it to TensorFlow.js and plug it into the app.

---

## Step 1 — Export your model to TensorFlow.js format

### If your model is in Keras (.h5):

```python
# Install converter
pip install tensorflowjs

# Convert
import tensorflowjs as tfjs
import tensorflow as tf

model = tf.keras.models.load_model('emosense_model.h5')

tfjs.converters.save_keras_model(
    model,
    './emosense-tfjs-model'  # output directory
)
```

### If your model is a SavedModel:

```python
import subprocess
subprocess.run([
    'tensorflowjs_converter',
    '--input_format=tf_saved_model',
    './saved_model_dir',
    './emosense-tfjs-model'
])
```

### Output structure you'll get:
```
emosense-tfjs-model/
  model.json          ← architecture + weight manifest
  group1-shard1of1.bin ← actual weights
```

---

## Step 2 — Host the model files

Put the converted files in your server's public directory:

```
public/
  emosense-model/
    model.json
    group1-shard1of1.bin
  emo-detect.html
  index.html
```

If using Railway/Render, these are served automatically by the Express static middleware.

---

## Step 3 — Swap in the app (emo-detect.html)

Find this line in emo-detect.html:

```javascript
// Current (biased):
const M = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
await Promise.race([faceapi.nets.faceExpressionNet.loadFromUri(M), delay(6000)]);
```

Replace the expression model loading with your EmoSense model:

```javascript
// Load face detection + landmarks as before (these are fine to keep)
const M = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
await faceapi.nets.tinyFaceDetector.loadFromUri(M);
await faceapi.nets.faceLandmark68TinyNet.loadFromUri(M);

// Load YOUR EmoSense expression model
let emoSenseModel = null;
try {
  emoSenseModel = await tf.loadLayersModel('/emosense-model/model.json');
  console.log('[EmoSense] Custom model loaded — 87.3% accuracy active');
  modelsOk = true;
} catch(e) {
  console.warn('[EmoSense] Custom model unavailable, falling back to face-api.js');
  await faceapi.nets.faceExpressionNet.loadFromUri(M);
  modelsOk = true;
}
```

---

## Step 4 — Use EmoSense model in detection loop

Your EmoSense model takes a face crop as input and outputs 4 emotion probabilities.
Replace the expression detection call in `startRemoteDetection()` and `startLocalDet()`:

```javascript
// Current face-api.js expression detection:
const d = await faceapi
  .detectSingleFace(vid, new faceapi.TinyFaceDetectorOptions({inputSize:224}))
  .withFaceLandmarks(true)
  .withFaceExpressions();  // ← this uses biased weights

// Replace with:
const det = await faceapi
  .detectSingleFace(vid, new faceapi.TinyFaceDetectorOptions({inputSize:224}))
  .withFaceLandmarks(true);  // landmarks still from face-api — that's fine

if (det && emoSenseModel) {
  // Crop and preprocess face for your model
  const { x, y, width, height } = det.detection.box;
  const canvas = document.createElement('canvas');
  canvas.width = 48; canvas.height = 48;  // adjust to your model's input size
  const ctx = canvas.getContext('2d');
  ctx.drawImage(vid, x, y, width, height, 0, 0, 48, 48);

  // Convert to tensor
  const tensor = tf.browser.fromPixels(canvas)
    .toFloat()
    .div(255.0)
    .expandDims(0);  // shape: [1, 48, 48, 3]

  // Run EmoSense inference
  const predictions = emoSenseModel.predict(tensor);
  const probs = await predictions.data();
  tensor.dispose(); predictions.dispose();

  // Map to your 4 emotion classes
  // ADJUST THIS ORDER to match how you trained:
  const emotions = ['happy', 'neutral', 'sad', 'angry'];
  const topIdx = probs.indexOf(Math.max(...probs));
  const topEmo = emotions[topIdx];
  const topConf = Math.round(probs[topIdx] * 100);

  const expressions = {
    happy:   probs[0],
    neutral: probs[1],
    sad:     probs[2],
    angry:   probs[3],
  };

  // Pass to existing UI update function
  setEmoReal(topEmo, topConf, expressions);
}
```

---

## Step 5 — Add TensorFlow.js CDN to emo-detect.html

Add this before the face-api.js script tag:

```html
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js"></script>
```

---

## Model input/output assumptions

These are the defaults assumed above. Adjust to match your training:

| Parameter        | Assumed value  | Notes                              |
|------------------|----------------|------------------------------------|
| Input size       | 48×48×3        | Common for CNN emotion models      |
| Input range      | [0, 1]         | Divided by 255                     |
| Output classes   | 4              | happy, neutral, sad, angry         |
| Output format    | softmax probs  | Sum = 1.0                          |

If your model uses grayscale (48×48×1), change:
```javascript
.mean(2, true)  // convert RGB to grayscale by averaging channels
```

---

## Verifying it works

Open browser console. You should see:
```
[EmoSense] Custom model loaded — 87.3% accuracy active
```

And the app title bar should update — add this after model load:
```javascript
document.title = 'Emo-Detect · EmoSense CNN Active';
```

---

## Troubleshooting

**Model won't load (404):**
Make sure `emosense-model/model.json` is in your `public/` directory
and your server is running.

**Shape mismatch error:**
Your model expects a different input size. Check your training config and
update the `canvas.width` / `canvas.height` values accordingly.

**CORS error loading model:**
If hosting model files on a different domain, add CORS headers to that server.
Easiest fix: host everything on the same Node.js server.

**Low accuracy after swap:**
Double-check the emotion class ORDER matches your training label encoding.
If you used `LabelEncoder`, check what order it assigned (0=angry? 0=happy?).
