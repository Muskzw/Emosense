import React, { useRef, useEffect } from 'react';
import { useFaceAPI, EMO } from '../hooks/useFaceAPI';

const S = {
  // ── Layout
  root: {
    position: 'fixed', inset: 0, overflow: 'hidden',
    background: 'radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0f 100%)',
    fontFamily: 'system-ui, -apple-system, "SF Pro Display", sans-serif',
  },
  // ── Remote video — edge-to-edge
  remoteFill: {
    position: 'absolute', inset: 0,
    background: '#0a0a0f',
  },
  remoteVid: {
    position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
  },
  // ── Waiting state — frosted orb
  waitOrb: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px',
    background: 'transparent', zIndex: 5,
  },
  orbCircle: {
    width: '88px', height: '88px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 0 40px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'orbPulse 2.2s ease-in-out infinite',
  },
  orbTxt: {
    fontSize: '14px', color: 'rgba(255,255,255,0.55)',
    fontWeight: '500', letterSpacing: '0.02em',
    textShadow: '0 1px 8px rgba(0,0,0,0.5)',
  },
  // ── TOP BAR — transparent overlay
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 24px 0',
    pointerEvents: 'none',
  },
  topLeft: {
    display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'all',
  },
  logoMark: {
    width: '34px', height: '34px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoTxt: {
    fontSize: '15px', fontWeight: '700', color: 'white', letterSpacing: '-0.02em',
  },
  timer: {
    fontSize: '17px', fontWeight: '600',
    fontVariantNumeric: 'tabular-nums',
    color: 'rgba(255,255,255,0.9)',
    textShadow: '0 0 20px rgba(255,255,255,0.3)',
    letterSpacing: '0.02em',
    position: 'absolute', left: '50%', transform: 'translateX(-50%)',
    pointerEvents: 'none',
  },
  ctxBadge: {
    padding: '5px 12px', borderRadius: '999px',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.18)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
    fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.7)',
    pointerEvents: 'all',
  },
  livePill: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '4px 10px', borderRadius: '999px',
    background: 'rgba(255,59,48,0.2)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,59,48,0.35)',
    fontSize: '10px', fontWeight: '600', color: '#ff3b30',
    letterSpacing: '0.06em',
    pointerEvents: 'all',
  },
  // ── LOCAL PIP — bottom-right glassy pill
  localPip: {
    position: 'absolute', bottom: '110px', right: '18px',
    width: '110px', height: '150px', borderRadius: '28px',
    overflow: 'hidden', zIndex: 20,
    border: '1.5px solid rgba(255,255,255,0.28)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 4px rgba(120,200,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
    background: '#0a0a0f',
  },
  localVid: {
    width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)',
  },
  localLabel: {
    position: 'absolute', bottom: '8px', left: 0, right: 0, textAlign: 'center',
    fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: '500',
    letterSpacing: '0.04em', textShadow: '0 1px 4px rgba(0,0,0,0.8)',
  },
  // ── HUD SIDEBAR — floating glassy panel
  hud: {
    position: 'absolute', top: '80px', right: '18px',
    width: '220px', borderRadius: '20px',
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.18)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
    padding: '16px',
    zIndex: 20,
    animation: 'fadeInUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
  },
  hudLabel: {
    fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px',
  },
  emoRow: { display: 'flex', flexDirection: 'column', gap: '10px' },
  emoItem: { display: 'flex', flexDirection: 'column', gap: '5px' },
  emoHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  emoName: { fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  emoPct: { fontSize: '12px', color: 'white', fontWeight: '700' },
  emoTrack: {
    height: '4px', borderRadius: '999px',
    background: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  hudDivider: { height: '1px', background: 'rgba(255,255,255,0.1)', margin: '14px 0' },
  statsRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  statVal: { fontSize: '20px', fontWeight: '700', color: 'white', lineHeight: 1 },
  statLbl: { fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '3px' },
  // ── BOTTOM BAR
  botBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 24px 28px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
  },
  endBtn: {
    padding: '14px 32px', borderRadius: '999px',
    background: 'rgba(255,59,48,0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 8px 32px rgba(255,59,48,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
    color: 'white', fontSize: '15px', fontWeight: '700',
    cursor: 'pointer', letterSpacing: '-0.01em',
    transition: 'all 0.2s ease',
  },
  aiStatus: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '8px 14px', borderRadius: '999px',
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.14)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
    fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.7)',
  },
};

const EMO_COLORS = {
  happy: '#34c759',
  neutral: 'rgba(255,255,255,0.5)',
  sad: '#5b9cf6',
  angry: '#ff3b30',
};

