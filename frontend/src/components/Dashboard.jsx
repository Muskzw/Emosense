import React, { useState, useEffect } from 'react';
import { useLang, LangSwitcher } from '../context/LangContext';

const EMO_COLORS = {
  happy:   { color: '#3dffa0', label: 'Happy'   },
  neutral: { color: '#8899bb', label: 'Neutral'  },
  sad:     { color: '#5b9cf6', label: 'Sad'      },
  angry:   { color: '#ff6b6b', label: 'Angry'    },
};

const MIN_DURATION = 60; // sessions < 1 min are test calls

function fmt(secs, lang) {
  const m = Math.floor(secs / 60), s = secs % 60;
  if (lang === 'zh') return `${m}分 ${s}秒`;
  return `${m}m ${s}s`;
}

const LOCAL_T = {
  en: {
    showing: 'Showing',
    greaterThanMin: '(≥ 1 minute)',
    empathyPercent: 'Empathy %',
    empathyTrendTitle: 'Empathy Score Trend',
    empathyTrendDesc: '% of positive emotions (happy + neutral) per session · hover a dot for details',
    empathyPercentLabel: 'Empathy %',
    legendPositive: '≥ 70% — Positive engagement',
    legendNeutral: '50–69% — Neutral / mixed',
    legendFriction: '< 50% — High friction',
    sessionHistory: 'Session History',
    loading: 'Loading...',
    noSessionsTitle: 'No meaningful sessions yet.',
    noSessionsSub: 'Sessions shorter than 1 minute are excluded as test calls.',
    sessionRow: 'Session',
    atSeparator: ' at ',
    dominantLabel: 'DOMINANT',
    empathyLabel: 'EMPATHY',
  },
  sn: {
    showing: 'Kuratidza',
    greaterThanMin: '(≥ miniti 1)',
    empathyPercent: 'Kanzwisiso %',
    empathyTrendTitle: 'Maitiro eChiyero Chekanzwisiso',
    empathyTrendDesc: '% yezvakakanaka manzwiro (kufara + pakati) pamusangano wega wega · baya pabhodhi kuti uone zvakawanda',
    empathyPercentLabel: 'Kanzwisiso %',
    legendPositive: '≥ 70% — Kukurukurirana Kwakanaka',
    legendNeutral: '50–69% — Kazhinji Zviri Pakati',
    legendFriction: '< 50% — Kupokana Kukuru Kwaratidzwa',
    sessionHistory: 'Nhoroondo yeMisangano',
    loading: 'Kurodha...',
    noSessionsTitle: 'Hapana misangano inokosha yakaitwa.',
    noSessionsSub: 'Misangano isingasviki miniti imwe chete inosarudzwa semusangano wekuedza.',
    sessionRow: 'Musangano',
    atSeparator: ' na ',
    dominantLabel: 'KUTUNGAMIRA',
    empathyLabel: 'KANZWISISO',
  },
  zh: {
    showing: '显示',
    greaterThanMin: '(≥ 1分钟)',
    empathyPercent: '共情度 %',
    empathyTrendTitle: '共情温度趋势',
    empathyTrendDesc: '每次会话中积极情绪（快乐 + 中立）的百分比 · 悬停圆点以查看详情',
    empathyPercentLabel: '共情度 %',
    legendPositive: '≥ 70% — 良性共情互动',
    legendNeutral: '50–69% — 表现基本中立',
    legendFriction: '< 50% — 检测到潜在的高沟通摩擦力',
    sessionHistory: '历史通话记录',
    loading: '加载中...',
    noSessionsTitle: '暂无有效通话记录。',
    noSessionsSub: '时长少于1分钟的通话将被作为测试呼叫排除。',
    sessionRow: '会话',
    atSeparator: ' ',
    dominantLabel: '主导情绪',
    empathyLabel: '共情度',
  }
};

