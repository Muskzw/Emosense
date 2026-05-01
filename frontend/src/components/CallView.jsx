import React, { useRef, useEffect } from 'react';
import { useFaceAPI, EMO } from '../hooks/useFaceAPI';

export default function CallView({ onEnd, webRTC, sessionInfo, callSecs }) {
  const { remoteName, isConnected, remoteVideoRef, localVideoRef, endCall } = webRTC;
  const svgRef = useRef(null);
  const canvasRef = useRef(null);

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

  return (
    <div className="screen active" id="sCall">
      <div className="c-hdr">
        <div className="chl">
          <div className="ch-name">emo<span>-detect</span> (React)</div>
          {isConnected && <div className="live-pill"><div className="ldot"></div>LIVE</div>}
        </div>
        <div className="ctimer">{String(Math.floor(callSecs/60)).padStart(2,'0')}:{String(callSecs%60).padStart(2,'0')}</div>
        <div className="ctx-pill"><span>{sessionInfo.ctx}</span></div>
      </div>
      
      <div className="c-body">
        <div className="c-main">
          <div className="v-grid">
            <div className="v-tile">
              {!isConnected && <div className="rw"><div className="rw-ico"></div><div className="rw-txt">Waiting for peer...</div></div>}
              <video ref={remoteVideoRef} className="tile-vid-r" autoPlay playsInline style={{display: isConnected ? 'block' : 'none'}}></video>
              <div className="face-scene" style={{display: isConnected ? 'flex' : 'none'}}>
                <div className="fsw">
                  <svg ref={svgRef} className="face-svg" style={{position: 'absolute', inset: 0}}></svg>
                </div>
              </div>
              <canvas ref={canvasRef} style={{display:'none'}}></canvas>
              <div className="tfoot">
                <div className="tf-name">{remoteName}</div>
              </div>
            </div>
            <div className="v-tile v-tile-local">
              <video ref={localVideoRef} className="tile-vid" autoPlay muted playsInline></video>
              <div className="tfoot">
                <div className="tf-name">You</div>
              </div>
            </div>
          </div>
        </div>
        
        <aside className="c-side">
          <div className="sb">
            <div className="sb-lbl">Live Breakdown</div>
            <div className="emo-rows">
              <div className="er"><div className="er-head"><span className="er-nm">Happy</span><span className="er-pc">{getPct(emoCounts.happy)}%</span></div><div className="er-track"><div className="er-fill ef-h" style={{width:`${getPct(emoCounts.happy)}%`}}></div></div></div>
              <div className="er"><div className="er-head"><span className="er-nm">Neutral</span><span className="er-pc">{getPct(emoCounts.neutral)}%</span></div><div className="er-track"><div className="er-fill ef-n" style={{width:`${getPct(emoCounts.neutral)}%`}}></div></div></div>
              <div className="er"><div className="er-head"><span className="er-nm">Sad</span><span className="er-pc">{getPct(emoCounts.sad)}%</span></div><div className="er-track"><div className="er-fill ef-s" style={{width:`${getPct(emoCounts.sad)}%`}}></div></div></div>
              <div className="er"><div className="er-head"><span className="er-nm">Angry</span><span className="er-pc">{getPct(emoCounts.angry)}%</span></div><div className="er-track"><div className="er-fill ef-a" style={{width:`${getPct(emoCounts.angry)}%`}}></div></div></div>
            </div>
          </div>
          <div className="sb stats-cluster">
            <div className="si"><div className="sv">{detCount}</div><div className="sl-s">Scans</div></div>
            <div className="sdiv"></div>
            <div className="si"><div className="sv" style={{color: curE.c}}>{curE.n}</div><div className="sl-s">Current</div></div>
          </div>
        </aside>
      </div>
      
      <div className="c-bot">
        <div className="cg">
          <button onClick={handleEnd} style={{background: '#ff6b6b', color: 'white', borderRadius:'12px', padding:'10px 16px', fontWeight:'bold', border:'none', cursor:'pointer'}}>END SESSION</button>
        </div>
        <div className="cg">
           <div style={{fontSize:'10px', color: modelsLoaded ? '#3dffa0' : '#ffb347', fontFamily: 'monospace'}}>
             {modelsLoaded ? '● AI Models Active' : '○ Loading AI Models...'}
           </div>
        </div>
      </div>
    </div>
  );
}
