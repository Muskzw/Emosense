import React, { useState, useEffect } from 'react';

const EMO_COLORS = {
  happy:   { color: '#3dffa0', label: 'Happy'   },
  neutral: { color: '#8899bb', label: 'Neutral'  },
  sad:     { color: '#5b9cf6', label: 'Sad'      },
  angry:   { color: '#ff6b6b', label: 'Angry'    },
};

const MIN_DURATION = 60; // sessions < 1 min are test calls

function fmt(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}m ${s}s`;
}

function EmpathyLineGraph({ sessions }) {
  const [hovered, setHovered] = useState(null);

  if (sessions.length < 2) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--dim)', fontSize: '13px' }}>
      Complete at least 2 meaningful calls to see your trend line.
    </div>
  );

  const W = 100, H = 60, padX = 6, padY = 8;

  const scores = sessions.map(s => {
    const pos = (s.happy || 0) + (s.neutral || 0);
    const tot = pos + (s.sad || 0) + (s.angry || 0);
    return tot > 0 ? Math.round((pos / tot) * 100) : 50;
  });

  const toX = i => padX + (i / (scores.length - 1)) * (W - padX * 2);
  const toY = v => padY + (1 - v / 100) * (H - padY * 2);

  const linePath = scores.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${toX(scores.length - 1).toFixed(1)} ${(H - padY).toFixed(1)} L ${toX(0).toFixed(1)} ${(H - padY).toFixed(1)} Z`;
  const yLines = [25, 50, 75, 100];

  return (
    <div style={{ position: 'relative' }}>
      {/* Y-axis labels */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: '4px', paddingBottom: '4px' }}>
        {[100, 75, 50, 25].map(v => (
          <span key={v} style={{ fontSize: '9px', color: 'var(--dim)', fontFamily: 'monospace', textAlign: 'right', paddingRight: '6px' }}>{v}%</span>
        ))}
      </div>

      <div style={{ marginLeft: '36px', position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '180px', overflow: 'visible' }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="empGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3dffa0" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3dffa0" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yLines.map(v => (
            <line key={v} x1={padX} y1={toY(v)} x2={W - padX} y2={toY(v)}
              stroke="var(--bd)" strokeWidth="0.5" strokeDasharray="2 2" />
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#empGrad)" />

          {/* The line */}
          <path d={linePath} fill="none" stroke="#3dffa0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {scores.map((v, i) => (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
              <circle cx={toX(i)} cy={toY(v)} r="3" fill={hovered === i ? '#fff' : '#3dffa0'} stroke={hovered === i ? '#3dffa0' : 'transparent'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <circle cx={toX(i)} cy={toY(v)} r="8" fill="transparent" />
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {hovered !== null && (
          <div style={{
            position: 'absolute',
            top: `${(toY(scores[hovered]) / 60) * 180 - 52}px`,
            left: `calc(${(toX(scores[hovered]) / 100) * 100}% - 52px)`,
            background: 'var(--surf)', border: '1px solid var(--bd)',
            borderRadius: '10px', padding: '8px 12px', pointerEvents: 'none', zIndex: 10,
            backdropFilter: 'blur(10px)', minWidth: '104px', textAlign: 'center',
            boxShadow: '0 4px 12px var(--shadow)'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: scores[hovered] >= 70 ? '#3dffa0' : scores[hovered] >= 50 ? '#8899bb' : '#ff6b6b' }}>
              {scores[hovered]}%
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
              Empathy · Session {hovered + 1}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--dim)', marginTop: '1px' }}>
              {new Date(sessions[hovered].ts).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* X-axis session labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingLeft: '2px', paddingRight: '2px' }}>
          {sessions.map((s, i) => (
            <span key={i} style={{ fontSize: '9px', color: i === hovered ? 'var(--txt)' : 'var(--dim)', fontFamily: 'monospace', transition: 'color 0.2s' }}>
              #{i + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ onBack, session }) {
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = session?.user?.id;

  useEffect(() => {
    const url = userId ? `/api/sessions?userId=${userId}` : '/api/sessions';
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setAllSessions(data);
        else console.error('[Dashboard] Backend error:', data);
        setLoading(false);
      })
      .catch(e => { console.error('[Dashboard] Fetch error:', e); setLoading(false); });
  }, [userId]);

  // Only meaningful sessions (>= 1 minute)
  const sessions = allSessions.filter(s => s.duration >= MIN_DURATION);

  const totalCalls = sessions.length;
  const totalDur = sessions.reduce((acc, s) => acc + s.duration, 0);
  const avgDur = totalCalls ? Math.floor(totalDur / totalCalls) : 0;

  let totalPos = 0, totalNeg = 0;
  sessions.forEach(s => {
    totalPos += (s.happy || 0) + (s.neutral || 0);
    totalNeg += (s.sad || 0) + (s.angry || 0);
  });
  const empScore = (totalPos + totalNeg) > 0 ? Math.round((totalPos / (totalPos + totalNeg)) * 100) : 0;
  const empColor = empScore >= 70 ? '#3dffa0' : empScore >= 50 ? '#8899bb' : '#ff6b6b';

  // Chronological order for the chart (up to last 12)
  const chartSessions = sessions.slice(0, 12).reverse();

  const cardStyle = {
    background: 'var(--surf)',
    border: '1px solid var(--bd2)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 32px var(--shadow)'
  };

  return (
    <div className="screen active" style={{
      overflowY: 'auto',
      background: 'var(--bg)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100vh',
      paddingBottom: '80px'
    }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: '800', color: 'var(--txt)', letterSpacing: '-1px' }}>Analytics</h1>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
              Showing <strong style={{ color: 'var(--txt)' }}>{totalCalls}</strong> meaningful call{totalCalls !== 1 ? 's' : ''} (≥ 1 minute)
              {allSessions.length > totalCalls && (
                <span style={{ color: 'var(--dim)' }}>
                  {' · '}{allSessions.length - totalCalls} short test call{allSessions.length - totalCalls !== 1 ? 's' : ''} hidden
                </span>
              )}
            </p>
          </div>
          <button onClick={onBack} style={{
            background: 'var(--surf)', border: '1px solid var(--bd2)',
            color: 'var(--txt)', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px'
          }}>← Back</button>
        </div>

        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Meaningful Sessions', val: totalCalls, icon: '📞' },
            { label: 'Avg Duration', val: totalCalls ? fmt(avgDur) : '—', icon: '⏱️' },
            {
              label: 'Overall Empathy Score', val: totalCalls ? `${empScore}%` : '—', icon: '✨',
              color: empColor,
              sub: empScore >= 70 ? 'Positive engagement' : empScore >= 50 ? 'Mostly neutral' : 'High friction detected'
            },
          ].map((m, i) => (
            <div key={i} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.label}</span>
                <span style={{ fontSize: '18px' }}>{m.icon}</span>
              </div>
              <div style={{ fontSize: '34px', fontWeight: '800', color: m.color || 'var(--txt)', letterSpacing: '-1px', lineHeight: 1 }}>{m.val}</div>
              {m.sub && <div style={{ marginTop: '8px', fontSize: '11px', color: m.color || 'var(--dim)', opacity: 0.8 }}>{m.sub}</div>}
            </div>
          ))}
        </div>

        {/* Empathy Trend Line Graph */}
        <div style={{ ...cardStyle, marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', color: 'var(--txt)', fontSize: '16px', fontWeight: '700' }}>Empathy Score Trend</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                % of positive emotions (happy + neutral) per session · hover a dot for details
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <div style={{ width: '24px', height: '2px', background: 'var(--green)', borderRadius: '1px' }} />
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Empathy %</span>
            </div>
          </div>

          <EmpathyLineGraph sessions={chartSessions} />

          {chartSessions.length >= 2 && (
            <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
              {[
                { color: '#3dffa0', label: '≥ 70% — Positive engagement' },
                { color: '#8899bb', label: '50–69% — Neutral / mixed' },
                { color: '#ff6b6b', label: '< 50% — High friction' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Session History */}
        <h3 style={{ margin: '0 0 16px', color: 'var(--txt)', fontSize: '16px', fontWeight: '700' }}>Session History</h3>
        {loading ? (
          <div style={{ color: 'var(--muted)', padding: '40px', textAlign: 'center' }}>Loading...</div>
        ) : sessions.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--muted)', padding: '48px 24px', fontSize: '14px', lineHeight: 1.7 }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📞</div>
            No meaningful sessions yet.<br />
            <span style={{ fontSize: '12px', color: 'var(--dim)' }}>Sessions shorter than 1 minute are excluded as test calls.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sessions.map((s, idx) => {
              const d = new Date(s.ts);
              const tot = (s.happy + s.neutral + s.sad + s.angry) || 1;
              const topEmoKey = Object.keys(EMO_COLORS).reduce((a, b) => s[a] > s[b] ? a : b);
              const posScore = Math.round(((s.happy + s.neutral) / tot) * 100);
              return (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
                  padding: '16px 20px', background: 'var(--surf2)', border: '1px solid var(--bd2)',
                  borderRadius: '14px', transition: 'background 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surf)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surf2)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'var(--surf)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '14px', fontWeight: '800',
                      color: 'var(--dim)', flexShrink: 0
                    }}>
                      {sessions.length - idx}
                    </div>
                    <div>
                      <div style={{ color: 'var(--txt)', fontWeight: '600', fontSize: '14px' }}>{s.ctx || 'ZW-CN'} Session</div>
                      <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '2px' }}>
                        {d.toLocaleDateString()} at {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--dim)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Duration</div>
                      <div style={{ color: 'var(--txt)', fontWeight: '600', fontSize: '13px' }}>{fmt(s.duration)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--dim)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Dominant</div>
                      <div style={{ color: EMO_COLORS[topEmoKey].color, fontWeight: '700', fontSize: '13px', textTransform: 'capitalize' }}>{topEmoKey}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--dim)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Empathy</div>
                      <div style={{ color: posScore >= 70 ? '#3dffa0' : posScore >= 50 ? '#8899bb' : '#ff6b6b', fontWeight: '700', fontSize: '13px' }}>{posScore}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
