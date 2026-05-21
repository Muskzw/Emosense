import React, { useRef, useEffect, useState } from 'react';
import { useFaceAPI, EMO } from '../hooks/useFaceAPI';
import { useSpeech } from '../hooks/useSpeech';

const S = {
  // ── Layout
  root: {
    position: 'fixed', inset: 0, overflow: 'hidden',
    background: 'radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0f 100%)',
    fontFamily: 'system-ui, -apple-system, "SF Pro Display", sans-serif',
    colorScheme: 'dark',
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
    padding: 'max(18px, calc(12px + env(safe-area-inset-top))) 20px 0',
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
    padding: '5px 10px', borderRadius: '999px',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.18)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
    fontSize: '10px', fontWeight: '500', color: 'rgba(255,255,255,0.7)',
    pointerEvents: 'all',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
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
  // ── LOCAL PIP — bottom-right glassy pill (overridden on mobile via .cv-pip class)
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
  // ── HUD SIDEBAR — floating glassy panel (hidden on mobile via .cv-hud class)
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
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px 20px calc(24px + env(safe-area-inset-bottom))',
    background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
  },
  centerControls: {
    display: 'flex', alignItems: 'center', gap: '16px',
  },
  recordBtn: {
    padding: '13px 22px', borderRadius: '999px',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
    color: 'white', fontSize: '14px', fontWeight: '700',
    cursor: 'pointer', letterSpacing: '-0.01em',
    transition: 'all 0.2s ease',
    display: 'flex', alignItems: 'center', gap: '8px',
    whiteSpace: 'nowrap',
  },
  endBtn: {
    padding: '13px 28px', borderRadius: '999px',
    background: 'rgba(255,59,48,0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 8px 32px rgba(255,59,48,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
    color: 'white', fontSize: '14px', fontWeight: '700',
    cursor: 'pointer', letterSpacing: '-0.01em',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
  aiSpeechBtn: (enabled) => ({
    padding: '13px 22px', borderRadius: '999px',
    background: enabled ? 'rgba(61, 255, 160, 0.15)' : 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(20px)',
    border: enabled ? '1px solid rgba(61,255,160,0.4)' : '1px solid rgba(255,255,255,0.12)',
    boxShadow: enabled ? '0 0 15px rgba(61,255,160,0.2), inset 0 1px 0 rgba(255,255,255,0.1)' : 'inset 0 1px 0 rgba(255,255,255,0.05)',
    color: enabled ? '#3dffa0' : 'rgba(255,255,255,0.6)',
    fontSize: '14px', fontWeight: '700',
    cursor: 'pointer', letterSpacing: '-0.01em',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'flex', alignItems: 'center', gap: '8px',
    whiteSpace: 'nowrap',
  }),
  aiStatus: {
    position: 'absolute', right: '20px',
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '7px 12px', borderRadius: '999px',
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.14)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
    fontSize: '10px', fontWeight: '500', color: 'rgba(255,255,255,0.7)',
  },
  // ── MOBILE EMOTION STRIP (shown below top bar on narrow screens)
  mobileEmoStrip: {
    position: 'absolute', top: '60px', left: 0, right: 0, zIndex: 25,
    display: 'none', // shown via .cv-emo-strip media query
    alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '0 16px',
    pointerEvents: 'none',
  },
};

const EMO_COLORS = {
  happy: '#34c759',
  neutral: 'rgba(255,255,255,0.5)',
  sad: '#5b9cf6',
  angry: '#ff3b30',
};

function LiveTurnGraph({ timeline }) {
  if (!timeline || timeline.length < 2) {
    return <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '16px 0', fontFamily: 'var(--mono)' }}>Gathering emotional response data...</div>;
  }

  const W = 188, H = 80, pad = 6;
  const maxIdx = Math.max(timeline.length - 1, 1);
  const pts = timeline.map((d, i) => {
    let val = 50;
    if (d.emo === 'happy') val = 100;
    if (d.emo === 'sad' || d.emo === 'angry') val = 0;
    const x = pad + (i / maxIdx) * (W - pad * 2);
    const y = pad + (1 - val / 100) * (H - pad * 2);
    return { x, y };
  });

  const pathStr = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPathStr = `${pathStr} ${pts[pts.length - 1].x.toFixed(1)},${H} ${pts[0].x.toFixed(1)},${H}`;

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px 12px 10px', position: 'relative', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '80px', overflow: 'visible' }}>
        <defs>
          <linearGradient id="liveLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3dffa0" />
            <stop offset="50%" stopColor="#8899bb" />
            <stop offset="100%" stopColor="#5b9cf6" />
          </linearGradient>
          <linearGradient id="liveArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(61,255,160,0.18)" />
            <stop offset="50%" stopColor="rgba(136,153,187,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        
        {/* Y-axis guidelines */}
        {[
          { v: 100, l: 'POS' },
          { v: 50, l: 'NEU' },
          { v: 0, l: 'NEG' }
        ].map(({ v, l }) => {
          const y = pad + (1 - v / 100) * (H - pad * 2);
          return (
            <g key={l}>
              <line x1={0} y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3,3" />
              <text x={0} y={y - 4} fill="rgba(255,255,255,0.25)" fontSize="7" fontWeight="700" fontFamily="var(--mono)" letterSpacing="0.05em">{l}</text>
            </g>
          );
        })}

        {/* Shaded Area under the curve */}
        <polygon points={areaPathStr} fill="url(#liveArea)" />

        {/* Emotion line glow */}
        <polyline points={pathStr} fill="none" stroke="url(#liveLine)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" style={{ filter: 'blur(2px)' }} />

        {/* Emotion line */}
        <polyline points={pathStr} fill="none" stroke="url(#liveLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Current pulsing dot */}
        <g>
          <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="6" fill="#fff" opacity="0.15" />
          <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.5" fill="#fff" />
          <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="1.2" fill="#fff" />
        </g>
      </svg>
    </div>
  );
}

