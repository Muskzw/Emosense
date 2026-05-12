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
    <span class="nav-name">Emo<span>Sense</span></span>
  </a>
  <div class="nav-links">
    <a href="#problem">The Problem</a>
    <a href="#how">How It Works</a>
    <a href="#accuracy">Accuracy</a>
    <a href="#datasets">Datasets</a>
    <a href="#roadmap">Roadmap</a>
  </div>
  <a class="nav-cta" href="launch">Launch App →</a>
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
      <a class="btn-primary" href="launch">
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
      <div class="hstat"><div class="hstat-val" style="color:var(--amber)">AI Coach</div><div class="hstat-lbl">Real-time cultural insights</div></div>
      <div class="hstat-divider"></div>
      <div class="hstat"><div class="hstat-val">Secure</div><div class="hstat-lbl">On-device inference</div></div>
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
            <div style="font-size:8px;font-family:'DM Mono',monospace;color:rgba(255,255,255,.3);margin-bottom:6px;letter-spacing:.08em;text-transform:uppercase">Live Insights</div>
            <div class="hm-bar-row"><div class="hm-bar-lbl"><span style="color:#3dffa0">Happiness</span><span style="color:#3dffa0">87%</span></div><div class="hm-bar-track"><div class="hm-bar-fill" style="width:87%;background:var(--green)"></div></div></div>
            <div class="hm-bar-row"><div class="hm-bar-lbl"><span style="color:#8899bb">Neutral</span><span>7%</span></div><div class="hm-bar-track"><div class="hm-bar-fill" style="width:7%;background:#8899bb"></div></div></div>
            <div class="hm-bar-row" style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.05)">
              <div style="font-size:7px;color:var(--green);font-weight:700">AI COACH: Possible face-saving detected.</div>
            </div>
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
          <div class="step-desc">A Convolutional Neural Network with transfer learning classifies core emotions — happiness, sadness, anger, neutrality — using EmoSense weights.</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num">03</div>
        <div class="step-body">
          <div class="step-title">Real-time AI Coaching</div>
          <div class="step-desc">EmoSense analyzes transcripts and emotions simultaneously to provide live cultural display norm insights (e.g., Mianzi/Face-saving).</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num">04</div>
        <div class="step-body">
          <div class="step-title">Local inference — data never leaves</div>
          <div class="step-desc">All processing runs in-browser. Compliant with Zimbabwe's Cyber and Data Protection Act (2021). Opt-in for model training available.</div>
        </div>
      </div>
    </div>
    <div class="pipeline">
      <div class="pl-label">Processing pipeline</div>
      <div class="pl-row"><div class="pl-box">Video frame (WebRTC)</div><div class="pl-arrow">→</div><div class="pl-box active">Face detection</div></div>
      <div class="pl-arrow" style="margin-left:12px;font-size:12px;color:var(--dim)">↓</div>
      <div class="pl-row"><div class="pl-box active">68-point landmark extraction</div></div>
      <div class="pl-arrow" style="margin-left:12px;font-size:12px;color:var(--dim)">↓</div>
      <div class="pl-row"><div class="pl-box active">EmoSense CNN Engine</div><div class="pl-arrow">→</div><div class="pl-box active">Cultural context layer</div></div>
      <div class="pl-arrow" style="margin-left:12px;font-size:12px;color:var(--dim)">↓</div>
      <div class="pl-row"><div class="pl-box active">AI Coaching & Insights</div></div>
      <div class="pl-arrow" style="margin-left:12px;font-size:12px;color:var(--dim)">↓</div>
      <div class="pl-row"><div class="pl-box active">Secure Session Analytics</div></div>
    </div>
  </div>
</section>