export default function CallView({ onEnd, webRTC, sessionInfo, callSecs }) {
  const { remoteName, isConnected, remoteVideoRef, localVideoRef, endCall } = webRTC;
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const endBtnRef = useRef(null);

  const { modelsLoaded, curEmo, emoCounts, detCount } = useFaceAPI(
    remoteVideoRef, svgRef, canvasRef, isConnected, sessionInfo.ctx
  );

  const handleEnd = () => {
    endCall();
    onEnd(emoCounts);
  };

  useEffect(() => {
    if (localVideoRef.current && webRTC.faceStream) {
      localVideoRef.current.srcObject = webRTC.faceStream;
    }
  }, [webRTC.faceStream]);

  const getEmoTotal = () => (emoCounts.happy + emoCounts.neutral + emoCounts.sad + emoCounts.angry) || 1;
  const getPct = (n) => ((n / getEmoTotal()) * 100).toFixed(0);
  const curE = EMO[curEmo] || EMO.neutral;

  const timerStr = `${String(Math.floor(callSecs / 60)).padStart(2, '0')}:${String(callSecs % 60).padStart(2, '0')}`;

  return (
    <div style={S.root}>
      {/* Keyframe injection */}
      <style>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.25); }
          50% { transform: scale(1.07); box-shadow: 0 0 60px rgba(255,255,255,0.16), inset 0 1px 0 rgba(255,255,255,0.3); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ping {
          0%   { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .end-btn:active { transform: scale(0.96) !important; }
      `}</style>

      {/* ── REMOTE VIDEO (full screen) */}
      <div style={S.remoteFill}>
        {/* Always in DOM so the ref is ready when the stream arrives */}
        <video
          ref={remoteVideoRef}
          style={{ ...S.remoteVid, display: isConnected ? 'block' : 'none' }}
          autoPlay
          playsInline
        />
        <svg
          ref={svgRef}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: 4,
            display: isConnected ? 'block' : 'none'
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Waiting state — always in DOM, hidden when connected */}
        <div style={{ ...S.waitOrb, display: isConnected ? 'none' : 'flex' }}>
          <div style={S.orbCircle}>
            <svg viewBox="0 0 28 28" width="28" height="28" fill="none">
              <circle cx="14" cy="10" r="5.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
              <path d="M5 26c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={S.orbTxt}>Waiting for peer…</div>
        </div>
      </div>

      {/* ── TOP BAR */}
      <div style={S.topBar}>
        <div style={S.topLeft}>
          <div style={S.logoMark}>
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <circle cx="8" cy="5.5" r="2.8" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2"/>
              <path d="M2.5 14c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          {isConnected && (
            <div style={S.livePill}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ff3b30', animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite' }} />
              LIVE
            </div>
          )}
        </div>

        <div style={S.timer}>{timerStr}</div>

        <div style={S.ctxBadge}>{sessionInfo.ctx}</div>
      </div>

      {/* ── FLOATING HUD (Live Breakdown) */}
      <aside style={S.hud}>
        <div style={S.hudLabel}>Live Breakdown</div>
        <div style={S.emoRow}>
          {[
            { key: 'happy', label: 'Happy', count: emoCounts.happy },
            { key: 'neutral', label: 'Neutral', count: emoCounts.neutral },
            { key: 'sad', label: 'Sad', count: emoCounts.sad },
            { key: 'angry', label: 'Angry', count: emoCounts.angry },
          ].map(({ key, label, count }) => (
            <div key={key} style={S.emoItem}>
              <div style={S.emoHead}>
                <span style={S.emoName}>{label}</span>
                <span style={S.emoPct}>{getPct(count)}%</span>
              </div>
              <div style={S.emoTrack}>
                <div style={{
                  height: '100%', borderRadius: '999px',
                  background: EMO_COLORS[key],
                  width: `${getPct(count)}%`,
                  transition: 'width 0.6s ease',
                  boxShadow: `0 0 8px ${EMO_COLORS[key]}`,
                }} />
              </div>
            </div>
          ))}
        </div>
        <div style={S.hudDivider} />
        <div style={S.statsRow}>
          <div style={{ textAlign: 'left' }}>
            <div style={S.statVal}>{detCount}</div>
            <div style={S.statLbl}>Scans</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ ...S.statVal, color: curE.c }}>{curE.n}</div>
            <div style={S.statLbl}>Current</div>
          </div>
        </div>
      </aside>

      {/* ── LOCAL PIP */}
      <div style={S.localPip}>
        <video ref={localVideoRef} style={S.localVid} autoPlay muted playsInline />
        <div style={S.localLabel}>You</div>
      </div>

      {/* ── BOTTOM BAR */}
      <div style={S.botBar}>
        <button
          ref={endBtnRef}
          className="end-btn"
          onClick={handleEnd}
          style={S.endBtn}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,59,48,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,59,48,0.35), inset 0 1px 0 rgba(255,255,255,0.2)'}
        >
          End Session
        </button>
        <div style={S.aiStatus}>
          <div style={{ position: 'relative', width: '8px', height: '8px', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: modelsLoaded ? '#34c759' : '#ffb347' }} />
            {modelsLoaded && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#34c759', animation: 'ping 1.8s ease-out infinite' }} />
            )}
          </div>
          {modelsLoaded ? 'AI Models Active' : 'Loading AI…'}
        </div>
      </div>
    </div>
  );
}