export default function CallView({ onEnd, webRTC, sessionInfo, callSecs, onDataUpdate, onVideoReady }) {
  const { 
    remoteName, isConnected, remoteVideoRef, localVideoRef, endCall, 
    faceStream, remoteStream, sendData, peerTranscripts, 
    recordConsentReq, setRecordConsentReq, recordAllowed,
    recordDenied, setRecordDenied
  } = webRTC;
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const endBtnRef = useRef(null);
  const compositorRef = useRef(null);
  const recordLoopRef = useRef(null);
  const isRecordingRef = useRef(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { modelsLoaded, curEmo, emoCounts, detCount, getTimeline, debug } = useFaceAPI(
    remoteVideoRef, svgRef, canvasRef, isConnected, sessionInfo.ctx, sessionInfo.optIn
  );

  const curEmoRef = useRef('neutral');
  useEffect(() => { curEmoRef.current = curEmo; }, [curEmo]);

  // AI Voice Analytics - Default false to guarantee 100% direct WebRTC audio connection
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const { finalTranscripts } = useSpeech(isConnected, speechEnabled);
  const voiceTriggersRef = useRef([]);

  // Subtitles
  const [activeSubtitle, setActiveSubtitle] = useState(null);
  const subtitleTimeoutRef = useRef(null);

  // Autoplay recovery tracking
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);

  useEffect(() => {
    if (finalTranscripts.length > 0 && isConnected) {
      const last = finalTranscripts[finalTranscripts.length - 1];
      sendData({ type: 'transcript', text: last.text, time: last.timestamp });
    }
  }, [finalTranscripts]);

  useEffect(() => {
    if (peerTranscripts.length === 0) return;
    const last = peerTranscripts[peerTranscripts.length - 1];
    
    // Live Subtitles
    const currentE = curEmoRef.current;
    setActiveSubtitle({ text: last.text, emotion: currentE });
    if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
    subtitleTimeoutRef.current = setTimeout(() => setActiveSubtitle(null), 4000);

    // Wait 1.5s for emotional reaction to set in for the highlight reel
    const timer = setTimeout(() => {
      const e = curEmoRef.current;
      if (e && e !== 'neutral') {
        voiceTriggersRef.current.push({ text: last.text, emotion: e, time: last.time });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [peerTranscripts]);

  // Live Coaching Engine
  const [coachingToast, setCoachingToast] = useState(null);
  const neutralDurationRef = useRef(0);
  const lastCoachingTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!isConnected || !sessionInfo.ctx) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastCoachingTimeRef.current < 60000) return; // Cool-down between toasts

      if (curEmoRef.current === 'neutral') {
        neutralDurationRef.current += 1000;
      } else {
        neutralDurationRef.current = 0;
      }

      if (sessionInfo.ctx === 'ZW-CN' && neutralDurationRef.current >= 30000) {
        setCoachingToast({
          title: "High Neutrality Detected",
          msg: "In Chinese business culture, prolonged neutrality often indicates Face-saving (Mianzi). Avoid pushing for a hard 'yes' right now. Use soft follow-ups.",
          color: "#8899bb",
          icon: "🎭"
        });
        neutralDurationRef.current = 0;
        lastCoachingTimeRef.current = now;
        setTimeout(() => setCoachingToast(null), 10000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected, sessionInfo.ctx]);

  useEffect(() => {
    if (peerTranscripts.length === 0) return;
    const last = peerTranscripts[peerTranscripts.length - 1].text.toLowerCase();
    const now = Date.now();
    if (now - lastCoachingTimeRef.current < 20000) return; // Short cool-down for keyword triggers

    if (curEmoRef.current === 'angry' || curEmoRef.current === 'sad') {
      if (last.includes('price') || last.includes('cost') || last.includes('timeline') || last.includes('delay') || last.includes('wait')) {
        setCoachingToast({
          title: "Friction on Sensitive Topic",
          msg: "Negative emotion detected alongside a constraint keyword. Avoid direct confrontation. De-escalate and shift focus to shared goals.",
          color: "#ff3b30",
          icon: "⚠️"
        });
        lastCoachingTimeRef.current = now;
        setTimeout(() => setCoachingToast(null), 10000);
      }
    }
  }, [peerTranscripts]);


  // Session Recording
  const [isRecording, setIsRecording] = useState(false);
  const [waitingConsent, setWaitingConsent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const recordBtnLabel = isMobile ? (
    isRecording ? 'Stop' : isResetting ? 'Reset' : waitingConsent ? 'Wait' : 'Rec'
  ) : (
    isRecording ? 'Stop Recording' : isResetting ? 'Resetting...' : waitingConsent ? 'Waiting...' : 'Record Session'
  );

  const coachBtnLabel = isMobile ? (
    `Coach: ${speechEnabled ? 'ON' : 'OFF'}`
  ) : (
    `AI Coach: ${speechEnabled ? 'ON' : 'OFF'}`
  );

  const endBtnLabel = isMobile ? 'End' : 'End Session';

  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const recordingStartTimeRef = useRef(0);

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      setRecordDenied(false);
      sendData({ type: 'record_request' });
      setWaitingConsent(true);
    }
  };

  useEffect(() => {
    if (recordDenied) {
      setWaitingConsent(false);
      setIsResetting(true);
      const timer = setTimeout(() => {
        setIsResetting(false);
        setRecordDenied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [recordDenied, setRecordDenied]);

  useEffect(() => {
    if (recordAllowed && !isRecording && remoteStream) {
      setWaitingConsent(false);
      startRecording();
    }
  }, [recordAllowed, remoteStream]);

  const startRecording = () => {
    try {
      const compositor = compositorRef.current;
      const remoteVideo = remoteVideoRef.current;
      
      // Ensure canvas size matches video
      if (compositor && remoteVideo && remoteVideo.videoWidth > 0) {
        compositor.width = remoteVideo.videoWidth;
        compositor.height = remoteVideo.videoHeight;
      }

      isRecordingRef.current = true;

      // Start compositor loop to bake UI into video
      const drawFrame = () => {
        if (!isRecordingRef.current) return;
        if (compositor && remoteVideo && remoteVideo.readyState >= 2) {
          const ctx = compositor.getContext('2d');
          const w = compositor.width;
          const h = compositor.height;
          
          // Draw video frame
          ctx.drawImage(remoteVideo, 0, 0, w, h);
          
          // Draw Emotion Overlay HUD
          const e = curEmoRef.current;
          const eConf = EMO[e] || EMO.neutral;
          
          ctx.save();
          // Pill background
          ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
          ctx.beginPath();
          ctx.roundRect(w - 200, 30, 170, 50, 25);
          ctx.fill();
          
          // Status Dot
          ctx.fillStyle = eConf.c;
          ctx.beginPath();
          ctx.arc(w - 170, 55, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Emotion Text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
          ctx.textBaseline = 'middle';
          ctx.fillText(eConf.n.toUpperCase(), w - 150, 56);
          ctx.restore();
        }
        recordLoopRef.current = requestAnimationFrame(drawFrame);
      };
      drawFrame();

      // Capture stream from canvas at 30 FPS
      const canvasStream = compositor.captureStream(30);
      
      // Get audio from remote stream
      const audioTracks = remoteStream ? remoteStream.getAudioTracks() : [];
      
      // Combine them
      const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);

      const mr = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
      mr.ondataavailable = e => { if (e.data.size > 0) recordedChunks.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        if (onVideoReady) onVideoReady({ url, startTime: recordingStartTimeRef.current });
        recordedChunks.current = [];
      };
      mr.start();
      recordingStartTimeRef.current = Date.now();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch(e) { console.error('Recording failed:', e); }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    if (recordLoopRef.current) cancelAnimationFrame(recordLoopRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Sync data back to App.jsx for synchronized termination
  useEffect(() => {
    if (onDataUpdate && isConnected) {
      onDataUpdate({ counts: emoCounts, timeline: getTimeline(), voiceTriggers: voiceTriggersRef.current });
    }
  }, [emoCounts, detCount, isConnected]);

  const handleEnd = () => {
    stopRecording();
    endCall();
    onEnd(emoCounts, getTimeline(), voiceTriggersRef.current);
  };

  // Attach local camera stream
  useEffect(() => {
    const video = localVideoRef.current;
    if (video && webRTC.faceStream) {
      video.srcObject = webRTC.faceStream;
      video.play().catch(e => console.warn('[CallView] Local PiP play was prevented:', e));
    }
  }, [webRTC.faceStream]);

  // Attach remote peer stream — runs AFTER React paints the video element
  useEffect(() => {
    const video = remoteVideoRef.current;
    if (video && remoteStream && isConnected) {
      console.log('[CallView] Attaching remote stream:', remoteStream.id);
      video.srcObject = remoteStream;
      
      let interactionListenersAdded = false;

      const unmuteOnInteraction = () => {
        if (video) {
          video.muted = false;
          setIsRemoteMuted(false);
          video.play().then(() => {
            console.log('[CallView] Unmuted remote video after user interaction');
          }).catch(err => {
            console.error('[CallView] Failed to play unmuted video on interaction:', err);
          });
        }
        cleanupInteractionListeners();
      };

      const cleanupInteractionListeners = () => {
        if (interactionListenersAdded) {
          document.removeEventListener('click', unmuteOnInteraction);
          document.removeEventListener('touchstart', unmuteOnInteraction);
          interactionListenersAdded = false;
        }
      };

      const playVideo = async () => {
        try {
          video.muted = false; // Explicitly ensure video is unmuted
          await video.play();
          console.log('[CallView] Remote video playing unmuted');
          setIsRemoteMuted(false);
        } catch (e) {
          console.warn('[CallView] Autoplay blocked, trying muted...', e);
          video.muted = true; // Muting often bypasses autoplay blocks
          setIsRemoteMuted(true);
          video.play().catch(p2 => console.error('[CallView] Even muted play failed:', p2));
          
          if (!interactionListenersAdded) {
            document.addEventListener('click', unmuteOnInteraction, { passive: true });
            document.addEventListener('touchstart', unmuteOnInteraction, { passive: true });
            interactionListenersAdded = true;
          }
        }
      };
      playVideo();

      // Robust track handling: Trigger play refresh when tracks go active
      const handleTrackEvent = () => {
        console.log('[CallView] Track active/updated event fired');
        video.srcObject = remoteStream;
        playVideo();
      };

      remoteStream.getTracks().forEach(track => {
        track.addEventListener('unmute', handleTrackEvent);
        track.addEventListener('ended', handleTrackEvent);
      });

      return () => {
        cleanupInteractionListeners();
        remoteStream.getTracks().forEach(track => {
          track.removeEventListener('unmute', handleTrackEvent);
          track.removeEventListener('ended', handleTrackEvent);
        });
      };
    }
  }, [remoteStream, isConnected]);

  const getEmoTotal = () => (emoCounts.happy + emoCounts.neutral + emoCounts.sad + emoCounts.angry) || 1;
  const getPct = (n) => ((n / getEmoTotal()) * 100).toFixed(0);
  const curE = EMO[curEmo] || EMO.neutral;

  const timerStr = `${String(Math.floor(callSecs / 60)).padStart(2, '0')}:${String(callSecs % 60).padStart(2, '0')}`;

  // Cultural alignment calculations
  const totalCounts = getEmoTotal();
  const isZw = String(sessionInfo.ctx || '').toLowerCase().includes('zimbabwe') || String(sessionInfo.ctx || '').toLowerCase().includes('zw');
  const isCn = String(sessionInfo.ctx || '').toLowerCase().includes('china') || String(sessionInfo.ctx || '').toLowerCase().includes('cn');
  
  let alignmentScore = 50;
  let alignmentTitle = "Intercultural Synergy";
  let alignmentStatus = "Communication Productive";
  let alignmentAdvice = "Rapport is stable. Balance presentation with space for their input.";
  let alignmentThemeColor = "#3dffa0";
  
  if (isZw) {
    alignmentScore = Math.min(100, Math.max(10, Math.round(((emoCounts.happy * 1.2 + emoCounts.neutral * 0.8) / (totalCounts || 1)) * 100)));
    alignmentTitle = "Ubuntu Resonance Index";
    alignmentThemeColor = "#3dffa0"; // green
    if (alignmentScore >= 80) {
      alignmentStatus = "Communal Harmony High 🇿🇼";
      alignmentAdvice = "Communal connection is thriving. Focus on storytelling and collective value. Respectful presence is deeply felt.";
    } else if (alignmentScore >= 50) {
      alignmentStatus = "Warm Connection Stable";
      alignmentAdvice = "Relational connection is positive. Cultivate communal warmth (Ubuntu) by showing interest in family, health, and mutual respect.";
    } else {
      alignmentStatus = "Relational Warmth Fading";
      alignmentAdvice = "Connection is tense or cold. Slow down. Prioritize relationship-building over transaction. Ask respectful open questions.";
    }
  } else if (isCn) {
    alignmentScore = Math.min(100, Math.max(10, Math.round(((emoCounts.neutral * 1.1 + emoCounts.happy * 0.7) / (totalCounts || 1)) * 100)));
    alignmentTitle = "Guanxi & Mianzi Poise";
    alignmentThemeColor = "#5b9cf6"; // blue/neutral
    if (alignmentScore >= 80) {
      alignmentStatus = "Face-Saving Harmony High 🇨🇳";
      alignmentAdvice = "Excellent Guanxi established. Mutual face-saving (Mianzi) is maintained. Keep communication respectful, indirect, and patient.";
    } else if (alignmentScore >= 50) {
      alignmentStatus = "Polite Poise Established";
      alignmentAdvice = "Polite reserve is active. Respect pauses. Avoid confrontational negotiation; allow indirect expressions.";
    } else {
      alignmentStatus = "Harmony Disrupted";
      alignmentAdvice = "Friction detected. Pause immediately. Express utmost respect. Do not call out errors directly; offer face-saving ways out.";
    }
  } else {
    alignmentScore = Math.min(100, Math.max(10, Math.round(((emoCounts.happy * 1.0 + emoCounts.neutral * 0.8) / (totalCounts || 1)) * 100)));
    alignmentTitle = "Intercultural Synergy";
    alignmentThemeColor = "#007aff"; // blue
    if (alignmentScore >= 80) {
      alignmentStatus = "Synergy Achieved 🌐";
      alignmentAdvice = "High positive resonance. Communication is fluid and empathetic. Continue active listening.";
    } else if (alignmentScore >= 50) {
      alignmentStatus = "Communication Productive";
      alignmentAdvice = "Rapport is stable. Balance presentation with space for their input.";
    } else {
      alignmentStatus = "Friction Alert";
      alignmentAdvice = "Potential communication gap. Check assumptions, simplify terms, and ask open clarifying questions.";
    }
  }

  return (
    <div style={S.root} className="cv-root">
      {/* Keyframe & Layout Styles */}
      <style>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.25); }
          50% { transform: scale(1.07); box-shadow: 0 0 60px rgba(255,255,255,0.16), inset 0 1px 0 rgba(255,255,255,0.3); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes ping {
          0%   { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .end-btn:active { transform: scale(0.96) !important; }

        /* ── DESKTOP RETHINK (768px+) ── */
        @media (min-width: 768px) {
          .cv-root {
            background: radial-gradient(circle at center, #1e1e35 0%, #08080c 100%) !important;
            display: flex !important;
            flex-direction: column !important;
            height: 100vh !important;
            height: 100dvh !important;
            overflow: hidden !important;
          }
          .cv-desktop-main {
            display: flex !important;
            flex: 1 !important;
            padding: 30px 40px 110px !important; /* bottom padding for botbar */
            gap: 30px !important;
            max-width: 1600px;
            margin: 0 auto;
            width: 100%;
            box-sizing: border-box;
            height: calc(100vh - 90px) !important;
            height: calc(100dvh - 90px) !important;
            min-height: 0 !important;
            overflow: hidden !important;
          }
          .cv-stage {
            flex: 1 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: relative !important;
            height: 100% !important;
            min-height: 0 !important;
            min-width: 0 !important;
          }

          .cv-video-card {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: 100% !important;
            aspect-ratio: 16/9 !important;
            background: rgba(10,10,15,0.75) !important;
            backdrop-filter: blur(20px) !important;
            border-radius: 32px !important;
            overflow: hidden !important;
            position: relative !important;
            border: 1px solid rgba(255,255,255,0.12) !important;
            box-shadow: 0 40px 120px rgba(0,0,0,0.8) !important;
          }
          .cv-video-card video {
            object-fit: contain !important;
          }

          .cv-sidebar {
            width: 210px !important;
            flex-shrink: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
            overflow-y: auto !important;
            height: 100% !important;
            max-height: 100% !important;
            scrollbar-width: none !important;
          }
          .cv-sidebar::-webkit-scrollbar {
            display: none !important;
          }
          .cv-side-card, .alignment-gauge-container {
            background: rgba(255,255,255,0.04) !important;
            backdrop-filter: blur(40px) saturate(180%) !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
            border-radius: 16px !important;
            padding: 12px !important; /* Made compact to fit exactly 210px sidebars */
            box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
          }
          .cv-pip {
            position: absolute !important;
            bottom: 110px !important; /* Pos bottom-left above control bar */
            left: 24px !important;
            right: auto !important;
            top: auto !important;
            width: 116px !important;
            height: 80px !important;
            border-radius: 8px !important;
            border: 1.5px solid rgba(79, 142, 247, 0.5) !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
            z-index: 30 !important;
          }
          .cv-pip video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }
          .cv-botbar {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 90px !important;
            background: rgba(10,10,15,0.92) !important;
            backdrop-filter: blur(30px) !important;
            border-top: 1px solid rgba(255,255,255,0.08) !important;
            padding: 0 40px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 100 !important;
          }
          .cv-controls {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 16px !important;
            width: 100% !important;
            max-width: 580px !important;
            margin: 0 auto !important;
          }
          .cv-record-btn, .cv-ai-speech-btn, .cv-end-btn {
            width: 100% !important;
            height: 48px !important;
            border-radius: 12px !important;
            font-family: var(--sans) !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            white-space: nowrap !important;
          }
          .cv-timer-wrap {
            text-align: center;
            margin-bottom: 10px;
          }
          .cv-timer-val {
            font-size: 28px !important;
            font-weight: 800 !important;
            background: linear-gradient(to bottom, #fff 0%, #aaa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-variant-numeric: tabular-nums;
            font-family: var(--mono) !important;
          }
          .cv-hud {
            position: static !important;
            width: 100% !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            backdrop-filter: none !important;
          }
          .cv-topbar {
            position: absolute !important;
            top: 20px !important;
            left: 20px !important;
            right: 20px !important;
            padding: 0 !important;
          }
          .cv-desktop-timer-hide { display: none !important; }
          .cv-ai-status { position: static !important; margin-top: auto; }
        }

        .alignment-gauge-container {
          background: rgba(255, 255, 255, 0.04) !important;
          backdrop-filter: blur(40px) saturate(180%) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 24px !important;
          padding: 20px !important; /* Made compact from 24px */
          box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          overflow: hidden;
        }
        .alignment-gauge-header {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 12px !important;
          width: 100% !important;
          min-width: 0 !important;
        }
        .alignment-gauge-title {
          font-size: 11px !important;
          font-weight: 800 !important;
          color: rgba(255, 255, 255, 0.5) !important;
          letter-spacing: 0.05em !important;
          text-transform: uppercase !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          flex: 1 !important;
          min-width: 0 !important;
        }
        .alignment-gauge-value {
          font-size: 20px !important;
          font-weight: 800 !important;
          font-family: var(--mono) !important;
          flex-shrink: 0 !important;
        }
        .alignment-bar-outer {
          height: 10px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 999px;
          overflow: hidden;
          position: relative;
          border: 0.5px solid rgba(255, 255, 255, 0.1);
        }
        .alignment-bar-inner {
          height: 100%;
          border-radius: 999px;
          transition: width 1s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .alignment-desc {
          font-size: 11.5px;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.65);
        }
        
        .remote-stats-overlay {
          position: absolute;
          top: 24px;
          left: 24px;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 8px;
          pointer-events: none;
        }
        .glass-stats-card {
          background: rgba(10, 10, 15, 0.6) !important;
          backdrop-filter: blur(20px) saturate(160%) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 16px !important;
          padding: 12px 18px !important;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
        }
        .stat-indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: blink 1.5s infinite;
        }
        .remote-info-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 280px;
          max-width: 340px;
        }
        .remote-info-row-primary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
        }
        .remote-name-text {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }
        .emotion-badge {
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          padding: 4px 10px !important;
          border-radius: 999px !important;
          font-size: 9.5px !important;
          font-weight: 800 !important;
          letter-spacing: 0.05em !important;
          text-transform: uppercase !important;
          flex-shrink: 0 !important;
          white-space: nowrap !important;
        }
        .remote-info-row-secondary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 6px;
          width: 100%;
        }
        .context-engine-text {
          font-size: 10px;
          color: rgba(255,255,255,0.5);
          font-family: var(--mono);
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }
        .engine-status-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .scans-count-text {
          font-size: 9.5px;
          font-weight: 700;
          color: rgba(255,255,255,0.45);
          background: rgba(255,255,255,0.05);
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-family: var(--mono);
          flex-shrink: 0;
        }
        @keyframes pulse-banner {
          0% { transform: translate(-50%, 0) scale(1); box-shadow: 0 8px 32px rgba(255, 59, 48, 0.4); }
          50% { transform: translate(-50%, -2px) scale(1.04); box-shadow: 0 12px 36px rgba(255, 59, 48, 0.6); }
          100% { transform: translate(-50%, 0) scale(1); box-shadow: 0 8px 32px rgba(255, 59, 48, 0.4); }
        }
        .unmute-banner {
          animation: pulse-banner 2s infinite ease-in-out;
        }
        .unmute-banner:hover {
          background: rgba(255, 75, 64, 0.95) !important;
        }
        .toast-close-btn:hover {
          color: #ffffff !important;
          background-color: rgba(255, 255, 255, 0.15) !important;
        }
      `}</style>

      {/* ── DESKTOP CONTENT WRAPPER ── */}
      <div className="cv-desktop-main">
        
        {/* LEFT: MAIN STAGE */}
        <main className="cv-stage">
          {/* Dynamic emotional ambient backlight glow */}
          <div style={{
            position: 'absolute',
            width: '80%',
            height: '80%',
            background: `radial-gradient(circle, ${curE.c}2c 0%, transparent 70%)`,
            filter: 'blur(100px)',
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'background 0.8s ease-in-out',
          }} />
          <div className="cv-video-card" style={{
            borderColor: `${curE.c}88`,
            boxShadow: `0 40px 120px rgba(0,0,0,0.85), 0 0 40px ${curE.c}1c, 0 0 0 1px ${curE.c}12`,
            transition: 'border-color 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 2,
          }}>
            {/* Remote Video Container */}
            <div style={S.remoteFill}>
              <video
                ref={remoteVideoRef}
                style={{ ...S.remoteVid, display: isConnected ? 'block' : 'none' }}
                autoPlay
                playsInline
              />
              {isConnected && isRemoteMuted && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    const video = remoteVideoRef.current;
                    if (video) {
                      video.muted = false;
                      setIsRemoteMuted(false);
                      video.play().catch(err => console.error(err));
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 99,
                    background: 'rgba(255, 59, 48, 0.85)',
                    backdropFilter: 'blur(16px)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '24px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    transition: 'background-color 0.2s'
                  }}
                  className="unmute-banner"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM12 4L9.91 6.09 12 8.18V4zm-8.27-.27L2.3 5.16 7.13 10H3v4h3l4 4V12.87l6.63 6.63c-.88.63-1.87 1.09-2.96 1.34v2.01c1.63-.35 3.1-.1.97 4.39 1.42.42 2.69-.37 3.73-1.12l2.8 2.8 1.43-1.41L3.73 3.73z" />
                  </svg>
                  <span>Click to Unmute Peer</span>
                </div>
              )}
              <svg
                ref={svgRef}
                preserveAspectRatio={isMobile ? "xMidYMid slice" : "xMidYMid meet"}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  pointerEvents: 'none', zIndex: 4,
                  display: isConnected ? 'block' : 'none'
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <canvas ref={compositorRef} style={{ display: 'none' }} />

              {/* Waiting State */}
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

            {/* Glassmorphic Remote HUD Overlay */}
            {isConnected && (
              <div className="remote-stats-overlay">
                <div className="glass-stats-card remote-info-card">
                  {/* Top Row: Name and Active Emotion Badge */}
                  <div className="remote-info-row-primary">
                    <span className="remote-name-text" title={remoteName}>
                      {remoteName} {isZw ? '🇿🇼' : isCn ? '🇨🇳' : '🌐'}
                    </span>
                    <span className="emotion-badge" style={{
                      background: `${curE.c}18`,
                      color: curE.c,
                      border: `1px solid ${curE.c}44`
                    }}>
                      <span className="stat-indicator-dot" style={{
                        background: curE.c,
                        boxShadow: `0 0 8px ${curE.c}`
                      }} />
                      {curE.n.toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Bottom Row: Context Engine and Scans count */}
                  <div className="remote-info-row-secondary">
                    <span className="context-engine-text">
                      <span className="engine-status-dot" style={{ background: modelsLoaded ? '#34c759' : '#ffb347' }} />
                      Context: {isZw ? 'ZW CNN Ensemble' : isCn ? 'CN CNN Ensemble' : 'Standard TFJS'}
                    </span>
                    <span className="scans-count-text">
                      {detCount} scans
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Local PiP (moved inside card for desktop) */}
            <div className="cv-pip" style={S.localPip}>
              <video ref={localVideoRef} style={S.localVid} autoPlay muted playsInline />
              <div style={S.localLabel}>You</div>
            </div>

            {/* Video Overlays (Subtitles) */}
            {activeSubtitle && (
              <div className="cv-subtitle" style={{
                position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 45,
                textAlign: 'center', width: '90%', pointerEvents: 'none'
              }}>
                <span style={{
                  display: 'inline-block', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                  padding: '12px 24px', borderRadius: '14px', maxWidth: '100%',
                  fontSize: '22px', fontWeight: '500', color: EMO_COLORS[activeSubtitle.emotion] || 'white',
                  border: `1px solid ${EMO_COLORS[activeSubtitle.emotion]}44`,
                  animation: 'fadeInUp 0.3s ease-out'
                }}>
                  {activeSubtitle.text}
                </span>
              </div>
            )}
          </div>
        </main>

        {/* MOBILE BOTTOM STATS SHEET */}
        <div className="cv-mobile-stats-sheet">
          {/* Flex Row Metric Cards */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', width: '100%' }}>
            {/* Duration Card */}
            <div style={{
              flex: 1,
              background: 'var(--surf)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              <span style={{ fontSize: '9px', fontFamily: 'var(--sans)', fontWeight: '600', color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</span>
              <span style={{ fontSize: '14px', fontFamily: 'var(--mono)', fontWeight: '700', color: 'var(--primary-text)' }}>{timerStr}</span>
            </div>

            {/* Context Card */}
            <div style={{
              flex: 1,
              background: 'var(--surf)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              <span style={{ fontSize: '9px', fontFamily: 'var(--sans)', fontWeight: '600', color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Context</span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: '700', color: 'var(--primary-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85px', textAlign: 'center' }}>{sessionInfo.ctx}</span>
            </div>

            {/* Scans Card */}
            <div style={{
              flex: 1,
              background: 'var(--surf)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              <span style={{ fontSize: '9px', fontFamily: 'var(--sans)', fontWeight: '600', color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scans</span>
              <span style={{ fontSize: '14px', fontFamily: 'var(--mono)', fontWeight: '700', color: 'var(--primary-text)' }}>{detCount}</span>
            </div>
          </div>

          {/* Slim Emotion Progress Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: '16px', padding: '14px' }}>
            <span style={{ fontSize: '9px', fontFamily: 'var(--mono)', fontWeight: '600', color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              Emotion Distribution
            </span>
            {(() => {
              const total = getEmoTotal();
              let sumPct = 0;
              let maxKey = null;
              let maxVal = -1;
              const pcts = {};
              Object.keys(EMO).forEach(k => {
                const cnt = emoCounts[k] || 0;
                const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
                pcts[k] = pct;
                sumPct += pct;
                if (pct > maxVal) { maxVal = pct; maxKey = k; }
              });
              if (sumPct !== 100 && sumPct > 0 && maxKey) {
                pcts[maxKey] += (100 - sumPct);
              }
              
              return Object.entries(EMO).map(([k, v]) => {
                const pct = pcts[k] || 0;
                return (
                  <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--sans)', fontWeight: '600', color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{v.n}</span>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', fontWeight: '700', color: 'var(--primary-text)' }}>{pct}%</span>
                    </div>
                    <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: v.c, transition: 'width 0.3s ease, background 0.3s ease', borderRadius: '2px' }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* RIGHT: SIDEBAR */}
        <aside className="cv-sidebar">
          
          {/* Timer Card */}
          <div className="cv-side-card cv-timer-wrap">
            <div style={S.statLbl}>Session Duration</div>
            <div className="cv-timer-val">{timerStr}</div>
            <div style={{ ...S.ctxBadge, display: 'inline-block', marginTop: '10px' }}>{sessionInfo.ctx}</div>
          </div>

          {/* Cultural Alignment Card */}
          <div className="alignment-gauge-container">
            <div className="alignment-gauge-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className="alignment-gauge-title" style={{ fontSize: '9px', fontWeight: '800', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>{alignmentTitle}</span>
              <span className="alignment-gauge-value" style={{
                background: `linear-gradient(135deg, ${alignmentThemeColor} 0%, #007aff 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '20px',
                fontWeight: '800',
                fontFamily: 'var(--mono)',
              }}>{alignmentScore}%</span>
            </div>
            
            <div className="alignment-bar-outer" style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '999px', overflow: 'hidden', position: 'relative', border: '0.5px solid rgba(255, 255, 255, 0.1)', marginTop: '8px', marginBottom: '8px' }}>
              <div className="alignment-bar-inner" style={{
                height: '100%',
                borderRadius: '999px',
                transition: 'width 1s cubic-bezier(0.23, 1, 0.32, 1)',
                width: `${alignmentScore}%`,
                background: `linear-gradient(90deg, ${alignmentThemeColor} 0%, #007aff 100%)`,
                boxShadow: `0 0 12px ${alignmentThemeColor}66`
              }} />
            </div>

            <div className="alignment-desc">
              <div style={{ fontWeight: '700', color: '#ffffff', marginBottom: '4px', fontSize: '11px', fontFamily: 'var(--sans)' }}>{alignmentStatus}</div>
              <div style={{ fontSize: '10.5px', lineHeight: '1.45', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'var(--sans)' }}>{alignmentAdvice}</div>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="cv-side-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={S.hudLabel}>{remoteName}'s Emotion Turns</div>
            <div className="cv-hud" style={S.hud}>
              <LiveTurnGraph timeline={getTimeline()} />
              <div style={S.hudDivider} />
              <div style={S.statsRow}>
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>Scans</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'white', fontFamily: 'var(--mono)', lineHeight: 1 }}>{detCount}</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>Current</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: curE.c, fontFamily: 'var(--mono)', lineHeight: 1 }}>{curE.n.toUpperCase()}</div>
                </div>
              </div>
              <div style={S.hudDivider} />
              <div style={S.emoRow}>
                {(() => {
                  const total = getEmoTotal();
                  let sumPct = 0;
                  let maxKey = null;
                  let maxVal = -1;
                  const pcts = {};
                  Object.keys(EMO).forEach(k => {
                    const cnt = emoCounts[k] || 0;
                    const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
                    pcts[k] = pct;
                    sumPct += pct;
                    if (pct > maxVal) { maxVal = pct; maxKey = k; }
                  });
                  if (sumPct !== 100 && sumPct > 0 && maxKey) {
                    pcts[maxKey] += (100 - sumPct);
                  }
                  
                  return Object.entries(EMO).map(([k, v]) => {
                    const pct = pcts[k] || 0;
                    return (
                      <div key={k} className="emo-item">
                        <div style={S.emoHead}>
                          <span className="emo-name" style={{ fontSize: '10px', fontFamily: 'var(--sans)', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{v.n}</span>
                          <span className="emo-pct" style={{ fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: '700', color: '#ffffff' }}>{pct}%</span>
                        </div>
                        <div style={S.emoTrack}>
                          <div style={{ height: '100%', width: `${pct}%`, background: v.c, transition: 'width 0.3s ease, background 0.3s ease', borderRadius: '999px' }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="cv-ai-status" style={S.aiStatus}>
              <div style={{ position: 'relative', width: '8px', height: '8px', flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: modelsLoaded ? '#34c759' : '#ffb347' }} />
                {modelsLoaded && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#34c759', animation: 'ping 1.8s ease-out infinite' }} />
                )}
              </div>
              {modelsLoaded ? 'AI Engine Active' : 'Loading Models…'}
            </div>

            {debug && (
              <div style={{
                marginTop: '12px',
                padding: '8px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '10px',
                color: '#aaa',
                lineHeight: '1.4'
              }}>
                <div>Loop Ticks: {debug.loopTicks}</div>
                <div>Video Size: {debug.videoSize}</div>
                <div>Last Det: {debug.lastDet}</div>
                <div>Last Error: {debug.lastError}</div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── TOP BAR ── */}
      {isMobile ? (
        <div className="cv-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '38px', height: 'auto', padding: '4px 12px', background: 'rgba(10, 13, 20, 0.88)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--primary-text)', fontFamily: 'var(--sans)', lineHeight: '1.2' }}>
              {remoteName} {isZw ? '🇿🇼' : isCn ? '🇨🇳' : '🌐'}
            </span>
            <span style={{ fontSize: '8px', fontFamily: 'var(--mono)', color: 'var(--muted-text)', marginTop: '2px' }}>
              {sessionInfo.ctx}
            </span>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '2px' }}>
            {isConnected && (
              <div style={{
                background: '#e85b5b',
                color: '#ffffff',
                fontFamily: 'var(--mono)',
                fontSize: '8px',
                fontWeight: '700',
                padding: '1px 5px',
                borderRadius: '3px',
                letterSpacing: '0.05em',
                lineHeight: '1.2',
              }}>
                LIVE
              </div>
            )}
            {/* Emotion Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'flex-end', maxWidth: '100px' }}>
              {(() => {
                const activeEmotion = curEmoRef.current || 'neutral';
                const label = EMO[activeEmotion]?.n || 'Neutral';
                let colors = { bg: 'rgba(100,116,150,0.2)', text: '#8892aa', border: 'rgba(100,116,150,0.2)' };
                if (activeEmotion === 'happy') {
                  colors = { bg: 'rgba(245,166,35,0.15)', text: '#f5a623', border: 'rgba(245,166,35,0.2)' };
                } else if (activeEmotion === 'sad') {
                  colors = { bg: 'rgba(79,142,247,0.12)', text: '#4f8ef7', border: 'rgba(79,142,247,0.2)' };
                } else if (activeEmotion === 'angry') {
                  colors = { bg: 'rgba(232,91,91,0.12)', text: '#e85b5b', border: 'rgba(232,91,91,0.2)' };
                } else if (activeEmotion === 'surprised') {
                  colors = { bg: 'rgba(0,212,160,0.1)', text: '#00d4a0', border: 'rgba(0,212,160,0.2)' };
                }
                return (
                  <span style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '8px',
                    padding: '2px 5px',
                    borderRadius: '3px',
                    background: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    whiteSpace: 'nowrap'
                  }}>
                    {label.toUpperCase()}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>
      ) : (
        <div className="cv-topbar" style={S.topBar}>
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
          <div className="cv-desktop-timer-hide" style={S.timer}>{timerStr}</div>
          <div className="cv-desktop-timer-hide" style={S.ctxBadge}>{sessionInfo.ctx}</div>
        </div>
      )}

      {/* ── COACHING TOAST ── */}
      {coachingToast && (
        <div style={{
          position: 'absolute', top: '76px', left: '50%', transform: 'translateX(-50%)', zIndex: 40,
          background: 'rgba(20,20,30,0.85)', backdropFilter: 'blur(30px)',
          border: `1px solid ${coachingToast.color}55`, borderRadius: '14px',
          padding: '16px 20px', width: '380px', maxWidth: '90%',
          boxShadow: `0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 20px ${coachingToast.color}22`,
          display: 'flex', gap: '14px', alignItems: 'flex-start',
          animation: 'fadeInDown 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <button 
            onClick={() => setCoachingToast(null)}
            style={{
              position: 'absolute', top: '10px', right: '10px',
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontSize: '18px', fontWeight: 'bold',
              padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1, borderRadius: '50%', width: '20px', height: '20px',
              transition: 'color 0.2s, background-color 0.2s'
            }}
            className="toast-close-btn"
          >
            &times;
          </button>
          <div style={{ fontSize: '24px' }}>{coachingToast.icon}</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: coachingToast.color, marginBottom: '4px', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {coachingToast.title}
              <span style={{ fontSize: '8px', background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#1a1a2e', padding: '2px 5px', borderRadius: '4px', letterSpacing: '0' }}>AI COACH</span>
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5', paddingRight: '12px' }}>
              {coachingToast.msg}
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM CONTROL BAR ── */}
      <div className="cv-botbar" style={S.botBar}>
        <div className="cv-controls" style={S.centerControls}>
          <button
            className="cv-record-btn"
            style={{ ...S.recordBtn, border: isRecording ? '1px solid rgba(255,59,48,0.5)' : S.recordBtn.border }}
            onClick={handleRecordClick}
            disabled={isResetting || waitingConsent}
          >
            {isRecording ? (
               <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ff3b30', animation: 'ping 1.5s infinite' }} />
            ) : (
               <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff3b30' }} />
            )}
            <span>{recordBtnLabel}</span>
            {!isRecording && !waitingConsent && !isResetting && (
              <span style={{
                fontSize: isMobile ? '8px' : '9px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                color: '#1a1a2e',
                padding: isMobile ? '1px 4px' : '2px 6px',
                borderRadius: isMobile ? '3px' : '4px',
                marginLeft: '4px',
                display: 'inline-block',
                lineHeight: '1.2'
              }}>PRO</span>
            )}
          </button>
          
          <button
            className="cv-ai-speech-btn animate-spring-hover"
            style={S.aiSpeechBtn(speechEnabled)}
            onClick={() => setSpeechEnabled(prev => !prev)}
          >
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: speechEnabled ? '#3dffa0' : 'rgba(255,255,255,0.4)',
              boxShadow: speechEnabled ? '0 0 8px #3dffa0' : 'none',
              transition: 'all 0.3s ease'
            }} />
            <span>{coachBtnLabel}</span>
          </button>

          <button
            ref={endBtnRef}
            className="end-btn cv-end-btn"
            onClick={handleEnd}
            style={S.endBtn}
          >
            {endBtnLabel}
          </button>
        </div>
      </div>

      {/* ── CONSENT MODAL (Absolute center) ── */}
      {recordConsentReq && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,59,48,0.4)', borderRadius: '24px',
            padding: '32px', textAlign: 'center', maxWidth: '400px', width: '90%',
            boxShadow: '0 20px 80px rgba(0,0,0,0.8)'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,59,48,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
               <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#ff3b30' }} />
            </div>
            <h3 style={{ color: 'white', margin: '0 0 10px', fontSize: '20px', fontWeight: '700' }}>Recording Request</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 24px', fontSize: '15px', lineHeight: '1.5' }}>{remoteName} wants to record this session for analysis. Do you consent?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: '600' }} onClick={() => { sendData({ type: 'record_deny' }); setRecordConsentReq(false); }}>Deny</button>
              <button style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#ff3b30', color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => { sendData({ type: 'record_allow' }); setRecordConsentReq(false); }}>Allow</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
