import React, { useState, useEffect } from 'react';
import { useLang, LangSwitcher } from '../context/LangContext';

const PROFILE_KEY = 'emosense_profile';

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; } catch { return {}; }
}
function saveProfile(data) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

export default function Lobby({ onStart, webRTC, onDash }) {
  const { t } = useLang();
  const profile = loadProfile();

  const [uName, setUName]       = useState(profile.uName || 'Tinashe Moyo');
  const [ctx, setCtx]           = useState(profile.ctx   || 'ZW-CN');
  const [joinCode, setJoinCode] = useState('');
  const [optIn, setOptIn]       = useState(profile.optIn || false);
  const [roomCode, setRoomCode] = useState('');
  const [copyLabel, setCopyLabel] = useState('copy');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining]   = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  const { peerId, startCamera, joinCall, localVideoRef } = webRTC;

  useEffect(() => { startCamera(); }, []);

  // Persist profile on every change
  useEffect(() => {
    saveProfile({ uName, ctx, optIn });
  }, [uName, ctx, optIn]);

  // Register for a room code once we have a peerId
  useEffect(() => {
    if (!peerId || roomCode) return; // Don't fetch if we already have a code
    console.log('[Lobby] Fetching room code for Peer:', peerId);
    fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peerId }),
    })
      .then(r => r.json())
      .then(data => { if (data.code) setRoomCode(data.code); })
      .catch(() => setRoomCode('offline'));
  }, [peerId, roomCode]);

  const handleCopy = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopyLabel(t('copied'));
      setTimeout(() => setCopyLabel(t('copy')), 2000);
    });
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError('');
    try {
      // Strip out anything that isn't a letter, number, or hyphen
      const cleanCode = joinCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (!cleanCode) {
        setJoinError(t('roomNotFound'));
        setJoining(false);
        return;
      }
      
      const res = await fetch(`/api/rooms/${cleanCode}`);
      if (!res.ok) { setJoinError(t('roomNotFound')); setJoining(false); return; }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      const { peerId: targetPeerId } = await res.json();
      joinCall(targetPeerId, uName);
      onStart({ uName, ctx, optIn });
    } catch (err) {
      console.error('[Join Error]', err);
      setJoinError(t('serverError'));
      setJoining(false);
    }
  };

  const handleStart = () => onStart({ uName, ctx, optIn });

  return (
    <div className="screen active" id="sLobby">
      <div className="lob-card">

        {/* Header + Language Switcher */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div className="lob-logo">
            <div className="lob-title">emo<span>-detect</span></div>
            <div className="lob-sub">{t('appSub')}</div>
            <button 
              onClick={() => setShowProModal(true)}
              style={{
                marginTop: '6px', padding: '4px 10px', borderRadius: '999px',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                border: 'none', color: '#1a1a2e', fontSize: '10px', fontWeight: '800',
                letterSpacing: '0.05em', cursor: 'pointer', boxShadow: '0 2px 10px rgba(255, 215, 0, 0.4)'
              }}>
              UPGRADE TO PRO
            </button>
          </div>
          <LangSwitcher style={{ marginTop: '4px' }} />
        </div>

        <div className="cam-strip">
          <video ref={localVideoRef} autoPlay muted playsInline />
        </div>

        <div className="fl">
          <label className="fl-l">{t('yourName')}</label>
          <input className="fi" type="text" value={uName} onChange={e => setUName(e.target.value)} />
        </div>

        <div className="fl">
          <label className="fl-l">{t('culturalCtx')}</label>
          <select className="fi" value={ctx} onChange={e => setCtx(e.target.value)}>
            <option value="ZW-CN">{t('ctxZWCN')}</option>
            <option value="ZW-ZW">{t('ctxZWZW')}</option>
            <option value="INT">{t('ctxINT')}</option>
          </select>
        </div>

        {/* Room Code */}
        <div className="room-box">
          <div className="rb-title">{t('yourRoomCode')}</div>
          <div className="rb-create">
            <div className="rb-id" style={{
            fontSize: '15px', fontWeight: '700', letterSpacing: '0.06em',
            color: roomCode ? 'var(--green)' : 'var(--muted)',
          }}>
            {roomCode || (peerId ? t('registering') : t('connecting'))}
          </div>
            <button className="rb-copy" onClick={handleCopy} disabled={!roomCode}>
              {copyLabel || t('copy')}
            </button>
          </div>

          <div className="rb-or">
            <div className="rb-or-line" />
            <span className="rb-or-txt">{t('joinRoom')}</span>
            <div className="rb-or-line" />
          </div>

          <div className="rb-join" style={{ flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="fi"
                type="text"
                placeholder={t('joinPlaceholder')}
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value); setJoinError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
              <button className="btn-join" onClick={handleJoin} disabled={joining || !joinCode.trim()}>
                {joining ? '...' : t('join')}
              </button>
            </div>
            {joinError && (
              <div style={{ fontSize: '11px', color: 'var(--red)', fontFamily: 'monospace', paddingLeft: '4px' }}>
                ⚠ {joinError}
              </div>
            )}
          </div>
        </div>

        <button className="btn-start" onClick={handleStart}>{t('startSession')}</button>
        <button className="btn-start" onClick={onDash}
          style={{ background: 'rgba(255,255,255,0.05)', color: 'white', marginTop: '-10px' }}>
          {t('viewDashboard')}
        </button>

        {/* Opt-in data collection */}
        <div className="ds-note" style={{ cursor: 'pointer' }} onClick={() => setOptIn(v => !v)}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <span style={{
              width: '18px', height: '18px', borderRadius: '5px', border: '1.5px solid',
              borderColor: optIn ? 'var(--green)' : 'rgba(255,183,71,.5)',
              background: optIn ? 'var(--gd)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'all .2s',
            }}>
              {optIn && (
                <svg viewBox="0 0 10 8" width="10" height="8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="#3dffa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span>
              <strong style={{ color: optIn ? 'var(--green)' : 'var(--amber)' }}>
                {optIn ? t('optInActive') : t('optInLabel')}
              </strong>
              <span style={{ display: 'block', marginTop: '2px', fontWeight: 'normal' }}>
                {t('optInDesc')}
              </span>
            </span>
          </label>
        </div>

        {/* Pro Subscription Modal Mockup */}
        {showProModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              background: 'linear-gradient(180deg, rgba(30,30,40,0.95) 0%, rgba(20,20,30,0.95) 100%)',
              border: '1px solid rgba(255,215,0,0.3)', borderRadius: '24px',
              padding: '32px', width: '90%', maxWidth: '400px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,215,0,0.2)',
              position: 'relative'
            }}>
              <button 
                onClick={() => setShowProModal(false)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '20px', cursor: 'pointer' }}
              >✕</button>
              
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ 
                  display: 'inline-block', padding: '6px 14px', borderRadius: '999px', background: 'rgba(255,215,0,0.15)', 
                  color: '#FFD700', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '12px' 
                }}>EMOSENSE PRO</div>
                <h2 style={{ color: 'white', fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0' }}>Unlock AI Voice Analytics</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                  Take your cross-cultural communication to the next level with premium features.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {[
                  'Advanced AI Voice Analytics & Triggers',
                  'One-Click Session Recording (.webm)',
                  'Unlimited Historical Session Reports',
                  'Priority PeerJS Routing (Low Latency)'
                ].map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#34c759', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg viewBox="0 0 10 8" width="10" height="8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>{feat}</span>
                  </div>
                ))}
              </div>

              <button style={{
                width: '100%', padding: '16px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                border: 'none', color: '#1a1a2e', fontSize: '15px', fontWeight: '700',
                cursor: 'pointer', boxShadow: '0 8px 24px rgba(255, 215, 0, 0.3)'
              }} onClick={() => setShowProModal(false)}>
                Start 7-Day Free Trial
              </button>
              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                $12.99/month after trial. Cancel anytime.
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
