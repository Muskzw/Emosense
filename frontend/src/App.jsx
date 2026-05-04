import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { useWebRTC } from './hooks/useWebRTC';
import { LangProvider } from './context/LangContext';
import Lobby from './components/Lobby';
import CallView from './components/CallView';
import ReportView from './components/ReportView';
import Dashboard from './components/Dashboard';
import Landing from './components/Landing';

export default function App() {
  const [screen, setScreen] = useState('sLanding');
  const [sessionInfo, setSessionInfo] = useState({});
  const [emoCounts, setEmoCounts] = useState({ happy: 0, neutral: 0, sad: 0, angry: 0 });
  const [callSecs, setCallSecs] = useState(0);
  const [timeline, setTimeline] = useState([]);
  const [liveData, setLiveData] = useState({ counts: { happy: 0, neutral: 0, sad: 0, angry: 0 }, timeline: [] });

  const handleRemoteEnd = useCallback(() => {
    console.log('[App] Remote end detected, transitioning to report');
    setEmoCounts(prev => liveData.counts || prev);
    setTimeline(prev => liveData.timeline || prev);
    setScreen('sReport');
  }, [liveData]);

  const webRTC = useWebRTC(handleRemoteEnd);

  useEffect(() => {
    let int;
    if (screen === 'sCall' && webRTC.isConnected) {
      int = setInterval(() => setCallSecs(s => s + 1), 1000);
    } else if (screen === 'sLobby') {
      setCallSecs(0);
      setLiveData({ counts: { happy: 0, neutral: 0, sad: 0, angry: 0 }, timeline: [] });
    }
    return () => clearInterval(int);
  }, [screen, webRTC.isConnected]);

  const handleStart = (info) => {
    setSessionInfo(info);
    setScreen('sCall');
  };

  const handleEnd = (finalCounts, finalTimeline) => {
    setEmoCounts(finalCounts);
    setTimeline(finalTimeline || []);
    setScreen('sReport');
  };

  return (
    <LangProvider>
      <div className="app-container">
        {screen === 'sLanding' && <Landing onLaunch={() => setScreen('sLobby')} />}
        {screen === 'sLobby' && <Lobby onStart={handleStart} webRTC={webRTC} onDash={() => setScreen('sDashboard')} />}
        {screen === 'sCall' && <CallView onEnd={handleEnd} webRTC={webRTC} sessionInfo={sessionInfo} callSecs={callSecs} onDataUpdate={setLiveData} />}
        {screen === 'sReport' && <ReportView onBack={() => setScreen('sLobby')} emoCounts={emoCounts} duration={callSecs} sessionInfo={sessionInfo} timeline={timeline} />}
        {screen === 'sDashboard' && <Dashboard onBack={() => setScreen('sLobby')} />}
      </div>
    </LangProvider>
  );
}
