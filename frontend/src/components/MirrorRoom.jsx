import React, { useEffect, useRef, useState } from 'react';
import { useFaceAPI, EMO } from '../hooks/useFaceAPI';

export default function MirrorRoom({ webRTC, sessionInfo, onJoin, onBack }) {
  const { startCamera, faceStream, localVideoRef, isConnected } = webRTC;
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const [micLevel, setMicLevel] = useState(0);
  const [joinError, setJoinError] = useState('');
  const [joiningState, setJoiningState] = useState(false);
  const [waitingForHost, setWaitingForHost] = useState(false);
  const [waitingForStream, setWaitingForStream] = useState(false);
  const isMounted = useRef(true);
  const connectionTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    };
  }, []);

  const { modelsLoaded, customModelsLoaded, curEmo, modelError } = useFaceAPI(
    localVideoRef, svgRef, canvasRef, true, sessionInfo.ctx, sessionInfo.optIn
  );

  const needsCustomModel = !!(sessionInfo.ctx && (
    sessionInfo.ctx.toLowerCase().includes('china') || 
    sessionInfo.ctx.toLowerCase().includes('cn') || 
    sessionInfo.ctx.toLowerCase().includes('zimbabwe') || 
    sessionInfo.ctx.toLowerCase().includes('zw')
  ));

  const isReady = modelsLoaded && (!needsCustomModel || customModelsLoaded);

  useEffect(() => {
    if (!faceStream) {
      startCamera();
    } else if (localVideoRef.current) {
      const video = localVideoRef.current;
      video.srcObject = faceStream;
      video.play().catch(e => console.warn('[MirrorRoom] Autoplay was prevented:', e));
    }
  }, [faceStream, startCamera]);

  useEffect(() => {
    if (!faceStream) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const microphone = audioCtx.createMediaStreamSource(faceStream);
    microphone.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let reqId;
    const updateMicLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const avg = sum / bufferLength;
      setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
      reqId = requestAnimationFrame(updateMicLevel);
    };
    updateMicLevel();

    return () => {
      cancelAnimationFrame(reqId);
      audioCtx.close();
    };
  }, [faceStream]);

  const handleJoinClick = async () => {
    setJoiningState(true);
    setJoinError('');

    if (sessionInfo.targetPeerId) {
      setWaitingForHost(true);
      try {
        let active = false;
        for (let i = 0; i < 30; i++) {
          if (!isMounted.current) return;
          const res = await fetch(`/api/rooms/${sessionInfo.roomId}/status`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'active') {
              active = true;
              break;
            }
          }
          await new Promise(r => setTimeout(r, 2500));
        }
        if (!isMounted.current) return;
        setWaitingForHost(false);
        if (!active) {
          setJoinError("Host hasn't started yet — try again.");
          setJoiningState(false);
          return;
        }
      } catch (err) {
        console.error('Status check error:', err);
        if (!isMounted.current) return;
        setWaitingForHost(false);
        setJoinError("Failed to connect to server. Try again.");
        setJoiningState(false);
        return;
      }
      webRTC.joinCall(sessionInfo.targetPeerId, sessionInfo.uName);
      setWaitingForStream(true);

      // Safety timeout: if stream never arrives within 30s, unblock the guest
      connectionTimeoutRef.current = setTimeout(() => {
        if (!isMounted.current) return;
        if (!webRTC.isConnected) {
          setWaitingForStream(false);
          setJoiningState(false);
          setJoinError('Could not reach the host — check your network and try again.');
        }
      }, 30000);
    } else {
      try {
        await fetch(`/api/rooms/${sessionInfo.roomId}/start`, { method: 'POST' });
      } catch (err) {
        console.error('Failed to mark room as active', err);
      }
      onJoin();
    }
  };

  useEffect(() => {
    if (waitingForStream && isConnected) {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      if (isMounted.current) onJoin();
    }
  }, [isConnected, waitingForStream]);

  const isHost = !sessionInfo.targetPeerId;
  const eConf = EMO[curEmo] || EMO.neutral;

  return (
    <div className="screen active" style={{
      display: 'flex', flexDirection: 'column',
      background: 'radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0f 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'white',
      overflow: 'hidden',
      position: 'fixed',
      inset: 0
    }}>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

        .mr-bg-glow {
          position: absolute;
          top: 50%; left: 50%;
          width: 800px; height: 800px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, ${eConf.c}11 0%, transparent 70%);
          pointer-events: none;
          transition: background 1s ease;
          z-index: 0;
        }

        .mr-top {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: max(24px, env(safe-area-inset-top)) 32px 0;
        }
        
        .mr-back {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mr-back:hover { background: rgba(255,255,255,0.1); transform: translateX(-2px); }

        .mr-title {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }

        .mr-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 10;
          padding: 16px 20px;
          gap: 16px;
          min-height: 0;
          overflow: hidden;
        }

        .mr-video-container {
          width: 100%;
          max-width: 900px;
          /* Use aspect-ratio but cap height so it never overflows on laptop */
          aspect-ratio: 16/9;
          max-height: calc(100vh - 280px);
          border-radius: 32px;
          overflow: hidden;
          position: relative;
          background: #000;
          box-shadow: 0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08);
          animation: float 6s ease-in-out infinite;
          flex-shrink: 0;
        }

        @media (max-height: 800px) {
          .mr-video-container {
            max-height: calc(100vh - 300px);
          }
        }

        .mr-video-container video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        .mr-landmark-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          transform: scaleX(-1);
          pointer-events: none;
        }

        .mr-emo-glass {
          position: absolute;
          top: 24px;
          right: 24px;
          background: rgba(10, 10, 15, 0.7);
          backdrop-filter: blur(24px) saturate(150%);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 12px 24px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
          transition: all 0.3s ease;
        }

        .mr-emo-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          box-shadow: 0 0 12px currentColor;
        }

        .mr-emo-text {
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .mr-loading {
          position: absolute;
          inset: 0;
          background: rgba(10,10,15,0.8);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20;
        }

        .mr-spinner {
          width: 24px; height: 24px;
          border: 3px solid #ffb347;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .mr-controls {
          width: 100%;
          max-width: 900px;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(30px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 20px 28px;
          display: flex;
          align-items: center;
          gap: 28px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          flex-shrink: 0;
        }

        .mr-mic-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mr-mic-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
        }

        .mr-mic-bar {
          height: 8px;
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          overflow: hidden;
          position: relative;
        }

        .mr-mic-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.1s ease, background 0.2s ease;
          box-shadow: 0 0 10px currentColor;
        }

        .mr-action-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }

        .mr-btn-primary {
          background: linear-gradient(135deg, #5b9cf6 0%, #3a7bd5 100%);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 10px 30px rgba(91,156,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          gap: 12px;
          white-space: nowrap;
        }

        .mr-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(91,156,246,0.5), inset 0 1px 0 rgba(255,255,255,0.2);
        }

        .mr-btn-primary:active:not(:disabled) {
          transform: scale(0.96);
        }

        .mr-btn-primary:disabled {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.3);
          box-shadow: none;
          cursor: not-allowed;
        }

        .mr-btn-cancel {
          background: rgba(255,59,48,0.1);
          color: #ff3b30;
          border: 1px solid rgba(255,59,48,0.3);
          padding: 16px 32px;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mr-btn-cancel:hover { background: rgba(255,59,48,0.2); }

        /* Laptop / medium screens — tighten vertical spacing */
        @media (max-width: 1200px) and (min-width: 769px) {
          .mr-video-container { max-height: calc(100vh - 200px); animation: none; }
          .mr-main { gap: 12px; padding: 12px 20px; }
          .mr-controls { padding: 16px 24px; gap: 20px; }
        }

        @media (max-width: 768px) {
          .mr-main {
            padding: 10px 16px;
            justify-content: flex-start;
            overflow-y: auto;
            gap: 12px;
          }
          .mr-video-container {
            aspect-ratio: 4/3;
            max-width: 440px;
            max-height: none;
            border-radius: 24px;
            animation: none;
            margin: 0 auto;
          }
          .mr-controls {
            flex-direction: column;
            padding: 20px;
            gap: 20px;
            max-width: 440px;
            margin: 0 auto;
            border-radius: 20px;
          }
          .mr-action-wrap {
            width: 100%;
            align-items: stretch;
          }
          .mr-btn-primary {
            justify-content: center;
          }
        }
      `}</style>

      {/* Dynamic Background Glow */}
      <div className="mr-bg-glow" />

      {/* TOP NAV */}
      <div className="mr-top">
        <button className="mr-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Leave
        </button>
        <div className="mr-title">Equipment Check</div>
        <div style={{ width: '84px' }} /> {/* Spacer */}
      </div>

      {/* MAIN CONTENT */}
      <div className="mr-main">
        
        {/* VIDEO CONTAINER */}
        <div className="mr-video-container">
          <video ref={localVideoRef} autoPlay muted playsInline />
          <svg
            ref={svgRef}
            preserveAspectRatio="xMidYMid slice"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              transform: 'scaleX(-1)',
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* AI Emotion Badge */}
          <div className="mr-emo-glass" style={{ border: `1px solid ${eConf.c}44` }}>
            <div className="mr-emo-dot" style={{ background: eConf.c, color: eConf.c }} />
            <div className="mr-emo-text" style={{ color: eConf.c }}>
              AI Sensor: {eConf.n}
            </div>
          </div>

          {/* Loading Overlay */}
          {!isReady && (
            <div className="mr-loading">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ffb347', fontWeight: '700', fontSize: '16px' }}>
                <div className="mr-spinner" />
                {!modelsLoaded ? "Initializing Base Neural Networks..." : `Activating ${sessionInfo.ctx} Cultural AI Models...`}
              </div>
            </div>
          )}

          {/* Waiting for Host Overlay */}
          {waitingForHost && (
            <div className="mr-loading" style={{ background: 'rgba(10,10,15,0.85)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#5b9cf6', fontWeight: '700', fontSize: '16px' }}>
                <div className="mr-spinner" style={{ borderColor: '#5b9cf6', borderTopColor: 'transparent' }} />
                Waiting for host to start session...
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="mr-controls">
          
          <div className="mr-mic-wrap">
            <div className="mr-mic-header">
              <span>Microphone</span>
              <span style={{ color: micLevel > 10 ? '#3dffa0' : 'rgba(255,255,255,0.4)' }}>
                {micLevel > 10 ? 'Detecting' : 'Silent'}
              </span>
            </div>
            <div className="mr-mic-bar">
              <div 
                className="mr-mic-fill" 
                style={{ 
                  width: `${micLevel}%`, 
                  background: micLevel > 80 ? '#ff6b6b' : '#3dffa0',
                  color: micLevel > 80 ? '#ff6b6b' : '#3dffa0'
                }} 
              />
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              Ensure your face is clearly visible and audio is picking up.
            </div>
          </div>

          <div className="mr-action-wrap">
            {modelError && (
              <div style={{ color: '#ff6b6b', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
                ⚠ AI models failed to load. Check your connection.
              </div>
            )}
            {waitingForHost ? (
              <button className="mr-btn-cancel" onClick={() => {
                setWaitingForHost(false);
                setJoiningState(false);
                setJoinError('');
                onBack();
              }}>
                Cancel Request
              </button>
            ) : (
              <button 
                className="mr-btn-primary" 
                onClick={handleJoinClick}
                disabled={!isReady || !faceStream || joiningState}
              >
                {joiningState ? (
                  <><div className="mr-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.5)', borderTopColor: 'white' }} /> Connecting...</>
                ) : (
                  <>{isHost ? 'Start Session' : 'Join Session'} <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></>
                )}
              </button>
            )}
            
            {joinError && (
              <div style={{ color: '#ff6b6b', fontSize: '13px', fontWeight: '600', marginTop: '4px' }}>
                ⚠ {joinError}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
