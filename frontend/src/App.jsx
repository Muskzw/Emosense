import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';
import { useTheme } from './hooks/useTheme';
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
  const theme = useTheme();
  const [screen, setScreen] = useState('sLanding');
  const [sessionInfo, setSessionInfo] = useState({});
  const [emoCounts, setEmoCounts] = useState({ happy: 0, neutral: 0, sad: 0, angry: 0 });
  const [callSecs, setCallSecs] = useState(0);
  const [timeline, setTimeline] = useState([]);
  const [voiceTriggers, setVoiceTriggers] = useState([]);
  const [liveData, setLiveData] = useState({ counts: { happy: 0, neutral: 0, sad: 0, angry: 0 }, timeline: [], voiceTriggers: [] });
  // Keep a ref always pointing at the latest liveData so handleRemoteEnd never reads a stale closure
  const liveDataRef = useRef({ counts: { happy: 0, neutral: 0, sad: 0, angry: 0 }, timeline: [], voiceTriggers: [] });
  useEffect(() => { liveDataRef.current = liveData; }, [liveData]);

  const [videoUrl, setVideoUrl] = useState(null);
  // ── Dev Auth Bypass ─────────────────────────────────────────────
  // When VITE_DEV_BYPASS_AUTH=true in .env, skip Supabase auth and
  // inject a fake local session so you can test the UI directly.
  const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
  const DEV_SESSION = DEV_BYPASS ? {
    user: {
      id: 'dev-local-user',
      email: 'dev@emosense.local',
      user_metadata: {
        full_name: 'Dev Tester',
        display_name: 'Dev Tester',
        organization: 'EmoSense Lab',
        role: 'Developer',
        location: 'Zimbabwe',
      }
    },
    access_token: 'dev-bypass-token',
  } : null;
  // ────────────────────────────────────────────────────────────────

  const [session, setSession] = useState(DEV_BYPASS ? DEV_SESSION : null);

  useEffect(() => {
    // Skip Supabase entirely in dev bypass mode
    if (DEV_BYPASS) return;

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
    const d = liveDataRef.current;
    setEmoCounts(d.counts || { happy: 0, neutral: 0, sad: 0, angry: 0 });
    setTimeline(d.timeline || []);
    setVoiceTriggers(d.voiceTriggers || []);
    setScreen('sReport');
  }, []); // no deps needed — reads from ref

  const webRTC = useWebRTC(handleRemoteEnd, sessionInfo?.uName);

  useEffect(() => {
    let int;
    if (screen === 'sCall' && webRTC.isConnected) {
      int = setInterval(() => setCallSecs(s => s + 1), 1000);
    } else if (screen === 'sLobby') {
      setCallSecs(0);
      setVideoUrl(null);
      setLiveData({ counts: { happy: 0, neutral: 0, sad: 0, angry: 0 }, timeline: [], voiceTriggers: [] });
      if (webRTC.isConnected || webRTC.remoteStream || webRTC.faceStream) {
        webRTC.endCall();
      }
    } else if (screen !== 'sMirror' && screen !== 'sCall') {
      // Cleanly stop the camera if going to sReport, sDashboard, sLanding, etc.
      if (webRTC.isConnected || webRTC.remoteStream || webRTC.faceStream) {
        webRTC.endCall();
      }
    }
    return () => clearInterval(int);
  }, [screen, webRTC.isConnected, webRTC.remoteStream, webRTC.faceStream]);

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
            {screen === 'sReport' && <ReportView onBack={() => setScreen('sLobby')} emoCounts={emoCounts} duration={callSecs} sessionInfo={sessionInfo} timeline={timeline} voiceTriggers={voiceTriggers} videoData={videoUrl} session={session} />}
            {screen === 'sDashboard' && <Dashboard onBack={() => setScreen('sLobby')} session={session} />}
          </>
        )}
      </div>
    </LangProvider>
  );
}
