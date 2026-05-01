import React, { useEffect, useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';

const EMO_COLORS = {
  happy:   { stroke: '#34c759', label: 'Happy',   fill: 'rgba(52,199,89,0.12)' },
  neutral: { stroke: '#8899bb', label: 'Neutral',  fill: 'rgba(136,153,187,0.1)' },
  sad:     { stroke: '#5b9cf6', label: 'Sad',      fill: 'rgba(91,156,246,0.12)' },
  angry:   { stroke: '#ff3b30', label: 'Angry',    fill: 'rgba(255,59,48,0.12)' },
};

// Build 4 SVG polyline paths from raw timeline data
function buildChartPaths(timeline, W, H, pad) {
  if (!timeline || timeline.length < 2) return {};
  const maxT = Math.max(...timeline.map(d => d.t), 1);
  const EMO_KEYS = ['happy', 'neutral', 'sad', 'angry'];

  // For each second bucket, count occurrences per emotion
  const bucketSize = Math.max(1, Math.floor(maxT / 40)); // max 40 data points
  const buckets = {};
  timeline.forEach(({ t, emo }) => {
    const b = Math.floor(t / bucketSize);
    if (!buckets[b]) buckets[b] = { happy: 0, neutral: 0, sad: 0, angry: 0 };
    buckets[b][emo] = (buckets[b][emo] || 0) + 1;
  });

  const bKeys = Object.keys(buckets).map(Number).sort((a, b) => a - b);
  const maxBucketT = bKeys[bKeys.length - 1] || 1;

  const paths = {};
  EMO_KEYS.forEach(emo => {
    const pts = bKeys.map(b => {
      const total = EMO_KEYS.reduce((s, e) => s + (buckets[b][e] || 0), 0) || 1;
      const pct = (buckets[b][emo] || 0) / total;
      const x = pad + (b / maxBucketT) * (W - pad * 2);
      const y = pad + (1 - pct) * (H - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    paths[emo] = pts.join(' ');
  });
  return { paths, maxT, bKeys, buckets, bucketSize };
}

function TimelineChart({ timeline }) {
  const W = 600, H = 180, pad = 24;
  const [animated, setAnimated] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!timeline || timeline.length < 3) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: '12px' }}>
        Not enough data to render timeline.<br/>
        <span style={{ fontSize: '10px' }}>Calls need at least 6 seconds of detection.</span>
      </div>
    );
  }

  const { paths, maxT } = buildChartPaths(timeline, W, H, pad);
  const EMO_KEYS = ['happy', 'neutral', 'sad', 'angry'];

  // Tick marks for X axis
  const ticks = [];
  const tickCount = Math.min(6, Math.floor(maxT / 5) + 1);
  for (let i = 0; i <= tickCount; i++) {
    const t = Math.round((i / tickCount) * maxT);
    const x = pad + (i / tickCount) * (W - pad * 2);
    const mins = Math.floor(t / 60);
    const secs = t % 60;
    ticks.push({ x, label: mins > 0 ? `${mins}m${secs > 0 ? secs + 's' : ''}` : `${t}s` });
  }

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => {
          const y = pad + (1 - v) * (H - pad * 2);
          return (
            <line key={v} x1={pad} y1={y} x2={W - pad} y2={y}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
          );
        })}

        {/* Y axis labels */}
        {[0, 50, 100].map(v => (
          <text key={v} x={pad - 6} y={pad + (1 - v / 100) * (H - pad * 2) + 4}
            textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace">
            {v}%
          </text>
        ))}

        {/* X axis ticks */}
        {ticks.map(({ x, label }) => (
          <text key={label} x={x} y={H - 4}
            textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace">
            {label}
          </text>
        ))}

        {/* Emotion lines */}
        {EMO_KEYS.map(emo => {
          if (!paths[emo]) return null;
          const { stroke } = EMO_COLORS[emo];
          return (
            <polyline
              key={emo}
              points={paths[emo]}
              fill="none"
              stroke={stroke}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={animated ? 0.85 : 0}
              style={{ transition: `opacity 0.8s ease ${EMO_KEYS.indexOf(emo) * 0.15}s` }}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginTop: '12px' }}>
        {EMO_KEYS.map(emo => (
          <div key={emo} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '20px', height: '2.5px', borderRadius: '2px', background: EMO_COLORS[emo].stroke }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
              {EMO_COLORS[emo].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportView({ onBack, emoCounts, duration, sessionInfo, timeline }) {
  const saved = useRef(false);
  const [strategy, setStrategy] = useState('');

  useEffect(() => {
    const total = (emoCounts.happy + emoCounts.neutral + emoCounts.sad + emoCounts.angry) || 1;
    const hP = emoCounts.happy / total;
    const nP = emoCounts.neutral / total;
    const aP = emoCounts.angry / total;
    const ctx = sessionInfo?.ctx || 'INT';
    let strat = '';

    if (ctx === 'ZW-CN') {
      if (nP > 0.6) strat = 'High neutrality detected. In Chinese business context, this often indicates polite listening rather than agreement. <strong>Strategy:</strong> Pause and ask open-ended questions to elicit true feedback.';
      else if (hP > 0.4) strat = 'Strong positive resonance. <strong>Strategy:</strong> Capitalise on this momentum to propose next steps or finalise terms.';
      else if (aP > 0.15) strat = 'Friction detected. <strong>Strategy:</strong> Shift tone to be more accommodating and address potential unspoken concerns immediately.';
      else strat = 'Balanced engagement. <strong>Strategy:</strong> Continue building rapport before pushing complex deliverables.';
    } else {
      if (hP > 0.5) strat = 'Excellent rapport established. <strong>Strategy:</strong> Good time to discuss forward-looking opportunities.';
      else if (nP > 0.5) strat = 'Engagement is reserved. <strong>Strategy:</strong> Inject more interactive elements to gauge true interest.';
      else strat = 'Standard engagement. Maintain clear, structured communication.';
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
