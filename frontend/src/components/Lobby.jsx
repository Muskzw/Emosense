import React, { useState, useEffect } from 'react';

export default function Lobby({ onStart, webRTC }) {
  const [uName, setUName] = useState('Tinashe Moyo');
  const [ctx, setCtx] = useState('ZW-CN');
  const [joinId, setJoinId] = useState('');
  const { peerId, startCamera, joinCall, isConnected, localVideoRef } = webRTC;

  useEffect(() => {
    startCamera();
  }, []);

  const handleJoin = () => {
    if (joinId) joinCall(joinId, uName);
    onStart({ uName, ctx });
  };

  const handleStart = () => {
    onStart({ uName, ctx });
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
      </div>
    </div>
  );
}
