import React, { useState } from 'react';
import './index.css';
import { useWebRTC } from './hooks/useWebRTC';
import Lobby from './components/Lobby';
import CallView from './components/CallView';

export default function App() {
  const [screen, setScreen] = useState('sLobby');
  const [sessionInfo, setSessionInfo] = useState({});
  const webRTC = useWebRTC();

  const handleStart = (info) => {
    setSessionInfo(info);
    setScreen('sCall');
  };

  const handleEnd = () => {
    setScreen('sReport');
  };

  return (
    <div className="app-container">
      {screen === 'sLobby' && <Lobby onStart={handleStart} webRTC={webRTC} />}
      {screen === 'sCall' && <CallView onEnd={handleEnd} webRTC={webRTC} sessionInfo={sessionInfo} />}
      {screen === 'sReport' && (
        <div className="screen active" id="sReport">
          <h2>Session Ended</h2>
          <button className="btn-new" onClick={() => setScreen('sLobby')}>Back to Lobby</button>
        </div>
      )}
    </div>
  );
}
