import React from 'react';

export default function CallView({ onEnd, webRTC, sessionInfo }) {
  const { remoteName, isConnected, remoteVideoRef, localVideoRef, endCall } = webRTC;

  const handleEnd = () => {
    endCall();
    onEnd();
  };

  return (
    <div className="screen active" id="sCall">
      <div className="c-hdr">
        <div className="ch-name">emo<span>-detect</span> React</div>
        <div className="ctx-pill"><span>{sessionInfo.ctx}</span></div>
      </div>
      
      <div className="c-body">
        <div className="c-main">
          <div className="v-grid">
            <div className="v-tile">
              {!isConnected && <div className="rw">Waiting for peer...</div>}
              <video ref={remoteVideoRef} className="tile-vid-r" autoPlay playsInline style={{display: isConnected ? 'block' : 'none'}}></video>
            </div>
            <div className="v-tile v-tile-local">
              <video ref={localVideoRef} className="tile-vid" autoPlay muted playsInline></video>
            </div>
          </div>
        </div>
        
        <aside className="c-side">
          <div className="sb">
            <div className="sb-lbl">Breakdown · {remoteName}</div>
            <p className="ds-note">Emotion detection is being ported to React Web Workers...</p>
          </div>
        </aside>
      </div>
      
      <div className="c-bot">
        <div className="cg">
          <button className="ctrl danger" onClick={handleEnd}>END</button>
        </div>
      </div>
    </div>
  );
}
