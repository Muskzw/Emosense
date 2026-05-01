import React, { useEffect, useRef } from 'react';

export default function ReportView({ onBack, emoCounts, duration, sessionInfo }) {
  const saved = useRef(false);

  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    
    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration, emoCounts, ctx: sessionInfo?.ctx || 'INT' })
    }).catch(e => console.error(e));
  }, [duration, emoCounts, sessionInfo]);

  const total = (emoCounts.happy + emoCounts.neutral + emoCounts.sad + emoCounts.angry) || 1;
  const getPct = (n) => ((n / total) * 100).toFixed(0);

  return (
    <div className="screen active" id="sReport">
      <div className="rep">
        <div className="rh">
          <div className="rh-t">Session Report</div>
          <button className="btn-new" onClick={onBack}>New Call</button>
        </div>
        <div className="r-st">
          <div className="rsc"><div className="rsc-v">{Math.floor(duration/60)}m {duration%60}s</div><div className="rsc-l">DURATION</div></div>
          <div className="rsc"><div className="rsc-v">{total}</div><div className="rsc-l">DATA POINTS</div></div>
        </div>
        <div className="rcard">
          <div className="rc-t">Emotion Breakdown</div>
          <div className="echart">
            <div className="ecr"><div className="ecl">Neutral</div><div className="ect"><div className="ecf ecn" style={{width: `${getPct(emoCounts.neutral)}%`}}>{getPct(emoCounts.neutral)}%</div></div></div>
            <div className="ecr"><div className="ecl">Happy</div><div className="ect"><div className="ecf ech" style={{width: `${getPct(emoCounts.happy)}%`}}>{getPct(emoCounts.happy)}%</div></div></div>
            <div className="ecr"><div className="ecl">Sad</div><div className="ect"><div className="ecf ecs" style={{width: `${getPct(emoCounts.sad)}%`}}>{getPct(emoCounts.sad)}%</div></div></div>
            <div className="ecr"><div className="ecl">Angry</div><div className="ect"><div className="ecf eca" style={{width: `${getPct(emoCounts.angry)}%`}}>{getPct(emoCounts.angry)}%</div></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
