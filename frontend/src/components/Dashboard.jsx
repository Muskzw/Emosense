import React, { useState, useEffect } from 'react';

const EMO_COLORS = {
  happy: '#3dffa0',
  neutral: '#8899bb',
  sad: '#5b9cf6',
  angry: '#ff6b6b'
};

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

  // Calculate global empathy score (percentage of happy/neutral vs sad/angry)
  let totalPos = 0, totalNeg = 0;
  sessions.forEach(s => {
    totalPos += (s.happy || 0) + (s.neutral || 0);
    totalNeg += (s.sad || 0) + (s.angry || 0);
  });
  const empScore = (totalPos + totalNeg) > 0 ? Math.round((totalPos / (totalPos + totalNeg)) * 100) : 0;

  // For the chart, take up to the last 10 sessions
  const chartSessions = [...sessions].reverse().slice(0, 10).reverse();

  return (
    <div className="screen active" style={{ 
      overflowY: 'auto', background: 'radial-gradient(circle at top right, #1a1a2e 0%, #0a0a0f 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh', paddingBottom: '80px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '36px', fontWeight: '800', color: 'white', letterSpacing: '-1px' }}>Analytics</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>Review your cross-cultural communication history.</p>
          </div>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'white', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer',
            backdropFilter: 'blur(10px)', transition: 'all 0.2s', fontWeight: 'bold'
          }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
            ← Back to Lobby
          </button>
        </div>

        {/* Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {[
            { label: 'Total Sessions', val: totalCalls, icon: '📞' },
            { label: 'Avg Duration', val: `${Math.floor(avgDur/60)}m ${avgDur%60}s`, icon: '⏱️' },
            { label: 'Global Empathy Score', val: `${empScore}%`, icon: '✨', color: empScore > 70 ? EMO_COLORS.happy : EMO_COLORS.neutral }
          ].map((m, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span>
                <span style={{ fontSize: '20px', opacity: 0.8 }}>{m.icon}</span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: m.color || 'white', letterSpacing: '-1px' }}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        {chartSessions.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '24px', padding: '32px', marginBottom: '40px'
          }}>
            <h3 style={{ margin: '0 0 24px', color: 'white', fontSize: '18px' }}>Recent Emotion Trends</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '200px' }}>
              {chartSessions.map((s, i) => {
                const tot = (s.happy + s.neutral + s.sad + s.angry) || 1;
                return (
                  <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '2px', position: 'relative', group: 'true' }}>
                    <div style={{ height: `${(s.happy/tot)*100}%`, background: EMO_COLORS.happy, borderRadius: '4px 4px 0 0', opacity: 0.9, transition: '0.3s' }} />
                    <div style={{ height: `${(s.neutral/tot)*100}%`, background: EMO_COLORS.neutral, opacity: 0.7, transition: '0.3s' }} />
                    <div style={{ height: `${(s.sad/tot)*100}%`, background: EMO_COLORS.sad, opacity: 0.9, transition: '0.3s' }} />
                    <div style={{ height: `${(s.angry/tot)*100}%`, background: EMO_COLORS.angry, borderRadius: '0 0 4px 4px', opacity: 0.9, transition: '0.3s' }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '24px' }}>
              {Object.entries(EMO_COLORS).map(([k, c]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} /> {k}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History List */}
        <div>
          <h3 style={{ margin: '0 0 20px', color: 'white', fontSize: '18px' }}>Session History</h3>
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.4)' }}>Loading secure data...</div>
          ) : sessions.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>No sessions recorded yet. Start a call to populate your dashboard!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sessions.map(s => {
                const d = new Date(s.ts);
                const tot = (s.happy + s.neutral + s.sad + s.angry) || 1;
                const topEmo = Object.keys(EMO_COLORS).reduce((a, b) => s[a] > s[b] ? a : b);
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px', transition: 'all 0.2s', cursor: 'default'
                  }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>{s.ctx} Session</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{d.toLocaleDateString()} at {d.toLocaleTimeString()}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}>DURATION</div>
                        <div style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>{Math.floor(s.duration/60)}m {s.duration%60}s</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}>DOMINANT</div>
                        <div style={{ color: EMO_COLORS[topEmo], fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>{topEmo}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
