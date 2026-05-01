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

  const { peerId, startCamera, joinCall, localVideoRef } = webRTC;

  useEffect(() => { startCamera(); }, []);

  // Persist profile on every change
  useEffect(() => {
    saveProfile({ uName, ctx, optIn });
  }, [uName, ctx, optIn]);

  // Register for a room code once we have a peerId
  useEffect(() => {
    if (!peerId) return;
    fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peerId }),
    })
      .then(r => r.json())
      .then(data => { if (data.code) setRoomCode(data.code); })
      .catch(() => setRoomCode('offline'));
  }, [peerId]);

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
      const res = await fetch(`/api/rooms/${joinCode.trim().toLowerCase()}`);
      if (!res.ok) { setJoinError(t('roomNotFound')); setJoining(false); return; }
      const { peerId: targetPeerId } = await res.json();
      joinCall(targetPeerId, uName);
      onStart({ uName, ctx, optIn });
    } catch {
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
              textTransform: 'uppercase',
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
                style={{ textTransform: 'lowercase', letterSpacing: '0.04em' }}
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

      </div>
    </div>
  );
}
