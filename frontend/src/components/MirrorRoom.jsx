import React, { useEffect, useRef, useState } from 'react';
import { useFaceAPI, EMO } from '../hooks/useFaceAPI';

export default function MirrorRoom({ webRTC, sessionInfo, onJoin, onBack }) {
  const { startCamera, faceStream } = webRTC;
  const localVideoRef = useRef(null);
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const [micLevel, setMicLevel] = useState(0);

  // We reuse useFaceAPI but point it at the LOCAL video to test it
  const { modelsLoaded, curEmo } = useFaceAPI(
    localVideoRef, svgRef, canvasRef, true, sessionInfo.ctx
  );

  useEffect(() => {
    // Start camera when entering mirror room
    if (!faceStream) {
      startCamera();
    } else if (localVideoRef.current) {
      localVideoRef.current.srcObject = faceStream;
    }
  }, [faceStream, startCamera]);

  useEffect(() => {
    if (!faceStream) return;
    
    // Setup Audio Context for mic level testing
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

  const handleJoinClick = () => {
    if (sessionInfo.targetPeerId) {
      webRTC.joinCall(sessionInfo.targetPeerId, sessionInfo.uName);
    }
    onJoin();
  };

  const eConf = EMO[curEmo] || EMO.neutral;

  return (
    <div className="screen active" style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a0f 100%)', height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif', color: 'white', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 40, left: 40 }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
          backdropFilter: 'blur(10px)', transition: '0.2s'
        }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
          ← Back to Lobby
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', margin: '0 0 12px', fontWeight: '800', letterSpacing: '-0.5px' }}>Check Your Setup</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '16px' }}>Ensure your camera and microphone are working before joining.</p>
      </div>

      <div style={{
        position: 'relative', width: '640px', height: '480px', borderRadius: '24px',
        background: '#000', overflow: 'hidden', border: `2px solid ${eConf.c}55`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${eConf.c}33`
      }}>
        <video 
          ref={localVideoRef} 
          autoPlay muted playsInline 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
        />
        
        {/* Hidden svg for FaceAPI dots, we don't necessarily need to show the dots here, 
            but we need the ref for useFaceAPI to run. Actually let's show them! */}
        <svg ref={svgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Emotion Overlay Preview */}
        <div style={{
          position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)',
          border: `1px solid ${eConf.c}88`, borderRadius: '30px', padding: '12px 24px',
          display: 'flex', gap: '12px', alignItems: 'center', boxShadow: `0 8px 32px rgba(0,0,0,0.5)`
        }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: eConf.c, boxShadow: `0 0 10px ${eConf.c}` }} />
          <span style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.05em' }}>AI SENSOR: {eConf.n.toUpperCase()}</span>
        </div>

        {!modelsLoaded && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
            <span style={{ color: '#ffb347', fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div style={{ width: '16px', height: '16px', border: '3px solid #ffb347', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
               Initializing AI Models...
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '24px', marginTop: '40px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '20px 40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>
            <span>MICROPHONE</span>
            <span style={{ color: micLevel > 10 ? '#34c759' : 'rgba(255,255,255,0.3)' }}>{micLevel > 10 ? 'DETECTING' : 'SILENT'}</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: micLevel > 80 ? '#ff3b30' : '#34c759', width: `${micLevel}%`, transition: 'width 0.1s ease' }} />
          </div>
        </div>

        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

        <button 
          onClick={handleJoinClick}
          disabled={!modelsLoaded}
          style={{
            background: modelsLoaded ? 'linear-gradient(135deg, #5b9cf6 0%, #3a7bd5 100%)' : 'rgba(255,255,255,0.1)',
            color: modelsLoaded ? 'white' : 'rgba(255,255,255,0.3)',
            border: 'none', padding: '16px 40px', borderRadius: '12px',
            fontSize: '18px', fontWeight: 'bold', cursor: modelsLoaded ? 'pointer' : 'not-allowed',
            boxShadow: modelsLoaded ? '0 12px 32px rgba(91,156,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px'
          }}
          onMouseEnter={e => { if (modelsLoaded) e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { if (modelsLoaded) e.currentTarget.style.transform = 'translateY(0)' }}
        >
          Join Session ➔
        </button>
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
