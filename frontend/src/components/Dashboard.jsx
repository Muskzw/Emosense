import React, { useState, useEffect } from 'react';

export default function Dashboard({ onBack }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const totalCalls = sessions.length;
  const totalDur = sessions.reduce((acc, s) => acc + s.duration, 0);
  const avgDur = totalCalls ? Math.floor(totalDur / totalCalls) : 0;

  return (
    <div className="screen active" style={{ overflowY: 'auto' }}>
      <div className="rep" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
        <div className="rh">
          <div className="rh-t">Session Dashboard</div>
          <button className="btn-new" onClick={onBack}>Back to Lobby</button>
        </div>

        <div className="r-st">
          <div className="rsc"><div className="rsc-v">{totalCalls}</div><div className="rsc-l">TOTAL CALLS</div></div>
          <div className="rsc"><div className="rsc-v">{Math.floor(avgDur/60)}m {avgDur%60}s</div><div className="rsc-l">AVG DURATION</div></div>
        </div>

        <div className="rcard" style={{ marginTop: '20px' }}>
          <div className="rc-t">Call History</div>
          {loading ? <div style={{fontFamily: 'monospace', color: '#8899bb'}}>Loading history...</div> : sessions.length === 0 ? <div style={{fontFamily: 'monospace', color: '#8899bb'}}>No sessions recorded yet.</div> : (
            <div style={{overflowX: 'auto'}}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'monospace' }}>
                <thead>
                  <tr style={{ color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '10px' }}>Date</th>
                    <th style={{ padding: '10px' }}>Context</th>
                    <th style={{ padding: '10px' }}>Duration</th>
                    <th style={{ padding: '10px' }}>Happy</th>
                    <th style={{ padding: '10px' }}>Neutral</th>
                    <th style={{ padding: '10px' }}>Sad</th>
                    <th style={{ padding: '10px' }}>Angry</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => {
                    const d = new Date(s.ts);
                    const dt = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px' }}>{dt}</td>
                        <td style={{ padding: '10px' }}>{s.ctx}</td>
                        <td style={{ padding: '10px' }}>{Math.floor(s.duration/60)}m {s.duration%60}s</td>
                        <td style={{ padding: '10px', color: '#3dffa0' }}>{s.happy}</td>
                        <td style={{ padding: '10px', color: '#8899bb' }}>{s.neutral}</td>
                        <td style={{ padding: '10px', color: '#5b9cf6' }}>{s.sad}</td>
                        <td style={{ padding: '10px', color: '#ff6b6b' }}>{s.angry}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
