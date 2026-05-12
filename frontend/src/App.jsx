import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { useWebRTC } from './hooks/useWebRTC';
import { LangProvider } from './context/LangContext';
import Lobby from './components/Lobby';
import CallView from './components/CallView';
import ReportView from './components/ReportView';
import Dashboard from './components/Dashboard';
import Landing from './components/Landing';
import MirrorRoom from './components/MirrorRoom';
import Auth from './components/Auth';
import { supabase } from './supabase';

export default function App() {
  const [screen, setScreen] = useState('sLanding');
  const [sessionInfo, setSessionInfo] = useState({});
  const [emoCounts, setEmoCounts] = useState({ happy: 0, neutral: 0, sad: 0, angry: 0 });
  const [callSecs, setCallSecs] = useState(0);
  const [timeline, setTimeline] = useState([]);
  const [voiceTriggers, setVoiceTriggers] = useState([]);
  const [liveData, setLiveData] = useState({ counts: { happy: 0, neutral: 0, sad: 0, angry: 0 }, timeline: [], voiceTriggers: [] });

  const [videoUrl, setVideoUrl] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRemoteEnd = useCallback(() => {
    console.log('[App] Remote end detected, transitioning to report');
    setEmoCounts(prev => liveData.counts || prev);
    setTimeline(prev => liveData.timeline || prev);
    setVoiceTriggers(prev => liveData.voiceTriggers || prev);
    setScreen('sReport');
  }, [liveData]);

  const webRTC = useWebRTC(handleRemoteEnd);

  useEffect(() => {
    let int;
    if (screen === 'sCall' && webRTC.isConnected) {
      int = setInterval(() => setCallSecs(s => s + 1), 1000);
    } else if (screen === 'sLobby') {
      setCallSecs(0);
      setVideoUrl(null);
      setLiveData({ counts: { happy: 0, neutral: 0, sad: 0, angry: 0 }, timeline: [], voiceTriggers: [] });
    }
    return () => clearInterval(int);
  }, [screen, webRTC.isConnected]);

  const handleStart = (info) => {
    setSessionInfo(info);
    setScreen('sMirror');
  };

  const handleEnd = (finalCounts, finalTimeline, finalTriggers) => {
    setEmoCounts(finalCounts);
    setTimeline(finalTimeline || []);
    setVoiceTriggers(finalTriggers || []);
    setScreen('sReport');
  };

  return (
    <LangProvider>
      <div className="app-container">
        {screen === 'sLanding' && <Landing onLaunch={() => setScreen('sLobby')} />}
        
        {/* Protected Screens */}
        {!session && screen !== 'sLanding' && <Auth />}
        
        {session && (
          <>
            {screen === 'sLobby' && <Lobby onStart={handleStart} webRTC={webRTC} onDash={() => setScreen('sDashboard')} session={session} />}
            {screen === 'sMirror' && <MirrorRoom webRTC={webRTC} sessionInfo={sessionInfo} onJoin={() => setScreen('sCall')} onBack={() => setScreen('sLobby')} />}
            {screen === 'sCall' && <CallView onEnd={handleEnd} webRTC={webRTC} sessionInfo={sessionInfo} callSecs={callSecs} onDataUpdate={setLiveData} onVideoReady={setVideoUrl} />}
            {screen === 'sReport' && <ReportView onBack={() => setScreen('sLobby')} emoCounts={emoCounts} duration={callSecs} sessionInfo={sessionInfo} timeline={timeline} voiceTriggers={voiceTriggers} videoData={videoUrl} />}
            {screen === 'sDashboard' && <Dashboard onBack={() => setScreen('sLobby')} />}
          </>
        )}
      </div>
    </LangProvider>
  );
}