function EmpathyLineGraph({ sessions }) {
  const [hovered, setHovered] = useState(null);
  const { t, lang } = useLang();

  if (sessions.length < 2) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--dim)', fontSize: '13px' }}>
      {t('completeTwoCalls')}
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
              {t('empathyTrend')} {hovered + 1}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--dim)', marginTop: '1px' }}>
              {new Date(sessions[hovered].ts).toLocaleDateString(lang)}
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
  const { t, lang } = useLang();
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
  const isZh = lang === 'zh';

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
            <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: '800', color: 'var(--txt)', letterSpacing: '-1px' }}>{t('analytics')}</h1>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
              {LOCAL_T[lang].showing}{isZh ? '' : ' '}
              <strong style={{ color: 'var(--txt)' }}>{totalCalls}</strong>{isZh ? '' : ' '}
              {totalCalls === 1 ? t('meaningfulCall') : t('meaningfulCalls')}{isZh ? '' : ' '}
              {LOCAL_T[lang].greaterThanMin}
              {allSessions.length > totalCalls && (
                <span style={{ color: 'var(--dim)' }}>
                  {' · '}{allSessions.length - totalCalls}{isZh ? '' : ' '}
                  {(allSessions.length - totalCalls) === 1 ? t('shortTestCall') : t('shortTestCalls')}{isZh ? '' : ' '}
                  {t('hidden')}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <LangSwitcher />
            <button onClick={onBack} style={{
              background: 'var(--surf)', border: '1px solid var(--bd2)',
              color: 'var(--txt)', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px'
            }}>{t('backToLobby')}</button>
          </div>
        </div>

        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: t('meaningfulSessions'), val: totalCalls, icon: '📞' },
            { label: t('avgDuration'), val: totalCalls ? fmt(avgDur, lang) : '—', icon: '⏱️' },
            {
              label: t('overallEmpathyScore'), val: totalCalls ? `${empScore}%` : '—', icon: '✨',
              color: empColor,
              sub: empScore >= 70 ? t('positiveEngagement') : empScore >= 50 ? t('mostlyNeutral') : t('highFriction')
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
              <h3 style={{ margin: '0 0 4px', color: 'var(--txt)', fontSize: '16px', fontWeight: '700' }}>{LOCAL_T[lang].empathyTrendTitle}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                {LOCAL_T[lang].empathyTrendDesc}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <div style={{ width: '24px', height: '2px', background: 'var(--green)', borderRadius: '1px' }} />
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{LOCAL_T[lang].empathyPercentLabel}</span>
            </div>
          </div>

          <EmpathyLineGraph sessions={chartSessions} />

          {chartSessions.length >= 2 && (
            <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
              {[
                { color: '#3dffa0', label: LOCAL_T[lang].legendPositive },
                { color: '#8899bb', label: LOCAL_T[lang].legendNeutral },
                { color: '#ff6b6b', label: LOCAL_T[lang].legendFriction },
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
        <h3 style={{ margin: '0 0 16px', color: 'var(--txt)', fontSize: '16px', fontWeight: '700' }}>{LOCAL_T[lang].sessionHistory}</h3>
        {loading ? (
          <div style={{ color: 'var(--muted)', padding: '40px', textAlign: 'center' }}>{LOCAL_T[lang].loading}</div>
        ) : sessions.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--muted)', padding: '48px 24px', fontSize: '14px', lineHeight: 1.7 }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📞</div>
            {LOCAL_T[lang].noSessionsTitle}<br />
            <span style={{ fontSize: '12px', color: 'var(--dim)' }}>{LOCAL_T[lang].noSessionsSub}</span>
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
                      <div style={{ color: 'var(--txt)', fontWeight: '600', fontSize: '14px' }}>{s.ctx || 'ZW-CN'} {LOCAL_T[lang].sessionRow}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '2px' }}>
                        {d.toLocaleDateString(lang)} {LOCAL_T[lang].atSeparator} {d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--dim)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{t('durationLabel')}</div>
                      <div style={{ color: 'var(--txt)', fontWeight: '600', fontSize: '13px' }}>{fmt(s.duration, lang)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--dim)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{LOCAL_T[lang].dominantLabel}</div>
                      <div style={{ color: EMO_COLORS[topEmoKey].color, fontWeight: '700', fontSize: '13px' }}>{t(topEmoKey)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--dim)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{LOCAL_T[lang].empathyLabel}</div>
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
