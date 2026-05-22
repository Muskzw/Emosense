import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLang, LangSwitcher } from '../context/LangContext';
import '../landing.css';

const getHtmlContent = (t) => `<!-- NAV -->
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
    <a href="#problem">${t('navProblem')}</a>
    <a href="#how">${t('navHow')}</a>
    <a href="#accuracy">${t('navAccuracy')}</a>
    <a href="#datasets">${t('navDatasets')}</a>
    <a href="#roadmap">${t('navRoadmap')}</a>
  </div>
  <div class="nav-actions" style="display:flex;align-items:center;gap:12px">
    <div id="landing-lang-switcher"></div>
    <a class="nav-cta" href="launch">${t('launchApp')} →</a>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-grid"></div>
  <div class="hero-inner">
    <div class="hero-eyebrow">${t('heroEyebrow')}</div>
    <h1>
      ${t('heroTitle1')}<br>
      <em>${t('heroTitle2')}</em>
      <span class="line2">${t('heroTitle3')}</span>
    </h1>
    <p class="hero-sub">${t('heroSub')}</p>
    <div class="hero-actions">
      <a class="btn-primary" href="launch">
        <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><rect x="1" y="4" width="10" height="8" rx="2" fill="white"/><path d="M11 7l4-2v6l-4-2V7Z" fill="white"/></svg>
        ${t('tryLive')}
      </a>
      <a class="btn-secondary" href="#problem">${t('seeResearch')}</a>
    </div>
    <div class="hero-stat-row">
      <div class="hstat"><div class="hstat-val" style="color:var(--green)">87.3%</div><div class="hstat-lbl">${t('crossCulturalAcc')}</div></div>
      <div class="hstat-divider"></div>
      <div class="hstat"><div class="hstat-val" style="color:var(--blue)">&lt;5%</div><div class="hstat-lbl">${t('diffStat')}</div></div>
      <div class="hstat-divider"></div>
      <div class="hstat"><div class="hstat-val" style="color:var(--amber)">${t('aiCoachStat')}</div><div class="hstat-lbl">${t('realtimeInsights')}</div></div>
      <div class="hstat-divider"></div>
      <div class="hstat"><div class="hstat-val">${t('secureStat')}</div><div class="hstat-lbl">${t('onDeviceInference')}</div></div>
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
          <div class="hm-foot"><span>${t('peerShanghai')}</span><span>🇨🇳</span></div>
        </div>
        <div class="hm-tile" style="background:linear-gradient(145deg,#090918,#0d0d1e)">
          <div class="hm-badge" style="background:rgba(136,153,187,.1);border-color:rgba(136,153,187,.28);color:#8899bb">NEUTRAL · 74%</div>
          <div class="hm-foot"><span>${t('youHarare')}</span><span>🇿🇼</span></div>
        </div>
        <div class="hm-sidebar">
          <div class="hm-bar-group">
            <div style="font-size:8px;font-family:'DM Mono',monospace;color:rgba(255,255,255,.3);margin-bottom:6px;letter-spacing:.08em;text-transform:uppercase">${t('liveInsights')}</div>
            <div class="hm-bar-row"><div class="hm-bar-lbl"><span style="color:#3dffa0">Happiness</span><span style="color:#3dffa0">87%</span></div><div class="hm-bar-track"><div class="hm-bar-fill" style="width:87%;background:var(--green)"></div></div></div>
            <div class="hm-bar-row"><div class="hm-bar-lbl"><span style="color:#8899bb">Neutral</span><span>7%</span></div><div class="hm-bar-track"><div class="hm-bar-fill" style="width:7%;background:#8899bb"></div></div></div>
            <div class="hm-bar-row" style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.05)">
              <div style="font-size:7px;color:var(--green);font-weight:700">${t('faceSavingDet')}</div>
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
    <div class="section-label">${t('problemLabel')}</div>
    <h2 class="section-title">${t('problemTitle1')}<br><em>${t('problemTitle2')}</em></h2>
    <p class="section-body">${t('problemBody')}</p>
  </div>
  <div class="bias-cards reveal">
    <div class="bias-card bc-bad">
      <div class="bc-tag">FER-2013</div>
      <div class="bc-title">${t('westernDominantTitle')}</div>
      <div class="bc-body">${t('westernDominantBody')}</div>
      <div class="bc-stat">~50%</div>
      <div class="bc-stat-lbl">${t('africanEastAsianAcc')}</div>
    </div>
    <div class="bias-card bc-bad">
      <div class="bc-tag">AffectNet</div>
      <div class="bc-title">${t('darkSkinUnderrepTitle')}</div>
      <div class="bc-body">${t('darkSkinUnderrepBody')}</div>
      <div class="bc-stat">2%</div>
      <div class="bc-stat-lbl">${t('darkSkinRep')}</div>
    </div>
    <div class="bias-card bc-good">
      <div class="bc-tag">EmoSense</div>
      <div class="bc-title">${t('builtZwCnTitle')}</div>
      <div class="bc-body">${t('builtZwCnBody')}</div>
      <div class="bc-stat">87.3%</div>
      <div class="bc-stat-lbl">${t('crossCulturalAccAchieved')}</div>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<div class="divider"></div>
<section class="section" id="how">
  <div class="reveal">
    <div class="section-label">${t('howLabel')}</div>
    <h2 class="section-title">${t('howTitle')}</h2>
  </div>
  <div class="how-grid reveal">
    <div class="steps">
      <div class="step">
        <div class="step-num">01</div>
        <div class="step-body">
          <div class="step-title">${t('howStep1Title')}</div>
          <div class="step-desc">${t('howStep1Desc')}</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num">02</div>
        <div class="step-body">
          <div class="step-title">${t('howStep2Title')}</div>
          <div class="step-desc">${t('howStep2Desc')}</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num">03</div>
        <div class="step-body">
          <div class="step-title">${t('howStep3Title')}</div>
          <div class="step-desc">${t('howStep3Desc')}</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num">04</div>
        <div class="step-body">
          <div class="step-title">${t('howStep4Title')}</div>
          <div class="step-desc">${t('howStep4Desc')}</div>
        </div>
      </div>
    </div>
    <div class="pipeline">
      <div class="pl-label">${t('pipelineLabel')}</div>
      <div class="pl-row"><div class="pl-box">${t('pipelineFrame')}</div><div class="pl-arrow">→</div><div class="pl-box active">${t('pipelineDetect')}</div></div>
      <div class="pl-arrow" style="margin-left:12px;font-size:12px;color:var(--dim)">↓</div>
      <div class="pl-row"><div class="pl-box active">${t('pipelineLandmarks')}</div></div>
      <div class="pl-arrow" style="margin-left:12px;font-size:12px;color:var(--dim)">↓</div>
      <div class="pl-row"><div class="pl-box active">${t('pipelineCNN')}</div><div class="pl-arrow">→</div><div class="pl-box active">${t('pipelineContext')}</div></div>
      <div class="pl-arrow" style="margin-left:12px;font-size:12px;color:var(--dim)">↓</div>
      <div class="pl-row"><div class="pl-box active">${t('pipelineCoach')}</div></div>
      <div class="pl-arrow" style="margin-left:12px;font-size:12px;color:var(--dim)">↓</div>
      <div class="pl-row"><div class="pl-box active">${t('pipelineAnalytics')}</div></div>
    </div>
  </div>
</section>

<!-- ACCURACY -->
<section class="accuracy-section" id="accuracy">
  <div class="acc-grid">
    <div class="reveal">
      <div class="section-label">${t('accLabel')}</div>
      <h2 class="section-title" style="font-size:clamp(28px,3vw,44px)">${t('accTitle')}</h2>
      <p class="section-body" style="font-size:15px;margin-top:16px">${t('accBody')}</p>
      <p class="acc-note" style="margin-top:16px">${t('accNote')}</p>
    </div>
    <div class="acc-bars reveal">
      <div style="font-size:10px;font-family:var(--mono);color:var(--dim);letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px">${t('accPopHeader')}</div>
      <div class="acc-bar-row">
        <div class="acc-bar-head"><span class="acc-bar-name">${t('accName1')}</span><span class="acc-bar-pct" style="color:var(--green)">88.1%</span></div>
        <div class="acc-bar-track"><div class="acc-bar-fill" style="width:88%;background:var(--green)"></div></div>
      </div>
      <div class="acc-bar-row">
        <div class="acc-bar-head"><span class="acc-bar-name">${t('accName2')}</span><span class="acc-bar-pct" style="color:var(--green)">86.5%</span></div>
        <div class="acc-bar-track"><div class="acc-bar-fill" style="width:86%;background:var(--green)"></div></div>
      </div>
      <div class="acc-bar-row">
        <div class="acc-bar-head"><span class="acc-bar-name">${t('accName3')}</span><span class="acc-bar-pct" style="color:var(--green)">87.3%</span></div>
        <div class="acc-bar-track"><div class="acc-bar-fill" style="width:87%;background:var(--green)"></div></div>
      </div>
      <div class="acc-bar-row" style="margin-top:16px;padding-top:16px;border-top:.5px solid var(--bd)">
        <div class="acc-bar-head"><span class="acc-bar-name" style="color:var(--muted)">${t('accName4')}</span><span class="acc-bar-pct" style="color:var(--muted)">~87%</span></div>
        <div class="acc-bar-track"><div class="acc-bar-fill" style="width:87%;background:var(--slate)"></div></div>
      </div>
      <div class="acc-bar-row">
        <div class="acc-bar-head"><span class="acc-bar-name" style="color:var(--red)">${t('accName5')}</span><span class="acc-bar-pct" style="color:var(--red)">~50%</span></div>
        <div class="acc-bar-track"><div class="acc-bar-fill" style="width:50%;background:var(--red)"></div></div>
      </div>
    </div>
  </div>
</section>

<!-- DATASETS -->
<div class="divider"></div>
<section class="section" id="datasets">
  <div class="reveal">
    <div class="section-label">${t('dsLabel')}</div>
    <h2 class="section-title">${t('dsTitle')}</h2>
    <p class="section-body">${t('dsBody')}</p>
  </div>
  <div class="ds-grid reveal">
    <div class="ds-card"><div class="ds-card-tag tag-bias">${t('dsTagBiased')}</div><div class="ds-name">FER-2013</div><div class="ds-desc">${t('dsDesc1')}</div></div>
    <div class="ds-card"><div class="ds-card-tag tag-bias">${t('dsTagBiased')}</div><div class="ds-name">AffectNet</div><div class="ds-desc">${t('dsDesc2')}</div></div>
    <div class="ds-card"><div class="ds-card-tag tag-chinese">${t('dsTagChinese')}</div><div class="ds-name">CAFPS</div><div class="ds-desc">${t('dsDesc3')}</div></div>
    <div class="ds-card" style="grid-column:span 1;border-color:rgba(61,255,160,.2);background:rgba(61,255,160,.03)">
      <div class="ds-card-tag tag-own">${t('dsTagOwn')}</div>
      <div class="ds-name">${t('dsName4')}</div>
      <div class="ds-desc">${t('dsDesc4')}</div>
    </div>
  </div>
</section>

<!-- USE CASES -->
<div class="divider"></div>
<section class="section">
  <div class="reveal">
    <div class="section-label">${t('appLabel')}</div>
    <h2 class="section-title">${t('appTitle')}</h2>
  </div>
  <div class="use-grid reveal">
    <div class="use-card">
      <div class="use-icon"><svg viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="12" height="9" rx="2" stroke="#3dffa0" stroke-width="1.3"/><path d="M14 9l4-2v6l-4-2V9Z" stroke="#3dffa0" stroke-width="1.3" stroke-linejoin="round"/></svg></div>
      <div class="use-title">${t('appCard1Title')}</div>
      <div class="use-desc">${t('appCard1Desc')}</div>
    </div>
    <div class="use-card">
      <div class="use-icon"><svg viewBox="0 0 20 20" fill="none"><path d="M10 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM4 18c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="#5b9cf6" stroke-width="1.3" stroke-linecap="round"/></svg></div>
      <div class="use-title">${t('appCard2Title')}</div>
      <div class="use-desc">${t('appCard2Desc')}</div>
    </div>
    <div class="use-card">
      <div class="use-icon"><svg viewBox="0 0 20 20" fill="none"><path d="M3 10h14M10 3v14" stroke="#ffb347" stroke-width="1.3" stroke-linecap="round"/><circle cx="10" cy="10" r="8" stroke="#ffb347" stroke-width="1.3"/></svg></div>
      <div class="use-title">${t('appCard3Title')}</div>
      <div class="use-desc">${t('appCard3Desc')}</div>
    </div>
  </div>
</section>

<!-- ROADMAP -->
<div class="divider"></div>
<section class="section" id="roadmap">
  <div class="reveal">
    <div class="section-label">${t('roadmapLabel')}</div>
    <h2 class="section-title">${t('roadmapTitle')}</h2>
  </div>
  <div style="max-width:600px;margin-top:40px" class="reveal">
    <div class="roadmap">
      <div class="rm-item">
        <div class="rm-track"><div class="rm-dot done"></div><div class="rm-line"></div></div>
        <div class="rm-body"><div class="rm-phase">${t('roadmapPhase1')}</div><div class="rm-title">${t('roadmapPhase1Title')}</div><div class="rm-desc">${t('roadmapPhase1Desc')}</div></div>
      </div>
      <div class="rm-item">
        <div class="rm-track"><div class="rm-dot done"></div><div class="rm-line"></div></div>
        <div class="rm-body"><div class="rm-phase">${t('roadmapPhase2')}</div><div class="rm-title">${t('roadmapPhase2Title')}</div><div class="rm-desc">${t('roadmapPhase2Desc')}</div></div>
      </div>
      <div class="rm-item">
        <div class="rm-track"><div class="rm-dot done"></div><div class="rm-line"></div></div>
        <div class="rm-body"><div class="rm-phase">${t('roadmapPhase3')}</div><div class="rm-title">${t('roadmapPhase3Title')}</div><div class="rm-desc">${t('roadmapPhase3Desc')}</div></div>
      </div>
      <div class="rm-item">
        <div class="rm-track"><div class="rm-dot next"></div><div class="rm-line"></div></div>
        <div class="rm-body"><div class="rm-phase">${t('roadmapPhase4')}</div><div class="rm-title">${t('roadmapPhase4Title')}</div><div class="rm-desc">${t('roadmapPhase4Desc')}</div></div>
      </div>
      <div class="rm-item">
        <div class="rm-track"><div class="rm-dot future"></div><div class="rm-line"></div></div>
        <div class="rm-body"><div class="rm-phase">${t('roadmapPhase5')}</div><div class="rm-title">${t('roadmapPhase5Title')}</div><div class="rm-desc">${t('roadmapPhase5Desc')}</div></div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<div class="divider"></div>
<section class="cta-section">
  <h2 class="cta-title reveal">${t('ctaTitle')}</h2>
  <p class="cta-sub reveal">${t('ctaSub')}</p>
  <div class="cta-actions reveal">
    <a class="btn-primary" href="launch">
      <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><rect x="1" y="4" width="10" height="8" rx="2" fill="white"/><path d="M11 7l4-2v6l-4-2V7Z" fill="white"/></svg>
      ${t('ctaBtn')}
    </a>
    <a class="btn-secondary" href="#datasets">${t('seeResearch')}</a>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-logo">EmoSense</div>
  <div class="footer-copy">${t('footerCopy')}</div>
  <div class="footer-links">
    <a href="#problem">${t('footerResearch')}</a>
    <a href="#datasets">${t('footerDatasets')}</a>
    <a href="launch">${t('footerApp')}</a>
  </div>
</footer>`;

export default function Landing({ onLaunch }) {
  const containerRef = useRef(null);
  const { lang, t } = useLang();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      obs.disconnect();
      barObs.disconnect();
    };
  }, [lang]);

  const switcherTarget = mounted ? containerRef.current?.querySelector('#landing-lang-switcher') : null;

  return (
    <>
      <div
        className="landing-page"
        ref={containerRef}
        style={{ overflowY: 'auto', height: '100svh', width: '100%' }}
        dangerouslySetInnerHTML={{ __html: getHtmlContent(t) }}
      />
      {switcherTarget && createPortal(<LangSwitcher />, switcherTarget)}
    </>
  );
}
