import React, { useEffect, useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';

const EMO_COLORS = {
  happy:   { stroke: '#34c759', label: 'Happy',   fill: 'rgba(52,199,89,0.12)' },
  neutral: { stroke: '#8899bb', label: 'Neutral',  fill: 'rgba(136,153,187,0.1)' },
  sad:     { stroke: '#5b9cf6', label: 'Sad',      fill: 'rgba(91,156,246,0.12)' },
  angry:   { stroke: '#ff3b30', label: 'Angry',    fill: 'rgba(255,59,48,0.12)' },
};

// Build a single valence path based on sequential Turns
function buildValencePath(timeline, W, H, pad) {
  if (!timeline || timeline.length < 2) return { pathStr: '', pts: [], maxT: 1 };
  
  // We treat each data point in the timeline as a "Turn"
  const maxIdx = Math.max(timeline.length - 1, 1);

  const pts = timeline.map((d, i) => {
    let val = 50; // Neutral baseline
    if (d.emo === 'happy') val = 100;
    if (d.emo === 'sad' || d.emo === 'angry') val = 0;

    const x = pad + 20 + (i / maxIdx) * (W - pad * 2 - 20); // shift right for text
    const y = pad + (1 - val / 100) * (H - pad * 2);
    return { x, y, score: val };
  });

  const pathStr = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  
  // Fill path drops down to the baseline (y = H - pad)
  const fillStr = pts.length > 0 
    ? `${pts[0].x.toFixed(1)},${H - pad} ` + pathStr + ` ${pts[pts.length-1].x.toFixed(1)},${H - pad}`
    : '';

  return { pathStr, fillStr, pts, maxTurns: timeline.length };
}

function TimelineChart({ timeline }) {
  const W = 600, H = 200, pad = 24;
  const [animated, setAnimated] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!timeline || timeline.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: '12px' }}>
        Not enough data to render turn graph.<br/>
        <span style={{ fontSize: '10px' }}>Requires at least 2 interaction turns.</span>
      </div>
    );
  }

  const { pathStr, fillStr, maxTurns } = buildValencePath(timeline, W, H, pad);

  // Tick marks for X axis (Turns)
  const ticks = [];
  const tickCount = Math.min(6, maxTurns);
  for (let i = 0; i <= tickCount; i++) {
    const turnNum = Math.max(1, Math.round((i / tickCount) * maxTurns));
    const x = pad + 20 + (i / tickCount) * (W - pad * 2 - 20);
    // Don't duplicate ticks if there are very few turns
    if (!ticks.find(t => t.label === `Turn ${turnNum}`)) {
      ticks.push({ x, label: `Turn ${turnNum}` });
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="valLineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34c759" />
            <stop offset="50%" stopColor="#8899bb" />
            <stop offset="100%" stopColor="#ff3b30" />
          </linearGradient>
          <linearGradient id="valFillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34c759" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#8899bb" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ff3b30" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal zones / Grid lines */}
        {[
          { v: 100, label: 'Happy', color: '#34c759' },
          { v: 50,  label: 'Neutral', color: '#8899bb' },
          { v: 0,   label: 'Sad/Angry', color: '#ff3b30' }
        ].map(({ v, label, color }) => {
          const y = pad + (1 - v / 100) * (H - pad * 2);
          return (
            <g key={label}>
              <line x1={pad + 20} y1={y} x2={W - pad} y2={y}
                stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={pad + 10} y={y + 3}
                textAnchor="end" fill={color} fontSize="10" fontFamily="system-ui" fontWeight="600" opacity="0.8">
                {label}
              </text>
            </g>
          );
        })}

        {/* X axis ticks */}
        {ticks.map(({ x, label }) => (
          <text key={label} x={x} y={H - 2}
            textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace">
            {label}
          </text>
        ))}

        {/* Filled Area */}
        {fillStr && (
          <polygon
            points={fillStr}
            fill="url(#valFillGrad)"
            opacity={animated ? 1 : 0}
            style={{ transition: 'opacity 1s ease' }}
          />
        )}

        {/* Emotion Line */}
        {pathStr && (
          <polyline
            points={pathStr}
            fill="none"
            stroke="url(#valLineGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ 
              transition: 'stroke-dashoffset 1.5s ease-in-out',
              strokeDasharray: 2000,
              strokeDashoffset: animated ? 0 : 2000
            }}
          />
        )}
      </svg>
    </div>
  );
}

