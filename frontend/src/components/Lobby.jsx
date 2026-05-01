import React, { useState, useEffect } from 'react';

export default function Lobby({ onStart, webRTC, onDash }) {
  const [uName, setUName] = useState('Tinashe Moyo');
  const [ctx, setCtx] = useState('ZW-CN');
  const [joinCode, setJoinCode] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [copyLabel, setCopyLabel] = useState('Copy');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  const { peerId, startCamera, joinCall, localVideoRef } = webRTC;

  useEffect(() => { startCamera(); }, []);

  // Register for a room code once we have a peerId
  useEffect(() => {
    if (!peerId) return;
    fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peerId })
    })
      .then(r => r.json())
      .then(data => { if (data.code) setRoomCode(data.code); })
      .catch(() => setRoomCode('offline'));
  }, [peerId]);

  const handleCopy = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy'), 2000);
    });
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError('');
    try {
      const res = await fetch(`/api/rooms/${joinCode.trim().toLowerCase()}`);
      if (!res.ok) { setJoinError('Room not found. Check the code and try again.'); setJoining(false); return; }
      const { peerId: targetPeerId } = await res.json();
      joinCall(targetPeerId, uName);
      onStart({ uName, ctx, optIn });
    } catch {
      setJoinError('Could not reach server.');
      setJoining(false);
    }
  };

  const handleStart = () => onStart({ uName, ctx, optIn });

  return (
    <div className="screen active" id="sLobby">
      <div className="lob-card">
        <div className="lob-logo">
          <div className="lob-title">emo<span>-detect</span></div>
          <div className="lob-sub">Cross-Cultural AI · React</div>
        </div>

        <div className="cam-strip">
          <video ref={localVideoRef} autoPlay muted playsInline />
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

        {/* Room Code Display */}
        <div className="room-box">
          <div className="rb-title">Your room code</div>
          <div className="rb-create">
            <div className="rb-id" style={{
              fontSize: '15px', fontWeight: '700', letterSpacing: '0.06em',
              color: roomCode ? 'var(--green)' : 'var(--muted)',
              textTransform: 'uppercase',
            }}>
              {roomCode || (peerId ? 'Registering...' : 'Connecting...')}
            </div>
            <button className="rb-copy" onClick={handleCopy} disabled={!roomCode}>
              {copyLabel}
            </button>
          </div>

          <div className="rb-or">
            <div className="rb-or-line" />
            <span className="rb-or-txt">JOIN A ROOM</span>
            <div className="rb-or-line" />
          </div>

          <div className="rb-join" style={{ flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="fi"
                type="text"
                placeholder="swift-hawk-429"
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value); setJoinError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                style={{ textTransform: 'lowercase', letterSpacing: '0.04em' }}
              />
              <button className="btn-join" onClick={handleJoin} disabled={joining || !joinCode.trim()}>
                {joining ? '...' : 'Join'}
              </button>
            </div>
            {joinError && (
              <div style={{ fontSize: '11px', color: 'var(--red)', fontFamily: 'monospace', paddingLeft: '4px' }}>
                ⚠ {joinError}
              </div>
            )}
          </div>
        </div>

        <button className="btn-start" onClick={handleStart}>Start Session</button>
        <button className="btn-start" onClick={onDash}
          style={{ background: 'rgba(255,255,255,0.05)', color: 'white', marginTop: '-10px' }}>
          View Dashboard
        </button>

        {/* Opt-in data collection */}
        <div className="ds-note" style={{ cursor: 'pointer' }} onClick={() => setOptIn(v => !v)}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <span style={{
              width: '18px', height: '18px', borderRadius: '5px', border: '1.5px solid',
              borderColor: optIn ? 'var(--green)' : 'rgba(255,183,71,.5)',
              background: optIn ? 'var(--gd)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'all .2s'
            }}>
              {optIn && (
                <svg viewBox="0 0 10 8" width="10" height="8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="#3dffa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span>
              <strong style={{ color: optIn ? 'var(--green)' : 'var(--amber)' }}>
                {optIn ? '✓ Contributing to EmoSense dataset' : 'Opt in to improve our AI model'}
              </strong>
              <span style={{ display: 'block', marginTop: '2px', fontWeight: 'normal' }}>
                Anonymised facial data helps train our ZW-CN model. Compliant with the Cyber &amp; Data Protection Act (2021).
              </span>
            </span>
          </label>
        </div>

      </div>
    </div>
  );
}
