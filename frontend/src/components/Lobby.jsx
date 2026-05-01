import React, { useState, useEffect } from 'react';

export default function Lobby({ onStart, webRTC, onDash }) {
  const [uName, setUName] = useState('Tinashe Moyo');
  const [ctx, setCtx] = useState('ZW-CN');
  const [joinId, setJoinId] = useState('');
  const [optIn, setOptIn] = useState(false);
  const { peerId, startCamera, joinCall, isConnected, localVideoRef } = webRTC;

  useEffect(() => {
    startCamera();
  }, []);

  const handleJoin = () => {
    if (joinId) joinCall(joinId, uName);
    onStart({ uName, ctx, optIn });
  };

  const handleStart = () => {
    onStart({ uName, ctx, optIn });
  };

  return (
    <div className="screen active" id="sLobby">
      <div className="lob-card">
        <div className="lob-logo">
          <div className="lob-title">emo<span>-detect</span></div>
          <div className="lob-sub">React Prototype</div>
        </div>
        
        <div className="cam-strip">
          <video ref={localVideoRef} autoPlay muted playsInline></video>
        </div>

        <div className="fl">
          <label className="fl-l">Your name</label>
          <input className="fi" type="text" value={uName} onChange={e => setUName(e.target.value)} />
        </div>

        <div className="fl">
          <label className="fl-l">Cultural context</label>
          <select className="fi" value={ctx} onChange={e => setCtx(e.target.value)}>
            <option value="ZW-CN">Zimbabwe → China</option>
            <option value="ZW-ZW">Zim → Zim</option>
            <option value="INT">International</option>
          </select>
        </div>

        <div className="room-box">
          <div className="rb-title">Your session ID</div>
          <div className="rb-id">{peerId || 'Generating...'}</div>
          
          <div className="rb-or"><span>OR JOIN</span></div>
          
          <div className="rb-join">
            <input className="fi" type="text" placeholder="Session ID" value={joinId} onChange={e => setJoinId(e.target.value)} />
            <button className="btn-join" onClick={handleJoin}>Join</button>
          </div>
        </div>

        <button className="btn-start" onClick={handleStart}>Start Session</button>
        <button className="btn-start" onClick={onDash} style={{background: 'rgba(255,255,255,0.05)', color: 'white', marginTop: '-10px'}}>View Dashboard</button>

        {/* Opt-in data collection */}
        <div className="ds-note" style={{cursor:'pointer'}} onClick={() => setOptIn(v => !v)}>
          <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
            <span style={{
              width:'18px', height:'18px', borderRadius:'5px', border:'1.5px solid',
              borderColor: optIn ? 'var(--green)' : 'rgba(255,183,71,.5)',
              background: optIn ? 'var(--gd)' : 'transparent',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              transition:'all .2s'
            }}>
              {optIn && <svg viewBox="0 0 10 8" width="10" height="8" fill="none"><path d="M1 4l3 3 5-6" stroke="#3dffa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </span>
            <span>
              <strong style={{color: optIn ? 'var(--green)' : 'var(--amber)'}}>
                {optIn ? '✓ Contributing to EmoSense dataset' : 'Opt in to improve our AI model'}
              </strong>
              <span style={{display:'block', marginTop:'2px', fontWeight:'normal'}}>
                Anonymised facial data helps train our ZW-CN model. Compliant with the Cyber &amp; Data Protection Act (2021).
              </span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