export default function ReportView({ onBack, emoCounts, duration, sessionInfo, timeline, voiceTriggers }) {
  const saved = useRef(false);
  const [strategy, setStrategy] = useState('');

  useEffect(() => {
    const total = (emoCounts.happy + emoCounts.neutral + emoCounts.sad + emoCounts.angry) || 1;
    const hP = emoCounts.happy / total;
    const nP = emoCounts.neutral / total;
    const aP = emoCounts.angry / total;
    const sP = emoCounts.sad / total;
    const ctx = sessionInfo?.ctx || 'INT';
    let strat = '';

    if (ctx === 'ZW-CN') {
      strat = `<strong>Cultural Context: Zimbabwe ↔ China (Mianzi/Face Focus)</strong><br/>`;
      if (nP > 0.6) {
        strat += `Detected high neutrality (60%+). In Chinese professional norms, this often indicates "Face-saving" or polite reservation. The participant may have unspoken concerns. <br/><strong>Advice:</strong> Do not press for immediate commitment. Use "soft" follow-ups like: <em>"We would value your internal perspective on this."</em>`;
      } else if (hP > 0.4) {
        strat += `Strong positive resonance detected. This indicates high relational harmony (Guanxi). <br/><strong>Advice:</strong> Excellent time to solidify the partnership. Acknowledge their contribution to the "mutual benefit" (win-win) of the session.`;
      } else if (aP > 0.1 || sP > 0.1) {
        strat += `Friction or hesitation detected. In this cross-cultural link, direct confrontation is often avoided. <br/><strong>Advice:</strong> Slow down. Shift the focus to shared goals and use a more humble, accommodating tone to restore "Face."`;
      } else {
        strat += `Balanced interaction. <br/><strong>Advice:</strong> Maintain formal respect and structured delivery. Avoid overly casual language which might be misinterpreted as a lack of seriousness.`;
      }
    } else if (ctx === 'ZW-ZW') {
      strat = `<strong>Cultural Context: Zimbabwe ↔ Zimbabwe (Ubuntu/Respect Focus)</strong><br/>`;
      if (hP > 0.4) {
        strat += `Strong social harmony detected. Reflects "Ubuntu" (humanity towards others). <br/><strong>Advice:</strong> Maintain the warm rapport. Personal connection is as important as the business at hand.`;
      } else if (nP > 0.6) {
        strat += `Reserved engagement. Might indicate a "Wait and See" approach or respect-based listening. <br/><strong>Advice:</strong> Use inclusive language. Check in with: <em>"What is our collective thought on this direction?"</em> to encourage participation.`;
      } else if (aP > 0.15) {
        strat += `High emotional intensity detected. <br/><strong>Advice:</strong> De-escalate by acknowledging the person's status and the validity of their passion. Focus on community-led solutions.`;
      } else {
        strat += `Standard communal engagement. <br/><strong>Advice:</strong> Continue with a focus on shared values and clear, respectful communication.`;
      }
    } else {
      strat = `<strong>International Context</strong><br/>`;
      if (hP > 0.5) strat += 'Excellent rapport established. <strong>Strategy:</strong> Good time to discuss forward-looking opportunities.';
      else if (nP > 0.5) strat += 'Engagement is reserved. <strong>Strategy:</strong> Inject more interactive elements to gauge true interest.';
      else strat += 'Standard engagement. Maintain clear, structured communication.';
    }
    setStrategy(strat);

    if (saved.current) return;
    saved.current = true;
    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration, emoCounts, ctx })
    }).catch(e => console.error(e));
  }, [duration, emoCounts, sessionInfo]);

  const handleDownloadPDF = () => {
    const el = document.getElementById('report-content');
    if (!el) return;
    html2pdf().from(el).set({
      margin: 15,
      filename: `EmoSense_Report_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#07070f' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).save();
  };

  const total = (emoCounts.happy + emoCounts.neutral + emoCounts.sad + emoCounts.angry) || 1;
  const getPct = (n) => ((n / total) * 100).toFixed(0);

  const cardStyle = {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '20px',
  };

  return (
    <div className="screen active" id="sReport" style={{
      overflowY: 'auto',
      background: 'radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0f 100%)',
      fontFamily: 'system-ui, -apple-system, "SF Pro Display", sans-serif',
    }}>
      <div className="rep" style={{ margin: '0 auto', paddingBottom: '80px', paddingTop: '40px' }}>
        <div className="rh" style={{ marginBottom: '24px' }}>
          <div>
            <div className="rh-t" style={{ color: 'white' }}>Session Report</div>
            <div className="rh-m">{new Date().toLocaleString()}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-new" onClick={handleDownloadPDF}
              style={{ background: 'rgba(91,156,246,0.2)', color: '#5b9cf6', borderColor: 'rgba(91,156,246,0.4)' }}>
              ↓ PDF
            </button>
            <button className="btn-new" onClick={onBack}>+ New call</button>
          </div>
        </div>

        <div id="report-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Stats row */}
          <div className="r-st">
            <div style={cardStyle}>
              <div className="rsc-v" style={{ color: 'white' }}>{Math.floor(duration / 60)}m {duration % 60}s</div>
              <div className="rsc-l">DURATION</div>
            </div>
            <div style={cardStyle}>
              <div className="rsc-v" style={{ color: 'white' }}>{total}</div>
              <div className="rsc-l">DATA POINTS</div>
            </div>
            <div style={cardStyle}>
              <div className="rsc-v" style={{ color: '#34c759' }}>{getPct(emoCounts.happy)}%</div>
              <div className="rsc-l">POSITIVE</div>
            </div>
          </div>

          {/* Timeline Chart */}
          <div style={cardStyle}>
            <div className="rc-t" style={{ marginBottom: '16px' }}>Emotion Timeline</div>
            <TimelineChart timeline={timeline} />
          </div>

          {/* Emotion Breakdown */}
          <div style={cardStyle}>
            <div className="rc-t">Emotion Breakdown</div>
            <div className="echart">
              {[
                { key: 'happy', label: 'Happy', color: '#34c759', bgColor: 'rgba(52,199,89,0.15)' },
                { key: 'neutral', label: 'Neutral', color: '#8899bb', bgColor: 'rgba(136,153,187,0.12)' },
                { key: 'sad', label: 'Sad', color: '#5b9cf6', bgColor: 'rgba(91,156,246,0.15)' },
                { key: 'angry', label: 'Angry', color: '#ff3b30', bgColor: 'rgba(255,59,48,0.15)' },
              ].map(({ key, label, color, bgColor }) => (
                <div key={key} className="ecr">
                  <div className="ecl" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</div>
                  <div className="ect" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px' }}>
                    <div style={{
                      height: '100%', borderRadius: '999px',
                      background: bgColor, color,
                      width: `${getPct(emoCounts[key])}%`,
                      transition: 'width 1s cubic-bezier(.23,1,.32,1)',
                      display: 'flex', alignItems: 'center', padding: '0 8px',
                      fontSize: '10px', fontFamily: 'monospace', fontWeight: '700',
                      boxShadow: `0 0 8px ${color}55`,
                    }}>
                      {getPct(emoCounts[key])}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Voice Analytics */}
          {voiceTriggers && voiceTriggers.length > 0 && (
            <div style={{ ...cardStyle, border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.02)' }}>
              <div className="rc-t" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                AI Voice Analytics
                <span style={{ fontSize: '9px', fontWeight: '800', background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#1a1a2e', padding: '2px 6px', borderRadius: '4px' }}>PRO</span>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {voiceTriggers.map((trig, i) => {
                   const { stroke } = EMO_COLORS[trig.emotion] || EMO_COLORS.neutral;
                   let advice = "Maintain standard communication.";
                   if (trig.emotion === 'angry') advice = "Try to remain neutral and de-escalate when they bring this up.";
                   if (trig.emotion === 'sad') advice = "Show empathy and pause to listen deeply.";
                   if (trig.emotion === 'happy') advice = "Great alignment! Reinforce this topic in future meetings.";
                   
                   return (
                     <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: `3px solid ${stroke}` }}>
                       <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                         When they said: <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>"{trig.text}"</span>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                         <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>They showed:</span>
                         <span style={{ fontSize: '11px', fontWeight: '700', color: stroke, textTransform: 'uppercase' }}>{trig.emotion}</span>
                       </div>
                       <div style={{ fontSize: '11px', color: 'rgba(255,215,0,0.8)', marginTop: '8px', background: 'rgba(255,215,0,0.05)', padding: '6px 8px', borderRadius: '6px' }}>
                         <strong>Advice:</strong> {advice}
                       </div>
                     </div>
                   );
                })}
              </div>
            </div>
          )}

          {/* AI Strategy */}
          <div style={{ ...cardStyle, border: '1px solid rgba(52,199,89,0.2)', background: 'rgba(52,199,89,0.04)' }}>
            <div className="ir-hd">
              <div className="ir-dot" style={{ background: '#34c759', boxShadow: '0 0 6px #34c759' }} />
              <span className="ir-t" style={{ color: '#34c759' }}>AI Follow-up Strategy</span>
            </div>
            <div className="ir-item" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', marginTop: '8px' }}>
              <div className="ir-txt" style={{ fontSize: '13px', lineHeight: '1.65', color: 'rgba(255,255,255,0.7)' }}
                dangerouslySetInnerHTML={{ __html: strategy }} />
            </div>
          </div>

          {/* Dataset Transparency */}
          <div style={{ ...cardStyle, border: '1px solid rgba(255,183,71,0.2)', background: 'rgba(255,183,71,0.04)' }}>
            <div className="ds-title" style={{ color: '#ffb347' }}>Dataset Transparency &amp; Bias Warning</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { tag: 'FER-2013', tagColor: '#ff3b30', text: '<strong>Severe bias risk:</strong> 67% Caucasian faces. ~50% accuracy on Sub-Saharan African &amp; East Asian users. Rejected.' },
                { tag: 'CAFPS', tagColor: '#34c759', text: '<strong>Approved:</strong> Baseline dataset for Chinese expression norms (220 Chinese subjects).' },
                { tag: 'EmoSense ZW', tagColor: '#5b9cf6', text: '<strong>Primary:</strong> Purpose-built for Zimbabwean (Shona/Ndebele) + Chinese-in-Zimbabwe participants. 87.3% accuracy.' },
              ].map(({ tag, tagColor, text }) => (
                <div key={tag} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: '9px', fontFamily: 'monospace', padding: '3px 8px', borderRadius: '6px',
                    border: `1px solid ${tagColor}55`, background: `${tagColor}18`, color: tagColor,
                    whiteSpace: 'nowrap', flexShrink: 0, marginTop: '1px'
                  }}>{tag}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: text }} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
