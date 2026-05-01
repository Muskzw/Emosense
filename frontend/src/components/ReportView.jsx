import React, { useEffect, useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';

export default function ReportView({ onBack, emoCounts, duration, sessionInfo }) {
  const saved = useRef(false);
  const [strategy, setStrategy] = useState('');

  useEffect(() => {
    // Generate AI Strategy
    const total = (emoCounts.happy + emoCounts.neutral + emoCounts.sad + emoCounts.angry) || 1;
    const hP = emoCounts.happy / total;
    const nP = emoCounts.neutral / total;
    const aP = emoCounts.angry / total;
    const ctx = sessionInfo?.ctx || 'INT';
    let strat = "";
    
    if (ctx === "ZW-CN") {
      if(nP > 0.6) strat="High neutrality detected. In Chinese business context, this often indicates polite listening rather than agreement. <strong>Strategy:</strong> Pause and ask open-ended questions to elicit true feedback.";
      else if(hP > 0.4) strat="Strong positive resonance. <strong>Strategy:</strong> Capitalize on this momentum to propose next steps or finalize terms.";
      else if(aP > 0.15) strat="Friction detected. <strong>Strategy:</strong> Shift tone to be more accommodating and address potential unspoken concerns immediately.";
      else strat="Balanced engagement. <strong>Strategy:</strong> Continue building rapport before pushing complex deliverables.";
    } else {
      if(hP > 0.5) strat="Excellent rapport established. <strong>Strategy:</strong> Good time to discuss forward-looking opportunities.";
      else if(nP > 0.5) strat="Engagement is reserved. <strong>Strategy:</strong> Inject more interactive elements to gauge true interest.";
      else strat="Standard engagement. Maintain clear, structured communication.";
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

  return (
    <div className="screen active" id="sReport" style={{ overflowY: 'auto' }}>
      <div className="rep" style={{ margin: '0 auto', paddingBottom: '80px', paddingTop: '40px' }}>
        <div className="rh">
          <div>
            <div className="rh-t">Session report</div>
            <div className="rh-m">{new Date().toLocaleString()}</div>
          </div>
          <div style={{display:'flex', gap:'8px'}}>
            <button className="btn-new" onClick={handleDownloadPDF} style={{background: 'var(--blue)', color: 'white', borderColor: 'var(--blue)'}}>Download PDF</button>
            <button className="btn-new" onClick={onBack}>+ New session</button>
          </div>
        </div>
        
        <div id="report-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
          <div className="r-st">
            <div className="rsc"><div className="rsc-v">{Math.floor(duration/60)}m {duration%60}s</div><div className="rsc-l">DURATION</div></div>
            <div className="rsc"><div className="rsc-v">{total}</div><div className="rsc-l">DATA POINTS</div></div>
            <div className="rsc"><div className="rsc-v" style={{color: 'var(--green)'}}>{getPct(emoCounts.happy)}%</div><div className="rsc-l">POSITIVE</div></div>
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

          <div className="ins-r">
            <div className="ir-hd"><div className="ir-dot" style={{background:'var(--blue)'}}></div><span className="ir-t">AI Follow-up Strategy</span></div>
            <div className="ir-items">
              <div className="ir-item">
                <div className="ir-txt" dangerouslySetInnerHTML={{__html: strategy}}></div>
              </div>
            </div>
          </div>

          <div className="ds-card" style={{background: 'rgba(255,183,71,.06)', border: '.5px solid rgba(255,183,71,.2)', borderRadius: '14px', padding: '16px'}}>
            <div className="ds-title" style={{fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--amber)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '10px'}}>Dataset transparency & bias warning</div>
            <div className="ds-rows" style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <div className="ds-row" style={{display: 'flex', gap: '10px', alignItems: 'flex-start'}}><div className="ds-badge dsb-bias" style={{fontSize: '9px', fontFamily: 'var(--mono)', padding: '3px 8px', borderRadius: '6px', border: '.5px solid', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '1px', borderColor: 'rgba(255,107,107,.3)', background: 'rgba(255,107,107,.08)', color: 'var(--red)'}}>FER-2013</div><div className="ds-txt" style={{fontSize: '11px', lineHeight: 1.6, color: 'rgba(255,255,255,.5)'}}><strong style={{color: 'rgba(255,255,255,.78)', fontWeight: 500}}>Severe bias risk:</strong> 67% Caucasian faces. Accuracy drops to ~50% for Sub-Saharan African & East Asian users. (Rejected)</div></div>
              <div className="ds-row" style={{display: 'flex', gap: '10px', alignItems: 'flex-start'}}><div className="ds-badge dsb-ok" style={{fontSize: '9px', fontFamily: 'var(--mono)', padding: '3px 8px', borderRadius: '6px', border: '.5px solid', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '1px', borderColor: 'rgba(61,255,160,.3)', background: 'rgba(61,255,160,.08)', color: 'var(--green)'}}>CAFPS</div><div className="ds-txt" style={{fontSize: '11px', lineHeight: 1.6, color: 'rgba(255,255,255,.5)'}}><strong style={{color: 'rgba(255,255,255,.78)', fontWeight: 500}}>Approved:</strong> Baseline dataset for Chinese expression norms.</div></div>
              <div className="ds-row" style={{display: 'flex', gap: '10px', alignItems: 'flex-start'}}><div className="ds-badge dsb-zw" style={{fontSize: '9px', fontFamily: 'var(--mono)', padding: '3px 8px', borderRadius: '6px', border: '.5px solid', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '1px', borderColor: 'rgba(91,156,246,.3)', background: 'rgba(91,156,246,.08)', color: 'var(--blue)'}}>EmoSense ZW</div><div className="ds-txt" style={{fontSize: '11px', lineHeight: 1.6, color: 'rgba(255,255,255,.5)'}}><strong style={{color: 'rgba(255,255,255,.78)', fontWeight: 500}}>Primary dataset:</strong> Built exclusively on Zimbabwean (Shona/Ndebele) + Chinese-in-Zimbabwe participant expressions.</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
