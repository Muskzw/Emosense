import React, { useState, useEffect } from 'react';
import './index.css';
import { useWebRTC } from './hooks/useWebRTC';
import Lobby from './components/Lobby';
import CallView from './components/CallView';
import ReportView from './components/ReportView';
import Dashboard from './components/Dashboard';

export default function App() {
  const [screen, setScreen] = useState('sLobby');
  const [sessionInfo, setSessionInfo] = useState({});
  const [emoCounts, setEmoCounts] = useState({ happy: 0, neutral: 0, sad: 0, angry: 0 });
  const [callSecs, setCallSecs] = useState(0);
  const webRTC = useWebRTC();

  useEffect(() => {
    let int;
    if (screen === 'sCall') {
      int = setInterval(() => setCallSecs(s => s + 1), 1000);
    } else if (screen === 'sLobby') {
      setCallSecs(0);
    }
    return () => clearInterval(int);
  }, [screen]);

  const handleStart = (info) => {
    setSessionInfo(info);
    setScreen('sCall');
  };

  const handleEnd = (finalCounts) => {
    setEmoCounts(finalCounts);
    setScreen('sReport');
  };

  return (
    <div className="app-container">
      {screen === 'sLobby' && <Lobby onStart={handleStart} webRTC={webRTC} onDash={() => setScreen('sDashboard')} />}
      {screen === 'sCall' && <CallView onEnd={handleEnd} webRTC={webRTC} sessionInfo={sessionInfo} callSecs={callSecs} />}
      {screen === 'sReport' && <ReportView onBack={() => setScreen('sLobby')} emoCounts={emoCounts} duration={callSecs} sessionInfo={sessionInfo} />}
      {screen === 'sDashboard' && <Dashboard onBack={() => setScreen('sLobby')} />}
    </div>
  );
}
