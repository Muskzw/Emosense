import React, { useEffect, useRef, useState, useMemo } from 'react';
import html2pdf from 'html2pdf.js';
import { supabase } from '../supabase';
import { useLang, LangSwitcher } from '../context/LangContext';

const EMO_COLORS = {
  happy:   { stroke: 'var(--green)', label: 'Happy',   fill: 'var(--gd)' },
  neutral: { stroke: 'var(--slate)', label: 'Neutral',  fill: 'var(--surf2)' },
  sad:     { stroke: 'var(--blue)', label: 'Sad',      fill: 'rgba(0,122,255,0.12)' },
  angry:   { stroke: 'var(--red)', label: 'Angry',    fill: 'rgba(255,59,48,0.12)' },
};

const LOCAL_T = {
  en: {
    notEnoughData: 'Not enough data to render turn graph.',
    requiresInteraction: 'Requires at least 2 interaction turns.',
    turn: 'Turn',
    autoplayingHighlights: 'AUTOPLAYING HIGHLIGHTS',
    emotionalPeaksCount: 'Emotional Peaks',
    whenTheySaid: 'When they said:',
    theyShowed: 'They showed:',
    datasetTransparencyTitle: 'Dataset Transparency & Bias Warning',
    severeBiasRisk: 'Severe bias risk:',
    approvedTag: 'Approved:',
    primaryTag: 'Primary:',
    ferDesc: '67% Caucasian faces. ~50% accuracy on Sub-Saharan African & East Asian users. Rejected.',
    cafpsDesc: 'Baseline dataset for Chinese expression norms (220 Chinese subjects).',
    emosenseZwDesc: 'Purpose-built for Zimbabwean (Shona/Ndebele) + Chinese-in-Zimbabwe participants. 87.3% accuracy.',
    advice: 'Advice',
    emotionalBreakdown: 'Emotion Breakdown',
    emotionTimeline: 'Emotion Timeline',
    aiFollowupStrategy: 'AI Follow-up Strategy',
    voiceAnalyticsPro: 'PRO',
    voiceAdviceHappy: 'Great alignment! Reinforce this topic in future meetings.',
    voiceAdviceSad: 'Show empathy and pause to listen deeply.',
    voiceAdviceAngry: 'Try to remain neutral and de-escalate when they bring this up.',
    voiceAdviceDefault: 'Maintain standard communication.',

    stratZwCnHeader: '<strong>Cultural Context: Zimbabwe ↔ China (Mianzi/Face Focus)</strong><br/>',
    stratZwCnNeutral: 'Detected high neutrality (60%+). In Chinese professional norms, this often indicates "Face-saving" or polite reservation. The participant may have unspoken concerns. <br/><strong>Advice:</strong> Do not press for immediate commitment. Use "soft" follow-ups like: <em>"We would value your internal perspective on this."</em>',
    stratZwCnHappy: 'Strong positive resonance detected. This indicates high relational harmony (Guanxi). <br/><strong>Advice:</strong> Excellent time to solidify the partnership. Acknowledge their contribution to the "mutual benefit" (win-win) of the session.',
    stratZwCnFriction: 'Friction or hesitation detected. In this cross-cultural link, direct confrontation is often avoided. <br/><strong>Advice:</strong> Slow down. Shift the focus to shared goals and use a more humble, accommodating tone to restore "Face."',
    stratZwCnBalanced: 'Balanced interaction. <br/><strong>Advice:</strong> Maintain formal respect and structured delivery. Avoid overly casual language which might be misinterpreted as a lack of seriousness.',

    stratZwHeader: '<strong>Cultural Context: Zimbabwe (Ubuntu/Respect Focus)</strong><br/>',
    stratZwHappy: 'Strong social harmony detected. Reflects "Ubuntu" (humanity towards others). <br/><strong>Advice:</strong> Maintain the warm rapport. Personal connection is as important as the business at hand.',
    stratZwNeutral: 'Reserved engagement. Might indicate a "Wait and See" approach or respect-based listening. <br/><strong>Advice:</strong> Use inclusive language. Check in with: <em>"What is our collective thought on this direction?"</em> to encourage participation.',
    stratZwAngry: 'High emotional intensity detected. <br/><strong>Advice:</strong> De-escalate by acknowledging the person\'s status and the validity of their passion. Focus on community-led solutions.',
    stratZwDefault: 'Standard communal engagement. <br/><strong>Advice:</strong> Continue with a focus on shared values and clear, respectful communication.',

    stratCnHeader: '<strong>Cultural Context: China (Guanxi/Face Focus)</strong><br/>',
    stratCnNeutral: 'High neutrality detected — a common sign of Face-saving etiquette. <br/><strong>Advice:</strong> Avoid direct pressure. Allow space for indirect communication.',
    stratCnHappy: 'Strong positive engagement. Guanxi (relationship-building) is working well. <br/><strong>Advice:</strong> Reinforce trust with a follow-up summary or gesture of appreciation.',
    stratCnDefault: 'Standard engagement. <br/><strong>Advice:</strong> Maintain formal respect and be patient with decision timelines.',

    stratDefaultHeader: '<strong>Session — {ctxLabel}</strong><br/>',
    stratDefaultHappy: 'Excellent rapport established. <strong>Strategy:</strong> Good time to discuss forward-looking opportunities.',
    stratDefaultNeutral: 'Engagement is reserved. <strong>Strategy:</strong> Inject more interactive elements to gauge true interest.',
    stratDefaultDefault: 'Standard engagement detected. Maintain clear, structured communication.'
  },
  sn: {
    notEnoughData: 'Hapana data yakakwana kuratidza girafu remamiriro.',
    requiresInteraction: 'Zvinoda kutendeuka kwehurukuro kanenge ka2.',
    turn: 'Kutendeuka',
    autoplayingHighlights: 'KUTANGA KWEZVEKUPIKA ZVINOKOSHA',
    emotionalPeaksCount: 'Nguva dzeManzwiro Akanyanya',
    whenTheySaid: 'Pavakataura kuti:',
    theyShowed: 'Wakaratidza:',
    datasetTransparencyTitle: 'Kujeka kweData & Yambiro yeKusarura',
    severeBiasRisk: 'Ngozi huru yekusarura:',
    approvedTag: 'Zvatenderwa:',
    primaryTag: 'Kwakanyanya:',
    ferDesc: '67% zviso zvevarungu. Inoshanda ne50% chete kuvanhu vemuAfrica neEast Asia. Yakarambwa.',
    cafpsDesc: 'Data rekutanga remaitiro ekuChina (vanhu vekuChina varipo 220).',
    emosenseZwDesc: 'Yakagadzirirwa vanhu vemuZimbabwe (Shona/Ndebele) nevaChina vari muZimbabwe. Kushanda ne87.3%.',
    advice: 'Zano',
    emotionalBreakdown: 'Pfupiso yeManzwiro',
    emotionTimeline: 'Nguva dzeManzwiro',
    aiFollowupStrategy: 'Zano reAI reKutevedzera',
    voiceAnalyticsPro: 'PRO',
    voiceAdviceHappy: 'Kudyidzana kwakanaka kwazvo! Ramba uchikurukura nezvenyaya iyi mune ramangwana.',
    voiceAdviceSad: 'Ratidza tsitsi uye umbomira kuti uteerere nemoyo wese.',
    voiceAdviceAngry: 'Edza kuramba wakadzikama uye kudzikisa hasha pavanozvitaura.',
    voiceAdviceDefault: 'Ramba uchingotaura semazuva ose.',

    stratZwCnHeader: '<strong>Mamiriro eTsika: Zimbabwe ↔ China (Mianzi/Maitiro eKuremekedzana)</strong><br/>',
    stratZwCnNeutral: 'Kudzikama kwazvo (60%+). Mutsika dzekuChina, izvi zvinoreva kuremekedzana (Mianzi) kana kunyara. Mutauri anogona kunge aine zvichemo zvisina kutaurwa. <br/><strong>Zano:</strong> Usamanikidze kubvuma izvozvi. Bvunza zvinyoro sezvizvi: <em>"Tinoda kunzwa pfungwa dzenyu dzemukati panyaya iyi."</em>',
    stratZwCnHappy: 'Kuwadzana kwakanaka kwazvo kwaratidzwa. Izvi zvinoratidza hukama hwepedyo (Guanxi). <br/><strong>Zano:</strong> Ino ndiyo nguva yakanaka yekusimbisa kudyidzana. Tenda kubatsira kwavo kune "kubatsirikana kwemativi ose" (win-win) pamusangano uyu.',
    stratZwCnFriction: 'Kupokana kana kuzengurira kwaonekwa. Mukudyidzana uku, kupokana kwepachena kunodzivirirwa. <br/><strong>Zano:</strong> Nonocha. Focus pazvinangwa zvinowiriranwa, wotaura zvine mutsa kuti uchengetedze kuremekedzana (Mianzi).',
    stratZwCnBalanced: 'Hurukuro yakaenzana. <br/><strong>Zano:</strong> Ramba wakaremekedza uye kutevedzera maitiro ebasa. Dzivisa kutaura kwemajaya kunogona kusanzwisiswa.',

    stratZwHeader: '<strong>Mamiriro eTsika: Zimbabwe (Ubuntu/Hunhu)</strong><br/>',
    stratZwHappy: 'Kuwadzana kukuru kwevanhu kwaonekwa. Izvi zvinoratidza "Ubuntu" (hunhu kuvanhu vamwe). <br/><strong>Zano:</strong> Ramba uine hukama hwakanaka. Hukama hwevanhu hwakakosha sezvakaita basa riripo.',
    stratZwNeutral: 'Kuteerera zvakanyanya. Zvinogona kureva kuti "Mira Uone" kana kuteerera zvine ruremekedzo. <br/><strong>Zano:</strong> Shandisa mazwi ekubatanidza vanhu. Bvunza kuti: <em>"Ndeapi mafungiro edu tose panyaya iyi?"</em> kukurudzira kutora chikamu.',
    stratZwAngry: 'Manzwiro akanyanya kuonekwa. <br/><strong>Zano:</strong> Podza hasha nekubvuma chinzvimbo chemunhu uye chikonzero chake. Focus pamazano anobatsira vese.',
    stratZwDefault: 'Kutora chikamu kwemagariro edu. <br/><strong>Zano:</strong> Ramba wakatarisa pazvinhu zvakakosha uye kukurukurirana kwakajeka uye kune ruremekedzo.',

    stratCnHeader: '<strong>Mamiriro eTsika: China (Guanxi/Mianzi Focus)</strong><br/>',
    stratCnNeutral: 'Kudzikama kukuru kwaratidzwa — chiratidzo chetsika dzekuremekedzana (Mianzi). <br/><strong>Zano:</strong> Dzivisa kumanikidza vanhu. Ipa mukana wekuti vanhu vataure zviri mukati mavo zvishoma nezvishoma.',
    stratCnHappy: 'Kudyidzana kwakasimba. Hukama hweGuanxi huri kushanda zvakanaka. <br/><strong>Zano:</strong> Simbisa kuvimbana nekutenda kwakadzama mushure memusangano.',
    stratCnDefault: 'Kukurukurirana kwakajairika. <br/><strong>Zano:</strong> Ramba uine ruremekedzo uye tsungirira nenguva dzemaitiro ekuChina.',

    stratDefaultHeader: '<strong>Musangano — {ctxLabel}</strong><br/>',
    stratDefaultHappy: 'Hukama hwakanaka kwazvo hwamira. <strong>Zano:</strong> Ino ndiyo nguva yakanaka yekukurukura nezvemukana wamangwana.',
    stratDefaultNeutral: 'Kutora chikamu kwakadzikama. <strong>Zano:</strong> Shandisa mitambo kana mibvunzo inofadza kuti uone kufarira kwayo chaiko.',
    stratDefaultDefault: 'Kukurukurirana kwakajairika kwaonekwa. Ramba uchingotaura zvakajeka uye zvakarongeka.'
  },
  zh: {
    notEnoughData: '数据不足，无法渲染情绪走势图。',
    requiresInteraction: '至少需要 2 次会话交互状态。',
    turn: '轮次',
    autoplayingHighlights: '正在自动播放高光片段',
    emotionalPeaksCount: '情绪峰值时刻',
    whenTheySaid: '当对方说：',
    theyShowed: '他们表现为：',
    datasetTransparencyTitle: '数据集透明度与偏差预警',
    severeBiasRisk: '严重偏差风险：',
    approvedTag: '已核准：',
    primaryTag: '主数据集：',
    ferDesc: '67% 为白人面孔。对撒哈拉以南非洲及东亚用户的准确率仅为约 50%。已弃用。',
    cafpsDesc: '用于评估中国表情规范的基准数据集（含 220 名中国受试者）。',
    emosenseZwDesc: '专为津巴布韦人（绍纳语/恩德贝莱语）及在津华人定制。准确率达 87.3%。',
    advice: '建议',
    emotionalBreakdown: '情绪分布细分',
    emotionTimeline: '情绪走势时间轴',
    aiFollowupStrategy: 'AI 跟进沟通策略',
    voiceAnalyticsPro: '专业版',
    voiceAdviceHappy: '达成深度共识！在未来的会议中可进一步强化此议题。',
    voiceAdviceSad: '表达共情并适当停顿，进行深度倾听。',
    voiceAdviceAngry: '尽量保持客观中立，并在对方提及此话题时缓和气氛。',
    voiceAdviceDefault: '保持标准的商务沟通方式。',

    stratZwCnHeader: '<strong>文化背景：津巴布韦 ↔ 中国（侧重“面子”与礼仪）</strong><br/>',
    stratZwCnNeutral: '检测到高度中性（60%+）。在中国专业社交中，这通常代表“顾全对方颜面”或礼貌保留。对方可能有未明言的顾虑。 <br/><strong>建议：</strong> 请勿急于要求表态。建议使用柔和的方式跟进，如：<em>“我们非常希望能听取您对此的内部看法。”</em>',
    stratZwCnHappy: '检测到强烈的积极共鸣。这表明良好的人际关系（关系 Guanxi）正在建立。 <br/><strong>建议：</strong> 此时是巩固合作关系的黄金时间。确认并感谢他们为会话达成“互利共赢”所作出的贡献。',
    stratZwCnFriction: '检测到情绪摩擦或犹豫。在这种跨文化沟通中，人们往往会避免正面冲突。 <br/><strong>建议：</strong> 放慢节奏。将焦点转移到双方的共同目标上，使用更加谦虚和包容的语气以恢复双方的“面子”。',
    stratZwCnBalanced: '互动表现均衡。 <br/><strong>建议：</strong> 保持正式的尊重和严谨的职业表达。避免使用过于随意的语言，否则可能会被解读为缺乏诚意。',

    stratZwHeader: '<strong>文化背景：津巴布韦（侧重“乌班图” Ubuntu 凝聚力与尊重）</strong><br/>',
    stratZwHappy: '检测到强烈的社群和谐。这体现了“乌班图”（Ubuntu，即我因大家而存在）的人文精神。 <br/><strong>建议：</strong> 维持这种热情的融洽氛围。建立人际温度与推进商业事务同样重要。',
    stratZwNeutral: '倾听含蓄。这可能代表对方持“观望”态度，或是出于尊重的倾听。 <br/><strong>建议：</strong> 多使用群体性语言。如：<em>“我们大家对这个方向有什么整体的想法？”</em>以鼓励全员参与。',
    stratZwAngry: '检测到较强的情绪波动。 <br/><strong>建议：</strong> 尊重对方的身份及其表达的热忱，以此来平息紧张气氛。重点探讨社群共同的解决方案。',
    stratZwDefault: '标准的社群式互动。 <br/><strong>建议：</strong> 继续专注于共享价值，保持清晰、尊重的沟通。',

    stratCnHeader: '<strong>文化背景：中国（侧重“关系”与“面子”）</strong><br/>',
    stratCnNeutral: '检测到高度中性表达——这在商务社交中往往是顾全彼此面子的常规礼仪。 <br/><strong>建议：</strong> 避免施加直接压力，为委婉间接的沟通留出充裕空间。',
    stratCnHappy: '积极互动良好。说明“关系”（Guanxi）建设成效显著。 <br/><strong>建议：</strong> 通过会后简报或真诚的致谢动作进一步强化信任基石。',
    stratCnDefault: '互动处于标准水平。 <br/><strong>建议：</strong> 始终保持礼貌和尊重，对决策周期要有耐心。',

    stratDefaultHeader: '<strong>会话 — {ctxLabel}</strong><br/>',
    stratDefaultHappy: '已建立极佳的融洽关系。<strong>建议：</strong> 此时非常适合探讨前瞻性的合作机会。',
    stratDefaultNeutral: '互动参与度有所保留。<strong>建议：</strong> 增加互动环节以进一步激发和确认对方的真实兴趣。',
    stratDefaultDefault: '检测到标准的会话状态。请保持清晰、结构化的常规沟通。'
  }
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
  const { lang, t } = useLang();
  const lt = LOCAL_T[lang] || LOCAL_T.en;
  
  const W = 600, H = 200, pad = 24;
  const [animated, setAnimated] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!timeline || timeline.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--dim)', fontFamily: 'monospace', fontSize: '12px' }}>
        {lt.notEnoughData}<br/>
        <span style={{ fontSize: '10px' }}>{lt.requiresInteraction}</span>
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
    const tickLabel = `${lt.turn} ${turnNum}`;
    // Don't duplicate ticks if there are very few turns
    if (!ticks.find(t => t.label === tickLabel)) {
      ticks.push({ x, label: tickLabel });
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
          { v: 100, label: t('happy'), color: '#34c759' },
          { v: 50,  label: t('neutral'), color: '#8899bb' },
          { v: 0,   label: `${t('sad')}/${t('angry')}`, color: '#ff3b30' }
        ].map(({ v, label, color }) => {
          const y = pad + (1 - v / 100) * (H - pad * 2);
          return (
            <g key={label}>
              <line x1={pad + 20} y1={y} x2={W - pad} y2={y}
                stroke="var(--bd2)" strokeWidth="1" strokeDasharray="4 4" />
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
            textAnchor="middle" fill="var(--dim)" fontSize="9" fontFamily="monospace">
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

export default function ReportView({ onBack, emoCounts, duration, sessionInfo, timeline, voiceTriggers, videoData, session }) {
  const { lang, t } = useLang();
  const lt = LOCAL_T[lang] || LOCAL_T.en;

  const saved = useRef(false);
  const [strategy, setStrategy] = useState('');
  
  // Highlight Reel Logic
  const videoRef = useRef(null);
  const [isPlayingHighlights, setIsPlayingHighlights] = useState(false);
  const highlightTimeoutsRef = useRef([]);

  // Filter valid triggers that happened AFTER recording started
  const validHighlights = useMemo(() => {
    if (!videoData || !voiceTriggers) return [];
    return voiceTriggers
      .filter(t => t.time >= videoData.startTime)
      .map(t => ({ ...t, relativeSecs: (t.time - videoData.startTime) / 1000 }));
  }, [videoData, voiceTriggers]);

  const handleSeek = (secs) => {
    if (videoRef.current) {
      stopHighlightReel();
      videoRef.current.currentTime = Math.max(0, secs - 2); // Start 2s before the trigger
      videoRef.current.play().catch(e => console.error(e));
    }
  };

  const playHighlightReel = () => {
    if (!videoRef.current || validHighlights.length === 0) return;
    setIsPlayingHighlights(true);
    
    highlightTimeoutsRef.current.forEach(clearTimeout);
    highlightTimeoutsRef.current = [];

    let currentHighlightIdx = 0;
    
    const playNext = () => {
      if (currentHighlightIdx >= validHighlights.length) {
        setIsPlayingHighlights(false);
        videoRef.current.pause();
        return;
      }
      
      const hl = validHighlights[currentHighlightIdx];
      videoRef.current.currentTime = Math.max(0, hl.relativeSecs - 2);
      videoRef.current.play().catch(e => console.error(e));
      
      // Play for 6 seconds (2s before, 4s after trigger)
      const t = setTimeout(() => {
        currentHighlightIdx++;
        playNext();
      }, 6000);
      highlightTimeoutsRef.current.push(t);
    };
    
    playNext();
  };

  const stopHighlightReel = () => {
    setIsPlayingHighlights(false);
    highlightTimeoutsRef.current.forEach(clearTimeout);
    highlightTimeoutsRef.current = [];
    if (videoRef.current) videoRef.current.pause();
  };

  useEffect(() => {
    const total = (emoCounts.happy + emoCounts.neutral + emoCounts.sad + emoCounts.angry) || 1;
    const hP = emoCounts.happy / total;
    const nP = emoCounts.neutral / total;
    const aP = emoCounts.angry / total;
    const sP = emoCounts.sad / total;
    const ctx = sessionInfo?.ctx || '';
    const ctxLower = ctx.toLowerCase();
    const isChina = /china|chinese|cn\b|beijing|shanghai/.test(ctxLower);
    const isZimbabwe = /zimbabwe|zimbabwean|zw\b|harare|bulawayo|shona|ndebele/.test(ctxLower);
    const ctxLabel = ctx || 'International';
    let strat = '';

    const ltObj = LOCAL_T[lang] || LOCAL_T.en;

    if (isChina && isZimbabwe) {
      strat = ltObj.stratZwCnHeader;
      if (nP > 0.6) {
        strat += ltObj.stratZwCnNeutral;
      } else if (hP > 0.4) {
        strat += ltObj.stratZwCnHappy;
      } else if (aP > 0.1 || sP > 0.1) {
        strat += ltObj.stratZwCnFriction;
      } else {
        strat += ltObj.stratZwCnBalanced;
      }
    } else if (isZimbabwe) {
      strat = ltObj.stratZwHeader;
      if (hP > 0.4) {
        strat += ltObj.stratZwHappy;
      } else if (nP > 0.6) {
        strat += ltObj.stratZwNeutral;
      } else if (aP > 0.15) {
        strat += ltObj.stratZwAngry;
      } else {
        strat += ltObj.stratZwDefault;
      }
    } else if (isChina) {
      strat = ltObj.stratCnHeader;
      if (nP > 0.6) {
        strat += ltObj.stratCnNeutral;
      } else if (hP > 0.4) {
        strat += ltObj.stratCnHappy;
      } else {
        strat += ltObj.stratCnDefault;
      }
    } else {
      strat = ltObj.stratDefaultHeader.replace('{ctxLabel}', ctxLabel);
      if (hP > 0.5) strat += ltObj.stratDefaultHappy;
      else if (nP > 0.5) strat += ltObj.stratDefaultNeutral;
      else strat += ltObj.stratDefaultDefault;
    }
    setStrategy(strat);

    if (saved.current) return;
    saved.current = true;
    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration, emoCounts, ctx, userId: session?.user?.id || null })
    }).catch(e => console.error(e));
  }, [duration, emoCounts, sessionInfo, lang]);

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
    background: 'var(--surf)',
    backdropFilter: 'blur(20px)',
    border: '1px solid var(--bd2)',
    boxShadow: '0 8px 32px var(--shadow)',
    borderRadius: '20px',
    padding: '20px',
  };

  return (
    <div className="screen active" id="sReport" style={{
      overflowY: 'auto',
      background: 'var(--bg)',
      fontFamily: 'system-ui, -apple-system, "SF Pro Display", sans-serif',
    }}>
      <div className="rep" style={{ margin: '0 auto', paddingBottom: '80px', paddingTop: '40px' }}>
        <div className="rh" style={{ marginBottom: '24px' }}>
          <div>
            <div className="rh-t" style={{ color: 'var(--txt)' }}>{t('sessionReport')}</div>
            <div className="rh-m">{new Date().toLocaleString()}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <LangSwitcher />
            <button className="btn-new" onClick={handleDownloadPDF}
              style={{ background: 'rgba(0,122,255,0.15)', color: 'var(--blue)', borderColor: 'rgba(0,122,255,0.3)' }}>
              ↓ PDF
            </button>
            <button className="btn-new" onClick={onBack}>{t('newCall')}</button>
            {session && (
              <button
                onClick={() => supabase.auth.signOut()}
                style={{
                  padding: '9px 16px', borderRadius: '12px', border: '0.5px solid rgba(255,59,48,0.35)',
                  background: 'rgba(255,59,48,0.1)', color: '#ff3b30',
                  fontFamily: 'var(--mono)', fontSize: '11px', cursor: 'pointer',
                  fontWeight: '600', letterSpacing: '0.02em', whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.1)'}
              >
                {t('signOut')}
              </button>
            )}
          </div>
        </div>

        <div id="report-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Highlight Reel Player */}
          {videoData && (
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--txt)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px' }}>🎬</span> {t('sessionRecording')}
                </h3>
                {validHighlights.length > 0 && (
                  <button onClick={isPlayingHighlights ? stopHighlightReel : playHighlightReel} style={{
                    background: isPlayingHighlights ? 'rgba(255,59,48,0.2)' : 'rgba(52,199,89,0.2)',
                    color: isPlayingHighlights ? '#ff3b30' : '#34c759',
                    border: `1px solid ${isPlayingHighlights ? 'rgba(255,59,48,0.4)' : 'rgba(52,199,89,0.4)'}`,
                    padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                    display: 'flex', gap: '6px', alignItems: 'center', transition: 'all 0.2s'
                  }}>
                    {isPlayingHighlights ? t('stopHighlights') : t('playHighlights')}
                  </button>
                )}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1px', background: 'var(--bd)' }}>
                {/* Video Player */}
                <div style={{ background: '#000', position: 'relative', display: 'flex' }}>
                  <video 
                    ref={videoRef}
                    src={videoData.url} 
                    controls 
                    style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
                  />
                  {isPlayingHighlights && (
                    <div style={{
                      position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', 
                      backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '6px',
                      color: 'white', fontSize: '12px', fontWeight: 'bold', display: 'flex', gap: '6px', alignItems: 'center'
                    }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff3b30', animation: 'pulse 1.5s infinite' }} />
                      {lt.autoplayingHighlights}
                    </div>
                  )}
                </div>

                {/* Highlight Markers */}
                <div style={{ background: 'var(--surf2)', overflowY: 'auto', maxHeight: '400px', padding: '12px' }}>
                  <h4 style={{ color: 'var(--muted)', margin: '0 0 12px 4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lt.emotionalPeaksCount} ({validHighlights.length})</h4>
                  
                  {validHighlights.length === 0 ? (
                    <div style={{ color: 'var(--dim)', fontSize: '13px', padding: '12px 4px' }}>{t('noPeaks')}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {validHighlights.map((hl, i) => {
                        const m = Math.floor(hl.relativeSecs / 60);
                        const s = Math.floor(hl.relativeSecs % 60).toString().padStart(2, '0');
                        return (
                          <div key={i} onClick={() => handleSeek(hl.relativeSecs)} style={{
                            padding: '12px', borderRadius: '8px', background: 'var(--surf2)',
                            borderLeft: `3px solid ${EMO_COLORS[hl.emotion]?.stroke || '#fff'}`, cursor: 'pointer',
                            transition: 'background 0.2s'
                          }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surf)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--surf2)'}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: EMO_COLORS[hl.emotion]?.stroke || '#fff' }}>{t(hl.emotion) || hl.emotion}</span>
                              <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'monospace' }}>{m}:{s}</span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic' }}>"{hl.text}"</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="r-st">
            <div style={cardStyle}>
              <div className="rsc-v" style={{ color: 'var(--txt)' }}>{Math.floor(duration / 60)}m {duration % 60}s</div>
              <div className="rsc-l">{t('durationLabel')}</div>
            </div>
            <div style={cardStyle}>
              <div className="rsc-v" style={{ color: 'var(--txt)' }}>{total}</div>
              <div className="rsc-l">{t('dataPointsLabel')}</div>
            </div>
            <div style={cardStyle}>
              <div className="rsc-v" style={{ color: '#34c759' }}>{getPct(emoCounts.happy)}%</div>
              <div className="rsc-l">{t('positiveLabel')}</div>
            </div>
          </div>

          {/* ── Session Insights ── */}
          {(() => {
            const empathy = Math.round(((emoCounts.happy + emoCounts.neutral) / total) * 100);
            const empColor = empathy >= 70 ? '#34c759' : empathy >= 50 ? '#8899bb' : '#ff3b30';
            const empLabel = empathy >= 70 ? 'Positive' : empathy >= 50 ? 'Neutral' : 'High Friction';

            // Emotional stability: fewer unique emotions = more stable
            const half = Math.ceil((timeline || []).length / 2);
            const firstHalf = (timeline || []).slice(0, half);
            const secondHalf = (timeline || []).slice(half);
            const calcEmp = (arr) => {
              if (!arr.length) return 50;
              const pos = arr.filter(t => t.emo === 'happy' || t.emo === 'neutral').length;
              return Math.round((pos / arr.length) * 100);
            };
            const firstScore = calcEmp(firstHalf);
            const secondScore = calcEmp(secondHalf);
            const momentum = secondScore - firstScore;
            const momentumLabel = momentum > 5 ? '↑ Improving' : momentum < -5 ? '↓ Declining' : '→ Stable';
            const momentumColor = momentum > 5 ? '#34c759' : momentum < -5 ? '#ff3b30' : '#8899bb';

            // Switches = number of emotion changes
            let switches = 0;
            (timeline || []).forEach((t, i) => { if (i > 0 && t.emo !== timeline[i-1].emo) switches++; });
            const turnCount = (timeline || []).length;
            const stabilityPct = turnCount > 1 ? Math.max(0, Math.round(100 - (switches / (turnCount - 1)) * 100)) : 100;
            const stabilityLabel = stabilityPct >= 70 ? 'Consistent' : stabilityPct >= 40 ? 'Variable' : 'Volatile';
            const stabilityColor = stabilityPct >= 70 ? '#34c759' : stabilityPct >= 40 ? '#8899bb' : '#ff3b30';

            const metric = (val, label, sub, color) => (
              <div style={{ flex: 1, minWidth: '120px', padding: '16px', background: 'var(--surf2)', borderRadius: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color, letterSpacing: '-1px', lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--txt)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div style={{ fontSize: '10px', color, marginTop: '3px', fontWeight: '600' }}>{sub}</div>
              </div>
            );

            return (
              <div style={{ ...cardStyle, marginBottom: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>{t('sessionInsights')}</div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {metric(`${empathy}%`, t('empathyScore'), empLabel, empColor)}
                  {metric(momentumLabel, t('callMomentum'), `${firstScore}% → ${secondScore}%`, momentumColor)}
                  {metric(`${stabilityPct}%`, t('emotionalStability'), stabilityLabel, stabilityColor)}
                  {metric(switches, t('emotionShifts'), `across ${turnCount} ${t('turns')}`, 'var(--blue)')}
                </div>
              </div>
            );
          })()}

          <div style={cardStyle}>
            <div className="rc-t" style={{ marginBottom: '16px' }}>{lt.emotionTimeline}</div>
            <TimelineChart timeline={timeline} />
          </div>

          {/* Emotion Breakdown */}
          <div style={cardStyle}>
            <div className="rc-t">{lt.emotionalBreakdown}</div>
            <div className="echart">
              {[
                { key: 'happy', color: '#34c759', bgColor: 'rgba(52,199,89,0.15)' },
                { key: 'neutral', color: '#8899bb', bgColor: 'rgba(136,153,187,0.12)' },
                { key: 'sad', color: '#5b9cf6', bgColor: 'rgba(91,156,246,0.15)' },
                { key: 'angry', color: '#ff3b30', bgColor: 'rgba(255,59,48,0.15)' },
              ].map(({ key, color, bgColor }) => (
                <div key={key} className="ecr">
                  <div className="ecl" style={{ color: 'var(--muted)' }}>{t(key)}</div>
                  <div className="ect" style={{ background: 'var(--surf2)', borderRadius: '999px' }}>
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
                {t('aiVoiceAnalytics')}
                <span style={{ fontSize: '9px', fontWeight: '800', background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#1a1a2e', padding: '2px 6px', borderRadius: '4px' }}>{lt.voiceAnalyticsPro}</span>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {voiceTriggers.map((trig, i) => {
                   const { stroke } = EMO_COLORS[trig.emotion] || EMO_COLORS.neutral;
                   let advice = lt.voiceAdviceDefault;
                   if (trig.emotion === 'angry') advice = lt.voiceAdviceAngry;
                   if (trig.emotion === 'sad') advice = lt.voiceAdviceSad;
                   if (trig.emotion === 'happy') advice = lt.voiceAdviceHappy;
                   
                   return (
                     <div key={i} style={{ padding: '12px', background: 'var(--surf2)', borderRadius: '12px', borderLeft: `3px solid ${stroke}` }}>
                       <div style={{ fontSize: '13px', color: 'var(--txt)' }}>
                         {lt.whenTheySaid} <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>"{trig.text}"</span>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                         <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{lt.theyShowed}</span>
                         <span style={{ fontSize: '11px', fontWeight: '700', color: stroke, textTransform: 'uppercase' }}>{t(trig.emotion)}</span>
                       </div>
                       <div style={{ fontSize: '11px', color: 'var(--amber-text)', marginTop: '8px', background: 'rgba(255,183,71,0.1)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,183,71,0.2)' }}>
                         <strong>{lt.advice}:</strong> {advice}
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
              <span className="ir-t" style={{ color: '#34c759' }}>{lt.aiFollowupStrategy}</span>
            </div>
            <div className="ir-item" style={{ background: 'var(--surf2)', borderRadius: '10px', padding: '12px', marginTop: '8px' }}>
              <div className="ir-txt" style={{ fontSize: '13px', lineHeight: '1.65' }}
                dangerouslySetInnerHTML={{ __html: strategy }} />
            </div>
          </div>

          {/* Dataset Transparency */}
          <div style={{ ...cardStyle, border: '1px solid rgba(255,183,71,0.2)', background: 'rgba(255,183,71,0.04)' }}>
            <div className="ds-title" style={{ color: '#ffb347' }}>{lt.datasetTransparencyTitle}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { tag: 'FER-2013', tagColor: '#ff3b30', text: `<strong>${lt.severeBiasRisk}</strong> ${lt.ferDesc}` },
                { tag: 'CAFPS', tagColor: '#34c759', text: `<strong>${lt.approvedTag}</strong> ${lt.cafpsDesc}` },
                { tag: 'EmoSense ZW', tagColor: '#5b9cf6', text: `<strong>${lt.primaryTag}</strong> ${lt.emosenseZwDesc}` },
              ].map(({ tag, tagColor, text }) => (
                <div key={tag} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: '9px', fontFamily: 'monospace', padding: '3px 8px', borderRadius: '6px',
                    border: `1px solid ${tagColor}55`, background: `${tagColor}18`, color: tagColor,
                    whiteSpace: 'nowrap', flexShrink: 0, marginTop: '1px'
                  }}>{tag}</span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.6 }}
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
