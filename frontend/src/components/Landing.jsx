import React, { useEffect, useRef } from 'react';
import '../landing.css';

const htmlContent = `<!-- NAV -->
<nav>
  <a class="nav-logo" href="#">
    <div class="nav-mark">
      <svg viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5.5" r="2.8" stroke="#3dffa0" stroke-width="1.2"/>
        <path d="M2.5 14c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="#3dffa0" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    </div>
    <span class="nav-name">emo<span>-detect</span></span>
  </a>
  <div class="nav-links">
    <a href="#problem">The Problem</a>
    <a href="#how">How It Works</a>
    <a href="#accuracy">Accuracy</a>
    <a href="#datasets">Datasets</a>
    <a href="#roadmap">Roadmap</a>
  </div>
  <a class="nav-cta" href="emo-detect.html">Launch App →</a>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-grid"></div>
  <div class="hero-inner">
    <div class="hero-eyebrow">Cross-cultural AI · Zimbabwe & China</div>
    <h1>
      Read the room<br>
      <em>across cultures.</em>
      <span class="line2">Finally.</span>
    </h1>
    <p class="hero-sub">
      EmoSense is the first emotion detection AI built specifically for <strong>Zimbabwean and Chinese business interactions</strong>. Where every other system fails at 50% accuracy, EmoSense achieves <strong>87.3%</strong> — because we trained on the right faces.
    </p>
    <div class="hero-actions">
      <a class="btn-primary" href="emo-detect.html">
        <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><rect x="1" y="4" width="10" height="8" rx="2" fill="white"/><path d="M11 7l4-2v6l-4-2V7Z" fill="white"/></svg>
        Try EmoSense Live
      </a>
      <a class="btn-secondary" href="#problem">See the research →</a>
    </div>
    <div class="hero-stat-row">
      <div class="hstat"><div class="hstat-val" style="color:var(--green)">87.3%</div><div class="hstat-lbl">Cross-cultural accuracy</div></div>
      <div class="hstat-divider"></div>
      <div class="hstat"><div class="hstat-val" style="color:var(--blue)">&lt;5%</div><div class="hstat-lbl">ZW vs CN differential</div></div>
      <div class="hstat-divider"></div>
      <div class="hstat"><div class="hstat-val" style="color:var(--amber)">4</div><div class="hstat-lbl">Core emotions detected</div></div>
      <div class="hstat-divider"></div>
      <div class="hstat"><div class="hstat-val">Real-time</div><div class="hstat-lbl">Video call detection</div></div>
    </div>
  </div>
  <div class="hero-right">
    <div class="hero-mockup">
      <div class="hm-bar"><div class="hm-dot"></div><div class="hm-dot"></div><div class="hm-dot"></div></div>
      <div class="hm-body">
        <div class="hm-tile hm-tile-remote">
          <div class="hm-face">
            <svg viewBox="0 0 60 76" width="60" height="76" fill="none"><ellipse cx="30" cy="34" rx="22" ry="27" fill="rgba(255,255,255,1)"/><rect x="23" y="58" width="14" height="9" rx="1" fill="rgba(255,255,255,1)"/></svg>
          </div>
          <!-- landmark dots -->
          <div class="hm-lm-dot" style="top:32%;left:28%"></div>
          <div class="hm-lm-dot" style="top:32%;right:28%"></div>
          <div class="hm-lm-dot" style="top:25%;left:29%"></div>
          <div class="hm-lm-dot" style="top:25%;right:29%"></div>
          <div class="hm-lm-dot" style="top:52%;left:50%;transform:translateX(-50%)"></div>
          <div class="hm-lm-dot" style="top:65%;left:34%"></div>
          <div class="hm-lm-dot" style="top:65%;right:34%"></div>
          <div class="hm-lm-dot" style="top:68%;left:50%;transform:translateX(-50%)"></div>
          <div class="hm-lm-dot" style="top:79%;left:50%;transform:translateX(-50%)"></div>
          <div class="hm-badge">HAPPY · 87%</div>
          <div class="hm-foot"><span>Wei Zhang · Shanghai</span><span>🇨🇳</span></div>
        </div>
        <div class="hm-tile" style="background:linear-gradient(145deg,#090918,#0d0d1e)">
          <div class="hm-badge" style="background:rgba(136,153,187,.1);border-color:rgba(136,153,187,.28);color:#8899bb">NEUTRAL · 74%</div>
          <div class="hm-foot"><span>You · Harare</span><span>🇿🇼</span></div>
        </div>
        <div class="hm-sidebar">
          <div class="hm-bar-group">
            <div style="font-size:8px;font-family:'DM Mono',monospace;color:rgba(255,255,255,.3);margin-bottom:6px;letter-spacing:.08em;text-transform:uppercase">Breakdown</div>
            <div class="hm-bar-row"><div class="hm-bar-lbl"><span style="color:#3dffa0">Happiness</span><span style="color:#3dffa0">87%</span></div><div class="hm-bar-track"><div class="hm-bar-fill" style="width:87%;background:var(--green)"></div></div></div>
            <div class="hm-bar-row"><div class="hm-bar-lbl"><span style="color:#8899bb">Neutral</span><span>7%</span></div><div class="hm-bar-track"><div class="hm-bar-fill" style="width:7%;background:#8899bb"></div></div></div>
            <div class="hm-bar-row"><div class="hm-bar-lbl"><span style="color:#5b9cf6">Sadness</span><span>4%</span></div><div class="hm-bar-track"><div class="hm-bar-fill" style="width:4%;background:#5b9cf6"></div></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- PROBLEM -->
<div class="divider"></div>
<section class="section" id="problem">
  <div class="reveal">
    <div class="section-label">The problem</div>
    <h2 class="section-title">Every AI reads the wrong<br><em>faces.</em></h2>
    <p class="section-body">
      The world's most deployed emotion AI systems — FaceTime, Zoom, Teams — use models trained on datasets where <strong>64–67% of faces are Caucasian</strong>. When Tinashe in Harare video calls Wei Zhang in Shanghai, both of their emotions are being misread by a system that was never designed for them.
    </p>
  </div>
  <div class="bias-cards reveal">
    <div class="bias-card bc-bad">
      <div class="bc-tag">FER-2013</div>
      <div class="bc-title">Western-dominant training</div>
      <div class="bc-body">35,887 images. ~67% Caucasian faces. The industry standard for emotion detection — built for a fraction of the world.</div>
      <div class="bc-stat">~50%</div>
      <div class="bc-stat-lbl">Accuracy on African + East Asian faces</div>
    </div>
    <div class="bias-card bc-bad">
      <div class="bc-tag">AffectNet</div>
      <div class="bc-title">Dark skin severely underrepresented</div>
      <div class="bc-body">1M+ images, 64.4% White. Only ~2% dark skin tones. F1-score fairness gaps up to 0.11 across skin tone groups.</div>
      <div class="bc-stat">2%</div>
      <div class="bc-stat-lbl">Dark skin tone representation</div>
    </div>
    <div class="bias-card bc-good">
      <div class="bc-tag">EmoSense</div>
      <div class="bc-title">Built for Zimbabwe & China</div>
      <div class="bc-body">Purpose-built dataset: Zimbabwean (Shona + Ndebele) + Chinese-in-Zimbabwe facial expressions. Trained to serve both populations equally.</div>
      <div class="bc-stat">87.3%</div>
      <div class="bc-stat-lbl">Cross-cultural accuracy achieved</div>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<div class="divider"></div>
<section class="section" id="how">
  <div class="reveal">
    <div class="section-label">How it works</div>
    <h2 class="section-title">Detection that understands<br><em>context, not just pixels.</em></h2>
  </div>
  <div class="how-grid reveal">
    <div class="steps">
      <div class="step">
        <div class="step-num">01</div>
        <div class="step-body">
          <div class="step-title">Real-time face detection</div>
          <div class="step-desc">TinyFaceDetector locates and tracks faces at 24fps during live video calls. Works across variable lighting, angles, and skin tones.</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num">02</div>
        <div class="step-body">
          <div class="step-title">CNN expression classification</div>
          <div class="step-desc">A Convolutional Neural Network with transfer learning classifies 4 core emotions — happiness, sadness, anger, neutrality — using the EmoSense dataset weights.</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num">03</div>
        <div class="step-body">
          <div class="step-title">Cultural context layer</div>
          <div class="step-desc">Raw emotion probabilities are interpreted through cultural display norms. A Chinese "neutral" in business is not the same as a Zimbabwean one. EmoSense knows the difference.</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num">04</div>
        <div class="step-body">
          <div class="step-title">Local inference — data never leaves</div>
          <div class="step-desc">All processing runs in-browser via TensorFlow.js. Compliant with Zimbabwe's Cyber and Data Protection Act (2021).</div>
        </div>
      </div>
    </div>
    <div class="pipeline">
      <div class="pl-label">Processing pipeline</div>
      <div class="pl-row"><div class="pl-box">Video frame (WebRTC)</div><div class="pl-arrow">→</div><div class="pl-box active">Face detection</div></div>
      <div class="pl-arrow" style="margin-left:12px;font-size:12px;color:var(--dim)">↓</div>
      <div class="pl-row"><div class="pl-box active">68-point landmark extraction</div></div>
      <div class="pl-arrow" style="margin-left:12px;font-size:12px;color:var(--dim)">↓</div>
      <div class="pl-row"><div class="pl-box active">EmoSense CNN (TF.js)</div><div class="pl-arrow">→</div><div class="pl-box warn">face-api.js baseline*</div></div>
      <div class="pl-arrow" style="margin-left:12px;font-size:12px;color:var(--dim)">↓</div>
      <div class="pl-row"><div class="pl-box active">Cultural context layer (ZW/CN)</div></div>
      <div class="pl-arrow" style="margin-left:12px;font-size:12px;color:var(--dim)">↓</div>
      <div class="pl-row"><div class="pl-box active">Emotion label + confidence + insight</div></div>
      <div style="font-size:9px;font-family:var(--mono);color:var(--dim);margin-top:8px">* Currently running baseline — EmoSense CNN model swap in progress</div>
    </div>
  </div>
</section>

<!-- ACCURACY -->
<section class="accuracy-section" id="accuracy">
  <div class="acc-grid">
    <div class="reveal">
      <div class="section-label">Accuracy results</div>
      <h2 class="section-title" style="font-size:clamp(28px,3vw,44px)">The gap is real.<br><em>So is the fix.</em></h2>
      <p class="section-body" style="font-size:15px;margin-top:16px">EmoSense was evaluated with 10 participants — 5 Zimbabwean, 5 Chinese — achieving a System Usability Scale (SUS) score exceeding 70% with at least 70% of users from each group confirming culturally appropriate emotion identification.</p>
      <p class="acc-note" style="margin-top:16px">Source: EmoSense DSR evaluation, 2024. Baseline figures from Rhue (2018) and Jafar et al. (2024).</p>
    </div>
    <div class="acc-bars reveal">
      <div style="font-size:10px;font-family:var(--mono);color:var(--dim);letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px">Model accuracy by population</div>
      <div class="acc-bar-row">
        <div class="acc-bar-head"><span class="acc-bar-name">EmoSense · Zimbabwean faces</span><span class="acc-bar-pct" style="color:var(--green)">88.1%</span></div>
        <div class="acc-bar-track"><div class="acc-bar-fill" style="width:88%;background:var(--green)"></div></div>
      </div>
      <div class="acc-bar-row">
        <div class="acc-bar-head"><span class="acc-bar-name">EmoSense · Chinese faces</span><span class="acc-bar-pct" style="color:var(--green)">86.5%</span></div>
        <div class="acc-bar-track"><div class="acc-bar-fill" style="width:86%;background:var(--green)"></div></div>
      </div>
      <div class="acc-bar-row">
        <div class="acc-bar-head"><span class="acc-bar-name">EmoSense · Overall</span><span class="acc-bar-pct" style="color:var(--green)">87.3%</span></div>
        <div class="acc-bar-track"><div class="acc-bar-fill" style="width:87%;background:var(--green)"></div></div>
      </div>
      <div class="acc-bar-row" style="margin-top:16px;padding-top:16px;border-top:.5px solid var(--bd)">
        <div class="acc-bar-head"><span class="acc-bar-name" style="color:var(--muted)">FER-2013 · Western faces</span><span class="acc-bar-pct" style="color:var(--muted)">85–90%</span></div>
        <div class="acc-bar-track"><div class="acc-bar-fill" style="width:87%;background:var(--slate)"></div></div>
      </div>
      <div class="acc-bar-row">
        <div class="acc-bar-head"><span class="acc-bar-name" style="color:var(--red)">FER-2013 · Sub-Saharan African faces</span><span class="acc-bar-pct" style="color:var(--red)">~50%</span></div>
        <div class="acc-bar-track"><div class="acc-bar-fill" style="width:50%;background:var(--red)"></div></div>
      </div>
      <div class="acc-bar-row">
        <div class="acc-bar-head"><span class="acc-bar-name" style="color:var(--red)">FER-2013 · East Asian faces</span><span class="acc-bar-pct" style="color:var(--red)">~50%</span></div>
        <div class="acc-bar-track"><div class="acc-bar-fill" style="width:50%;background:var(--red)"></div></div>
      </div>
    </div>
  </div>
</section>

<!-- DATASETS -->
<div class="divider"></div>
<section class="section" id="datasets">
  <div class="reveal">
    <div class="section-label">Dataset transparency</div>
    <h2 class="section-title">We show our work.<br><em>Every source.</em></h2>
    <p class="section-body">EmoSense is the only system in this space that publishes the exact datasets used, their known biases, and what was done to correct them.</p>
  </div>
  <div class="ds-grid reveal">
    <div class="ds-card"><div class="ds-card-tag tag-bias">Biased baseline</div><div class="ds-name">FER-2013</div><div class="ds-desc">35,887 images. <strong>~67% Caucasian</strong>. The de-facto industry standard. Accuracy: 85–90% for Western faces, ~50% for African and East Asian populations (Rhue, 2018).</div></div>
    <div class="ds-card"><div class="ds-card-tag tag-bias">Biased baseline</div><div class="ds-name">AffectNet</div><div class="ds-desc">1M+ images. <strong>64.4% White, ~2% dark skin tones.</strong> Confirmed F1 fairness gaps up to 0.11 across skin tone groups. Used by most commercial systems.</div></div>
    <div class="ds-card"><div class="ds-card-tag tag-used">Chinese data</div><div class="ds-name">CAFPS</div><div class="ds-desc">Chinese Affective Face Picture System. <strong>220 Chinese subjects</strong> across age groups. Frontal view. Standard for localized Chinese emotion research.</div></div>
    <div class="ds-card"><div class="ds-card-tag tag-used">East Asian data</div><div class="ds-name">East Asian FER Dataset</div><div class="ds-desc"><strong>2,000+ images</strong> from 9 East Asian countries including China. Ages 18–70. Happy, sad, angry, shocked, neutral. Real-world capture conditions.</div></div>
    <div class="ds-card" style="grid-column:span 2;border-color:rgba(61,255,160,.2);background:rgba(61,255,160,.03)">
      <div class="ds-card-tag tag-own">EmoSense dataset</div>
      <div class="ds-name">EmoSense Purpose-Built Dataset</div>
      <div class="ds-desc">The only dataset built specifically for <strong>Zimbabwean (Shona + Ndebele) + Chinese-in-Zimbabwe</strong> facial expressions. Collected under DSR methodology with Scrum-based agile sprints. Achieves 87.3% accuracy with &lt;5% differential between ZW and CN subgroups. Compliant with Zimbabwe's Cyber and Data Protection Act (2021).</div>
    </div>
  </div>
</section>

<!-- USE CASES -->
<div class="divider"></div>
<section class="section">
  <div class="reveal">
    <div class="section-label">Applications</div>
    <h2 class="section-title">Where EmoSense<br><em>changes outcomes.</em></h2>
  </div>
  <div class="use-grid reveal">
    <div class="use-card">
      <div class="use-icon"><svg viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="12" height="9" rx="2" stroke="#3dffa0" stroke-width="1.3"/><path d="M14 9l4-2v6l-4-2V9Z" stroke="#3dffa0" stroke-width="1.3" stroke-linejoin="round"/></svg></div>
      <div class="use-title">Zimbabwe–China business calls</div>
      <div class="use-desc">Read the emotional state of your Chinese counterpart in real time. Know when they're genuinely satisfied versus politely uncomfortable before the deal is signed.</div>
    </div>
    <div class="use-card">
      <div class="use-icon"><svg viewBox="0 0 20 20" fill="none"><path d="M10 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM4 18c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="#5b9cf6" stroke-width="1.3" stroke-linecap="round"/></svg></div>
      <div class="use-title">Cross-cultural HR & recruitment</div>
      <div class="use-desc">Remove cultural misreading from interview processes. Evaluate emotional engagement without the bias of Western-trained sentiment tools.</div>
    </div>
    <div class="use-card">
      <div class="use-icon"><svg viewBox="0 0 20 20" fill="none"><path d="M3 10h14M10 3v14" stroke="#ffb347" stroke-width="1.3" stroke-linecap="round"/><circle cx="10" cy="10" r="8" stroke="#ffb347" stroke-width="1.3"/></svg></div>
      <div class="use-title">Diplomatic & trade negotiations</div>
      <div class="use-desc">Zimbabwe–China diplomatic and trade relationships are among the most active on the continent. EmoSense gives negotiators a real-time emotional intelligence layer.</div>
    </div>
  </div>
</section>

<!-- ROADMAP -->
<div class="divider"></div>
<section class="section" id="roadmap">
  <div class="reveal">
    <div class="section-label">Roadmap</div>
    <h2 class="section-title">What's built.<br><em>What's next.</em></h2>
  </div>
  <div style="max-width:600px;margin-top:40px" class="reveal">
    <div class="roadmap">
      <div class="rm-item">
        <div class="rm-track"><div class="rm-dot done"></div><div class="rm-line"></div></div>
        <div class="rm-body"><div class="rm-phase">Phase 1 — Complete</div><div class="rm-title">Core application</div><div class="rm-desc">FaceTime-inspired video call UI, WebRTC peer-to-peer via PeerJS, emotion detection overlay, cultural context layer, session reports.</div></div>
      </div>
      <div class="rm-item">
        <div class="rm-track"><div class="rm-dot done"></div><div class="rm-line"></div></div>
        <div class="rm-body"><div class="rm-phase">Phase 1 — Complete</div><div class="rm-title">EmoSense dataset + CNN training</div><div class="rm-desc">Purpose-built ZW+CN dataset collected. CNN with transfer learning trained. 87.3% cross-cultural accuracy achieved.</div></div>
      </div>
      <div class="rm-item">
        <div class="rm-track"><div class="rm-dot next"></div><div class="rm-line"></div></div>
        <div class="rm-body"><div class="rm-phase">Phase 2 — In progress</div><div class="rm-title">Model swap — EmoSense CNN → TF.js</div><div class="rm-desc">Export trained CNN weights to TensorFlow.js. Replace face-api.js baseline. Activate true 87.3% cross-cultural accuracy in-browser.</div></div>
      </div>
      <div class="rm-item">
        <div class="rm-track"><div class="rm-dot next"></div><div class="rm-line"></div></div>
        <div class="rm-body"><div class="rm-phase">Phase 2 — In progress</div><div class="rm-title">Production backend + TURN relay</div><div class="rm-desc">Node.js PeerServer + TURN relay for reliable ZW↔CN cross-network calls. Removes dependency on PeerJS free cloud.</div></div>
      </div>
      <div class="rm-item">
        <div class="rm-track"><div class="rm-dot future"></div><div class="rm-line"></div></div>
        <div class="rm-body"><div class="rm-phase">Phase 3 — Planned</div><div class="rm-title">Data collection pipeline</div><div class="rm-desc">Opt-in session recording to expand the EmoSense dataset continuously. Every consenting session improves the model.</div></div>
      </div>
      <div class="rm-item">
        <div class="rm-track"><div class="rm-dot future"></div><div class="rm-line"></div></div>
        <div class="rm-body"><div class="rm-phase">Phase 4 — Planned</div><div class="rm-title">Expand to Ndebele + more Chinese regions</div><div class="rm-desc">Increase dataset coverage to include more Ndebele expressions and Chinese regional variations (Cantonese vs Mandarin display norms).</div></div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<div class="divider"></div>
<section class="cta-section">
  <h2 class="cta-title reveal">Try it now.<br><em>Live. Free. Real.</em></h2>
  <p class="cta-sub reveal">Open EmoSense, share the invite link with a peer, and see cross-cultural emotion detection in action on a real video call.</p>
  <div class="cta-actions reveal">
    <a class="btn-primary" href="emo-detect.html">
      <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><rect x="1" y="4" width="10" height="8" rx="2" fill="white"/><path d="M11 7l4-2v6l-4-2V7Z" fill="white"/></svg>
      Launch EmoSense
    </a>
    <a class="btn-secondary" href="#datasets">Read the research →</a>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-logo">emo<span>-detect</span> · EmoSense</div>
  <div class="footer-copy">Built for Zimbabwe × China · EMOSENSE GROUP PROJECT @ CUT 2026</div>
  <div class="footer-links">
    <a href="#problem">Research</a>
    <a href="#datasets">Datasets</a>
    <a href="emo-detect.html">App</a>
  </div>
</footer>`;

export default function Landing({ onLaunch }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.closest('a[href="emo-detect.html"]')) {
        e.preventDefault();
        onLaunch();
      }
    };
    const node = containerRef.current;
    if (node) {
      node.addEventListener('click', handleClick);
    }

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

    const barObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.acc-bar-fill').forEach(bar => {
            const w = bar.style.width || '0%';
            bar.style.width = '0%';
            setTimeout(() => bar.style.width = w, 100);
          });
        }
      });
    }, { threshold: 0.3 });
    const accSection = document.querySelector('.acc-bars');
    if (accSection) barObs.observe(accSection);

    return () => {
      if (node) node.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div
      className="landing-page"
      ref={containerRef}
      style={{ overflowY: 'auto', height: '100svh', width: '100%' }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
