import React, { useEffect, useRef, useState } from 'react';
import { useFaceAPI, EMO } from '../hooks/useFaceAPI';

export default function MirrorRoom({ webRTC, sessionInfo, onJoin, onBack }) {
  const { startCamera, faceStream } = webRTC;
  const localVideoRef = useRef(null);
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const [micLevel, setMicLevel] = useState(0);
  const [joinError, setJoinError] = useState('');
  const [joiningState, setJoiningState] = useState(false);
  const [waitingForHost, setWaitingForHost] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const { modelsLoaded, curEmo } = useFaceAPI(
    localVideoRef, svgRef, canvasRef, true, sessionInfo.ctx, sessionInfo.optIn
  );

  useEffect(() => {
    if (!faceStream) {
      startCamera();
    } else if (localVideoRef.current) {
      localVideoRef.current.srcObject = faceStream;
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
      // Guest joining
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
    } else {
      // Host starting
      try {
        await fetch(`/api/rooms/${sessionInfo.roomId}/start`, { method: 'POST' });
      } catch(err) {
        console.error('Failed to mark room as active', err);
      }
    }
    onJoin();
  };

  const isHost = !sessionInfo.targetPeerId;
  const eConf = EMO[curEmo] || EMO.neutral;

  return (
    <div className="screen active" style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'var(--txt)',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes micPulse { 0%,100%{opacity:1} 50%{opacity:.5} }

        .mr-wrap {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        /* ── TOP NAV BAR ── */
        .mr-nav {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          padding-top: calc(12px + env(safe-area-inset-top));
          border-bottom: 0.5px solid var(--bd);
          background: var(--surf);
          flex-shrink: 0;
        }
        .mr-back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--surf2);
          border: 0.5px solid var(--bd2);
          color: var(--txt);
          padding: 8px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .mr-back-btn:active { background: var(--bd2); }
        .mr-nav-title {
          flex: 1;
          text-align: center;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .mr-nav-spacer { width: 80px; flex-shrink: 0; }

        /* ── VIDEO AREA (fills available space) ── */
        .mr-video-area {
          flex: 1;
          min-height: 0;
          position: relative;
          background: #000;
          overflow: hidden;
        }
        .mr-video-area video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }
        .mr-video-area svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          transform: scaleX(-1);
          pointer-events: none;
        }

        /* Emotion badge — pinned bottom-center of video */
        .mr-emo-badge {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(10,10,15,0.82);
          backdrop-filter: blur(16px);
          border-radius: 999px;
          padding: 10px 20px;
          white-space: nowrap;
          box-shadow: 0 4px 24px rgba(0,0,0,0.4);
        }
        .mr-emo-dot {
          width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
        }
        .mr-emo-label {
          font-size: 14px; font-weight: 700; letter-spacing: 0.06em; color: white;
        }

        /* AI loading overlay */
        .mr-loading {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.65);
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(8px);
        }
        .mr-loading span {
          color: #ffb347; font-weight: 700; font-size: 15px;
          display: flex; align-items: center; gap: 10px;
        }
        .mr-spinner {
          width: 16px; height: 16px;
          border: 2.5px solid #ffb347;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* ── BOTTOM PANEL ── */
        .mr-bottom {
          flex-shrink: 0;
          background: var(--surf);
          border-top: 0.5px solid var(--bd);
          padding: 16px;
          padding-bottom: calc(16px + env(safe-area-inset-bottom));
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Mic meter */
        .mr-mic {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .mr-mic-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-family: var(--mono);
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--muted);
        }
        .mr-mic-status { color: var(--green); }
        .mr-mic-track {
          height: 5px;
          background: var(--bd2);
          border-radius: 999px;
          overflow: hidden;
        }
        .mr-mic-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.1s ease;
        }

        /* Divider */
        .mr-divider {
          width: 0.5px;
          height: 36px;
          background: var(--bd2);
          flex-shrink: 0;
        }

        /* Join button */
        .mr-join-btn {
          flex-shrink: 0;
          padding: 14px 24px;
          border-radius: 14px;
          border: none;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .mr-join-btn:active { transform: scale(0.96); }
        .mr-join-btn.ready {
          background: linear-gradient(135deg, #5b9cf6 0%, #3a7bd5 100%);
          color: white;
          box-shadow: 0 8px 24px rgba(91,156,246,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .mr-join-btn.waiting {
          background: var(--surf2);
          color: var(--muted);
          cursor: not-allowed;
        }

        /* Sub-hint text */
        .mr-hint {
          text-align: center;
          font-size: 11px;
          font-family: var(--mono);
          color: var(--muted);
          padding: 0 16px 8px;
          flex-shrink: 0;
        }
      `}</style>

      <div className="mr-wrap">

        {/* ── TOP NAV ── */}
        <div className="mr-nav">
          <button className="mr-back-btn" onClick={onBack}>
            ← Back
          </button>
          <div className="mr-nav-title">Check Your Setup</div>
          <div className="mr-nav-spacer" />
        </div>

        {/* ── VIDEO (fills all remaining space) ── */}
        <div className="mr-video-area">
          <video ref={localVideoRef} autoPlay muted playsInline />
          <svg ref={svgRef} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Emotion badge */}
          <div className="mr-emo-badge" style={{ border: `1px solid ${eConf.c}66` }}>
            <div className="mr-emo-dot" style={{ background: eConf.c, boxShadow: `0 0 8px ${eConf.c}` }} />
            <span className="mr-emo-label" style={{ color: eConf.c }}>
              AI SENSOR: {eConf.n.toUpperCase()}
            </span>
          </div>

          {/* AI loading overlay */}
          {!modelsLoaded && (
            <div className="mr-loading">
              <span>
                <div className="mr-spinner" />
                Initializing AI Models…
              </span>
            </div>
          )}

          {waitingForHost && (
            <div className="mr-emo-badge" style={{ bottom: '70px', border: '1px solid rgba(255,179,71,0.4)', background: 'rgba(255,179,71,0.1)' }}>
              <div className="mr-spinner" style={{ width: '14px', height: '14px', borderColor: '#ffb347', borderTopColor: 'transparent', borderWidth: '2px' }} />
              <span className="mr-emo-label" style={{ color: '#ffb347', fontSize: '13px' }}>WAITING FOR HOST…</span>
            </div>
          )}
        </div>

        {/* ── HINT ── */}
        <div className="mr-hint">
          Ensure your camera and mic are working before joining
        </div>

        {/* ── BOTTOM PANEL ── */}
        <div className="mr-bottom">

          {/* Mic meter */}
          <div className="mr-mic">
            <div className="mr-mic-row">
              <span>MICROPHONE</span>
              <span className="mr-mic-status" style={{ color: micLevel > 10 ? 'var(--green)' : 'var(--muted)' }}>
                {micLevel > 10 ? 'DETECTING' : 'SILENT'}
              </span>
            </div>
            <div className="mr-mic-track">
              <div
                className="mr-mic-fill"
                style={{
                  width: `${micLevel}%`,
                  background: micLevel > 80 ? 'var(--red)' : 'var(--green)',
                }}
              />
            </div>
          </div>

          <div className="mr-divider" />

          {/* Join / Start button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {waitingForHost && (
                <button className="mr-back-btn" onClick={onBack} style={{ padding: '14px 24px', borderRadius: '14px', fontSize: '15px' }}>
                  Cancel
                </button>
              )}
              <button
                className={`mr-join-btn ${(modelsLoaded && !joiningState) ? 'ready' : 'waiting'}`}
                onClick={handleJoinClick}
                disabled={!modelsLoaded || joiningState}
              >
                {joiningState ? <div className="mr-spinner" style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }} /> : (isHost ? 'Start Session →' : 'Join Session →')}
              </button>
            </div>
            {joinError && (
              <div style={{ color: 'var(--red)', fontSize: '12px', fontWeight: '500' }}>
                ⚠ {joinError}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