<!-- ACCURACY -->
<section class="accuracy-section" id="accuracy">
  <div class="acc-grid">
    <div class="reveal">
      <div class="section-label">Accuracy results</div>
      <h2 class="section-title" style="font-size:clamp(28px,3vw,44px)">The gap is real.<br><em>So is the fix.</em></h2>
      <p class="section-body" style="font-size:15px;margin-top:16px">EmoSense was evaluated with participants from both Zimbabwe and China, achieving consistent 87%+ accuracy across both groups — a significant leap over Western-only models.</p>
      <p class="acc-note" style="margin-top:16px">Source: EmoSense Evaluation, 2026. Baseline figures from industry benchmarks.</p>
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
        <div class="acc-bar-head"><span class="acc-bar-name" style="color:var(--muted)">FER-2013 · Western faces</span><span class="acc-bar-pct" style="color:var(--muted)">~87%</span></div>
        <div class="acc-bar-track"><div class="acc-bar-fill" style="width:87%;background:var(--slate)"></div></div>
      </div>
      <div class="acc-bar-row">
        <div class="acc-bar-head"><span class="acc-bar-name" style="color:var(--red)">FER-2013 · African faces</span><span class="acc-bar-pct" style="color:var(--red)">~50%</span></div>
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
    <p class="section-body">EmoSense is the only system in this space that publishes the exact datasets used and their known biases.</p>
  </div>
  <div class="ds-grid reveal">
    <div class="ds-card"><div class="ds-card-tag tag-bias">Biased baseline</div><div class="ds-name">FER-2013</div><div class="ds-desc">35,887 images. ~67% Caucasian. The industry standard, but misreads African/Asian faces at nearly 50% rate.</div></div>
    <div class="ds-card"><div class="ds-card-tag tag-bias">Biased baseline</div><div class="ds-name">AffectNet</div><div class="ds-desc">1M+ images. 64.4% White, only ~2% dark skin tones. Significant fairness gaps across skin tone groups.</div></div>
    <div class="ds-card"><div class="ds-card-tag tag-used">Chinese data</div><div class="ds-name">CAFPS</div><div class="ds-desc">Chinese Affective Face Picture System. Standard for localized Chinese emotion research.</div></div>
    <div class="ds-card" style="grid-column:span 1;border-color:rgba(61,255,160,.2);background:rgba(61,255,160,.03)">
      <div class="ds-card-tag tag-own">EmoSense dataset</div>
      <div class="ds-name">EmoSense Purpose-Built Dataset</div>
      <div class="ds-desc">Specifically for <strong>Zimbabwean + Chinese</strong> facial expressions. Compliant with ZW Data Protection Act.</div>
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
      <div class="use-title">Business negotiations</div>
      <div class="use-desc">Read the emotional state of your counterpart in real time. Know when they're genuinely satisfied versus politely uncomfortable.</div>
    </div>
    <div class="use-card">
      <div class="use-icon"><svg viewBox="0 0 20 20" fill="none"><path d="M10 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM4 18c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="#5b9cf6" stroke-width="1.3" stroke-linecap="round"/></svg></div>
      <div class="use-title">Cross-cultural HR</div>
      <div class="use-desc">Remove cultural misreading from interview processes. Evaluate emotional engagement without Western-trained bias.</div>
    </div>
    <div class="use-card">
      <div class="use-icon"><svg viewBox="0 0 20 20" fill="none"><path d="M3 10h14M10 3v14" stroke="#ffb347" stroke-width="1.3" stroke-linecap="round"/><circle cx="10" cy="10" r="8" stroke="#ffb347" stroke-width="1.3"/></svg></div>
      <div class="use-title">Diplomacy & Trade</div>
      <div class="use-desc">ZW–CN trade relationships are among the most active globally. EmoSense gives negotiators an emotional intelligence layer.</div>
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
        <div class="rm-body"><div class="rm-phase">Phase 1 — Complete</div><div class="rm-title">Core Infrastructure</div><div class="rm-desc">WebRTC P2P via PeerJS, dynamic layout, cultural context layer, and secure session reporting.</div></div>
      </div>
      <div class="rm-item">
        <div class="rm-track"><div class="rm-dot done"></div><div class="rm-line"></div></div>
        <div class="rm-body"><div class="rm-phase">Phase 2 — Complete</div><div class="rm-title">Production Backend & Security</div><div class="rm-desc">Node.js + PostgreSQL production backend, Supabase Auth integration, and atomic room code handling.</div></div>
      </div>
      <div class="rm-item">
        <div class="rm-track"><div class="rm-dot done"></div><div class="rm-line"></div></div>
        <div class="rm-body"><div class="rm-phase">Phase 2 — Complete</div><div class="rm-title">Data Collection Pipeline</div><div class="rm-desc">Anonymized opt-in facial data collection activated to continuously improve cross-cultural models.</div></div>
      </div>
      <div class="rm-item">
        <div class="rm-track"><div class="rm-dot next"></div><div class="rm-line"></div></div>
        <div class="rm-body"><div class="rm-phase">Phase 3 — In progress</div><div class="rm-title">Real-time AI Coaching</div><div class="rm-desc">Expanding the coaching engine with more cultural display norm triggers and voice-to-emotion correlation.</div></div>
      </div>
      <div class="rm-item">
        <div class="rm-track"><div class="rm-dot future"></div><div class="rm-line"></div></div>
        <div class="rm-body"><div class="rm-phase">Phase 4 — Planned</div><div class="rm-title">Mobile Native App</div><div class="rm-desc">Bringing EmoSense to iOS and Android for on-the-go cross-cultural intelligence.</div></div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<div class="divider"></div>
<section class="cta-section">
  <h2 class="cta-title reveal">Try it now.<br><em>Live. Secure. Reliable.</em></h2>
  <p class="cta-sub reveal">Open EmoSense, share the link, and experience cultural-aware AI in your next video call.</p>
  <div class="cta-actions reveal">
    <a class="btn-primary" href="launch">
      <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><rect x="1" y="4" width="10" height="8" rx="2" fill="white"/><path d="M11 7l4-2v6l-4-2V7Z" fill="white"/></svg>
      Launch EmoSense
    </a>
    <a class="btn-secondary" href="#datasets">Read the research →</a>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-logo">EmoSense</div>
  <div class="footer-copy">Built for Zimbabwe × China · EMOSENSE GROUP PROJECT @ CUT 2026</div>
  <div class="footer-links">
    <a href="#problem">Research</a>
    <a href="#datasets">Datasets</a>
    <a href="launch">App</a>
  </div>
</footer>`;

export default function Landing({ onLaunch }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.closest('a[href="launch"]')) {
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
