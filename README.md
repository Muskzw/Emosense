# EmoSense

Cross-cultural emotion detection AI built specifically for Zimbabwean and Chinese business contexts. 
Now powered by a modern **React frontend** and a **Node.js/SQLite backend**.

## Architecture

- **Frontend**: React, Vite, `face-api.js` (TensorFlow.js), WebRTC (PeerJS).
- **Backend**: Node.js, Express, SQLite (Session Persistence).

## Quick Start (Local Development)

This project requires two terminal windows to run simultaneously.

### 1. Start the Backend (Signaling & Database)
```bash
# In the new backend/ directory:
cd backend
npm install
npm start
```
*Runs on `http://localhost:3000`*
*Intercepts WebRTC connections and saves session reports to the `emosense.db` SQLite database.*

### 2. Start the Frontend (React UI)
Open a new terminal and run:
```bash
# In the frontend/ directory:
cd frontend
npm install
npm run dev
```
*Runs on `http://localhost:5173`*
*Open this URL in your browser to launch EmoSense.*

## Deploying to Production

When you are ready to deploy to a live server (e.g., Render or Railway):

1. **Build the frontend**: 
   ```bash
   cd frontend
   npm run build
   ```
   This compiles the React app into `frontend/dist`.

2. **Serve via backend**: 
   `server.js` is already configured to serve the `frontend/dist` folder statically. 
   Simply deploy the repository and start the production server:
   ```bash
   npm start
   ```

## Swap in your EmoSense CNN model

See `MODEL_SWAP_GUIDE.md` for full instructions on replacing the baseline model.

Short version:
1. Export your Keras model: `tensorflowjs_converter`
2. Put output in `frontend/public/models/`
3. Update `useFaceAPI.js` to point to the new model endpoint.
4. Done — 87.3% accuracy active.

## Compliance

All AI inference runs locally in-browser via TensorFlow.js.
No facial data or video streams are ever transmitted to the server.
Compliant with Zimbabwe's Cyber and Data Protection Act (2021).
