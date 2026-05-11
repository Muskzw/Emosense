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

  const [uName, setUName]         = useState(profile.uName || 'Tinashe Moyo');
  const [ctx, setCtx]             = useState(profile.ctx   || 'ZW-CN');
  const [joinCode, setJoinCode]   = useState('');
  const [optIn, setOptIn]         = useState(profile.optIn || false);
  const [roomCode, setRoomCode]   = useState('');
  const [copyLabel, setCopyLabel] = useState('copy');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining]     = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  const { peerId, startCamera, joinCall, localVideoRef } = webRTC;

  useEffect(() => { startCamera(); }, []);

  useEffect(() => {
    saveProfile({ uName, ctx, optIn });
  }, [uName, ctx, optIn]);

  useEffect(() => {
    if (!peerId || roomCode) return;
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
      const cleanCode = joinCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (!cleanCode) { setJoinError(t('roomNotFound')); setJoining(false); return; }
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

      {/* ── Desktop two-column layout ── */}
      <div className="lob-desktop-wrap">

        {/* LEFT: hero branding */}
        <div className="lob-hero">
          <div className="lob-hero-logo">
            <div className="lob-mark">
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5.5" r="2.8" stroke="#3dffa0" strokeWidth="1.2"/>
                <path d="M2.5 14c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="#3dffa0" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="lob-hero-brand">emo<span>-detect</span></span>
          </div>

          <h1 className="lob-hero-tagline">{t('heroTagline')}</h1>
          <p className="lob-hero-desc">{t('heroDescription')}</p>

          <div className="lob-hero-stats">
            <div className="lhs">
              <div className="lhs-val">87.3%</div>
              <div className="lhs-lbl">Accuracy</div>
            </div>
            <div className="lhs-div" />
            <div className="lhs">
              <div className="lhs-val" style={{ color: 'var(--blue)' }}>Real-time</div>
              <div className="lhs-lbl">Inference</div>
            </div>
            <div className="lhs-div" />
            <div className="lhs">
              <div className="lhs-val" style={{ color: 'var(--amber)' }}>&lt;5%</div>
              <div className="lhs-lbl">ZW vs CN gap</div>
            </div>
          </div>
        </div>

        {/* RIGHT: form card */}
        <div className="lob-card">

          {/* Card header */}
          <div className="lob-card-hdr">
            <div>
              <div className="lob-title">emo<span>-detect</span></div>
              <div className="lob-sub">{t('appSub')}</div>
              <button className="pro-badge" onClick={() => setShowProModal(true)}>
                UPGRADE TO PRO
              </button>
            </div>
            <LangSwitcher />
          </div>

          {/* Camera preview */}
          <div className="cam-strip">
            <video ref={localVideoRef} autoPlay muted playsInline />
          </div>

          {/* Name + Context */}
          <div className="lob-fields">
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
          </div>

          {/* Room section */}
          <div className="room-box">
            <div className="room-cols">
              {/* Your room code */}
              <div className="room-col">
                <div className="rb-title">{t('yourRoomCode')}</div>
                <div className="rb-id" style={{ color: roomCode ? 'var(--green)' : 'var(--muted)' }}>
                  {roomCode || (peerId ? t('registering') : t('connecting'))}
                </div>
                <button className="rb-copy" onClick={handleCopy} disabled={!roomCode}>
                  {copyLabel || t('copy')}
                </button>
              </div>

              {/* Divider */}
              <div className="room-divider">
                <div className="room-div-line" />
                <span className="room-div-or">OR</span>
                <div className="room-div-line" />
              </div>

              {/* Join a room */}
              <div className="room-col">
                <div className="rb-title">{t('joinRoom')}</div>
                <input
                  className="fi"
                  type="text"
                  placeholder={t('joinPlaceholder')}
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value); setJoinError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />
                <button className="btn-join full-w" onClick={handleJoin} disabled={joining || !joinCode.trim()}>
                  {joining ? '...' : t('join')}
                </button>
                {joinError && (
                  <div className="join-err">⚠ {joinError}</div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="lob-actions">
            <button className="btn-start" onClick={handleStart}>{t('startSession')}</button>
            <button className="btn-dash" onClick={onDash}>{t('viewDashboard')}</button>
          </div>

          {/* Opt-in */}
          <div className="ds-note" style={{ cursor: 'pointer' }} onClick={() => setOptIn(v => !v)}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <span className={`opt-box ${optIn ? 'opt-on' : ''}`}>
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

        </div>{/* /lob-card */}
      </div>{/* /lob-desktop-wrap */}

      {/* Pro Modal */}
      {showProModal && (
        <div className="modal-bg" onClick={() => setShowProModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowProModal(false)}>✕</button>
            <div className="modal-badge">EMOSENSE PRO</div>
            <h2 className="modal-title">Unlock AI Voice Analytics</h2>
            <p className="modal-sub">Take your cross-cultural communication to the next level with premium features.</p>
            <div className="modal-feats">
              {[
                'Advanced AI Voice Analytics & Triggers',
                'One-Click Session Recording (.webm)',
                'Unlimited Historical Session Reports',
                'Priority PeerJS Routing (Low Latency)',
              ].map((f, i) => (
                <div key={i} className="modal-feat">
                  <div className="feat-check">
                    <svg viewBox="0 0 10 8" width="10" height="8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <button className="modal-cta" onClick={() => setShowProModal(false)}>Start 7-Day Free Trial</button>
            <div className="modal-fine">$12.99/month after trial. Cancel anytime.</div>
          </div>
        </div>
      )}

    </div>
  );
}
