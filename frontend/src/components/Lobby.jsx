import React, { useState, useEffect } from 'react';
import { useLang, LangSwitcher } from '../context/LangContext';
import { supabase } from '../supabase';

const PROFILE_KEY = 'emosense_profile';

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; } catch { return {}; }
}
function saveProfile(data) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

/**
 * Derive a friendly display name from an email address.
 * e.g. "john.doe@gmail.com" → "John Doe"
 *      "tinashe_moyo@outlook.com" → "Tinashe Moyo"
 */
function nameFromEmail(email) {
  if (!email) return '';
  const local = email.split('@')[0];          // e.g. "john.doe"
  return local
    .replace(/[._\-+]/g, ' ')               // replace separators with spaces
    .replace(/\d+/g, '')                     // strip trailing digits (e.g. john123)
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Detect country based on browser timezone.
 */
function detectCountry() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes('Harare')) return 'Zimbabwe';
    if (tz.includes('Shanghai') || tz.includes('Chongqing') || tz.includes('Hong_Kong') || tz.includes('Urumqi')) return 'China';
    return '';
  } catch (e) {
    return '';
  }
}

export default function Lobby({ onStart, webRTC, onDash, session }) {
  const { t } = useLang();
  const profile = loadProfile();

  // CRITICAL FIX: Prioritize Supabase user metadata for the name
  const meta = session?.user?.user_metadata || {};
  const authName = meta.full_name || meta.display_name || '';
  const authOrg = meta.organization ? `(${meta.organization})` : '';

  const [uName, setUName]         = useState(authName || profile.uName || '');
  const [ctx, setCtx]             = useState(profile.ctx   || detectCountry() || '');
  // Sync authName into uName once on first load if profile was empty
  React.useEffect(() => {
    if (!profile.uName && authName && !uName) setUName(authName);
  }, [authName]);
  const [joinId, setJoinId]       = useState('');
  const [optIn, setOptIn]         = useState(profile.optIn || false);
  const [roomId, setRoomId]       = useState('');
  const [retryDelay, setRetryDelay] = useState(3000);
  const [copyLabel, setCopyLabel] = useState('copy');
  const [joinError, setJoinError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [joining, setJoining]     = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  const { peerId, startCamera, joinCall, localVideoRef } = webRTC;

  useEffect(() => { startCamera(); }, []);

  useEffect(() => {
    saveProfile({ uName, ctx, optIn });
  }, [uName, ctx, optIn]);

  useEffect(() => {
    if (!peerId || (roomId && roomId !== 'offline')) return;
    
    let timeoutId;
    const registerRoom = async () => {
      try {
        const res = await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ peerId }),
        });
        if (!res.ok) throw new Error('Registration failed');
        const data = await res.json();
        if (data.code) {
          setRoomId(data.code);
          setRetryDelay(3000);
        } else {
          throw new Error('No ID returned');
        }
      } catch (err) {
        console.error('[Room Registration Error]', err);
        setRoomId('offline');
        timeoutId = setTimeout(() => {
          setRoomId(''); // trigger re-fetch
          setRetryDelay(prev => prev === 3000 ? 6000 : 10000);
        }, retryDelay);
      }
    };

    registerRoom();
    return () => clearTimeout(timeoutId);
  }, [peerId, roomId, retryDelay]);

  const handleCopy = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId).then(() => {
      setCopyLabel(t('copied'));
      setTimeout(() => setCopyLabel(t('copy')), 2000);
    });
  };

  const validateSetup = () => {
    setValidationError('');
    if (!uName.trim()) { setValidationError('Please enter your name.'); return false; }
    if (!ctx.trim()) { setValidationError('Please enter your country.'); return false; }
    return true;
  };

  const handleJoin = async () => {
    if (!validateSetup()) return;
    if (!joinId.trim()) { setJoinError('Please enter a room code.'); return; }
    if (!peerId) { setJoinError('Still connecting to server, please wait...'); return; }
    setJoining(true);
    setJoinError('');
    try {
      // Replace spaces with dashes first, then strip anything that isn't a-z, 0-9, or dash
      const cleanId = joinId.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
      if (!cleanId) { setJoinError('Invalid ID'); setJoining(false); return; }
      
      const res = await fetch(`/api/rooms/${cleanId}?guestId=${peerId}`);
      if (res.status === 404) { setJoinError('Room not found or expired'); setJoining(false); return; }
      if (!res.ok) { setJoinError('Server connection error'); setJoining(false); return; }
      
      const { peerId: targetPeerId } = await res.json();
      // Defer joinCall to MirrorRoom. Just pass targetPeerId to sessionInfo.
      onStart({ uName, ctx, optIn, targetPeerId, roomId: cleanId });
    } catch (err) {
      console.error('[Join Error]', err);
      setJoinError(t('serverError'));
      setJoining(false);
    }
  };

  const handleStart = () => {
    if (!validateSetup()) return;
    onStart({ uName, ctx, optIn, roomId });
  };

  return (
    <div className="screen active" id="sLobby">
      <style>{`
        @keyframes dotPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
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

          <div className="hero-chart-wrap">
            <div className="hero-chart-label">Live emotion detection</div>
            <div className="hero-chart">
              <svg
                viewBox="0 0 320 80"
                preserveAspectRatio="none"
                className="hero-chart-svg"
                aria-hidden="true"
              >
                <defs>
                  {/* Glow filters */}
                  <filter id="glow-green"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  <filter id="glow-blue"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  {/* Gradient fills under each line */}
                  <linearGradient id="grd-green" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3dffa0" stopOpacity="0.18"/>
                    <stop offset="100%" stopColor="#3dffa0" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="grd-blue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5b9cf6" stopOpacity="0.14"/>
                    <stop offset="100%" stopColor="#5b9cf6" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="grd-amber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffb347" stopOpacity="0.12"/>
                    <stop offset="100%" stopColor="#ffb347" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="grd-red" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.1"/>
                    <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0"/>
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[16, 32, 48, 64].map(y => (
                  <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
                ))}
                {[0,40,80,120,160,200,240,280,320].map(x => (
                  <line key={x} x1={x} y1="0" x2={x} y2="80" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
                ))}

                {/* Happy — green */}
                <polyline className="chart-line chart-happy" filter="url(#glow-green)"
                  points="0,58 20,42 40,30 60,22 80,34 100,28 120,18 140,26 160,32 180,20 200,30 220,16 240,26 260,20 280,32 300,22 320,18"/>
                <polygon className="chart-fill chart-fill-happy"
                  points="0,58 20,42 40,30 60,22 80,34 100,28 120,18 140,26 160,32 180,20 200,30 220,16 240,26 260,20 280,32 300,22 320,18 320,80 0,80"/>

                {/* Neutral — blue */}
                <polyline className="chart-line chart-neutral" filter="url(#glow-blue)"
                  points="0,44 20,50 40,46 60,52 80,44 100,48 120,52 140,46 160,50 180,44 200,52 220,46 240,52 260,46 280,50 300,46 320,52"/>
                <polygon className="chart-fill chart-fill-neutral"
                  points="0,44 20,50 40,46 60,52 80,44 100,48 120,52 140,46 160,50 180,44 200,52 220,46 240,52 260,46 280,50 300,46 320,52 320,80 0,80"/>

                {/* Sad — amber */}
                <polyline className="chart-line chart-sad"
                  points="0,68 20,64 40,70 60,66 80,72 100,68 120,66 140,72 160,68 180,70 200,64 220,70 240,66 260,72 280,68 300,70 320,66"/>

                {/* Angry — red */}
                <polyline className="chart-line chart-angry"
                  points="0,74 20,70 40,76 60,72 80,74 100,76 120,70 140,74 160,76 180,72 200,74 220,76 240,72 260,74 280,76 300,70 320,74"/>

                {/* Animated scan cursor */}
                <line className="chart-cursor" x1="0" y1="0" x2="0" y2="80"/>

                {/* Current peak dot */}
                <circle className="chart-dot" cx="220" cy="16" r="3" fill="#3dffa0" filter="url(#glow-green)"/>
              </svg>
            </div>

            {/* Legend */}
            <div className="hero-chart-legend">
              <span className="hcl hcl-green">Happy</span>
              <span className="hcl hcl-blue">Neutral</span>
              <span className="hcl hcl-amber">Sad</span>
              <span className="hcl hcl-red">Angry</span>
              <span className="hcl-acc">87.3% accuracy · ZW + CN</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <LangSwitcher />
            </div>
          </div>

          {/* Camera preview */}
          <div className="cam-strip">
            <video ref={localVideoRef} autoPlay muted playsInline />
          </div>

          {/* Name + Context */}
          <div className="lob-fields">
            <div className="fl">
              <label className="fl-l">{t('yourName')} <span style={{ opacity: 0.5, fontSize: '10px' }}>{authOrg}</span></label>
              <input className="fi" type="text" value={uName} onChange={e => { setUName(e.target.value); setValidationError(''); }} />
            </div>
            <div className="fl">
              <label className="fl-l">Your Country</label>
              <input
                className="fi"
                type="text"
                placeholder="e.g. Zimbabwe, China, USA…"
                value={ctx}
                onChange={e => { setCtx(e.target.value); setValidationError(''); }}
              />
            </div>
          </div>

          {validationError && (
            <div style={{ color: 'var(--red)', fontSize: '13px', background: 'rgba(255,59,48,0.1)', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(255,59,48,0.2)' }}>
              ⚠ {validationError}
            </div>
          )}

          {/* Room section */}
          <div className="room-box">
            <div className="room-cols">
              {/* Your room ID */}
              <div className="room-col">
                <div className="rb-title">{t('yourRoomId')}</div>
                <div className="rb-id" style={{ color: (roomId && roomId !== 'offline') ? 'var(--green)' : 'var(--muted)', fontSize: (!peerId || roomId === 'offline') ? '13px' : 'inherit' }}>
                  {!peerId ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--blue)' }}>
                      <span style={{ width: '8px', height: '8px', background: 'var(--blue)', borderRadius: '50%', animation: 'dotPulse 1.5s infinite' }} />
                      Connecting to signaling server…
                    </span>
                  ) : roomId === 'offline' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--amber)' }}>
                      <span style={{ width: '8px', height: '8px', background: 'var(--amber)', borderRadius: '50%', animation: 'dotPulse 1.5s infinite' }} />
                      Server waking up, retrying…
                    </span>
                  ) : (roomId || t('registering'))}
                </div>
                <button className="rb-copy" onClick={handleCopy} disabled={!roomId || roomId === 'offline'}>
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
                  value={joinId}
                  onChange={e => { setJoinId(e.target.value); setJoinError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />
                <button className="btn-join full-w" onClick={handleJoin} disabled={joining || !joinId.trim() || !peerId}>
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
            <button className="btn-start" onClick={handleStart} disabled={!peerId || !roomId || roomId === 'offline'}>{t('startSession')}</button>
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
