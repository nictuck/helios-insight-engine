/**
 * HELIOS NEBULA — Standalone Parallax Canvas
 * ─────────────────────────────────────────────────────────────
 * Usage:
 *   1. Add <canvas id="helios-nebula" aria-hidden="true"></canvas> to your HTML
 *   2. CSS: #helios-nebula { position:fixed; inset:0; z-index:0; pointer-events:none; display:block; width:100vw; height:100vh; }
 *   3. <script src="/nebula.js"></script>
 *
 * Section keying (optional):
 *   Call window.HeliosNebula.setScene('home' | 'services' | 'team' | 'contact')
 *   to crossfade to a different color palette over 1.6s.
 *
 * Theme switching:
 *   Call window.HeliosNebula.setTheme('light' | 'dark')
 *   to crossfade to the matching palette set.
 *
 * Mouse parallax:
 *   Enabled by default. Each cloud layer moves at a different depth.
 *   Set PARALLAX_STRENGTH = 0 to disable.
 */

(function() {
  'use strict';

  /* ── CONFIG ──────────────────────────────────────────────── */
  const CANVAS_ID       = 'helios-nebula';
  const TRANSITION_MS   = 1600;        // scene crossfade duration
  const PARALLAX_STRENGTH = 1.0;       // multiplier; 0 = off, 2 = double
  const MOUSE_SMOOTHING = 0.06;        // 0 = instant, 0.02 = very laggy
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let PARALLAX_ACTIVE = !prefersReducedMotion;

  /* ── CLOUD POSITIONS ─────────────────────────────────────── */
  // Each cloud: normalized position (0–1), size (fraction of viewport),
  // slow organic drift, and parallax factors (how much it shifts with mouse)
  const POSITIONS = [
    { x:0.72, y:0.38, rx:0.65, ry:0.48, drift:[ 0.00008,  0.00005], px: 0.04, py: 0.03 },
    { x:0.55, y:0.60, rx:0.55, ry:0.40, drift:[-0.00006,  0.00007], px:-0.06, py: 0.05 },
    { x:0.30, y:0.45, rx:0.50, ry:0.35, drift:[ 0.00005, -0.00006], px: 0.07, py:-0.04 },
    { x:0.65, y:0.22, rx:0.42, ry:0.28, drift:[-0.00004,  0.00008], px:-0.09, py: 0.07 },
    { x:0.42, y:0.72, rx:0.45, ry:0.30, drift:[ 0.00007, -0.00004], px: 0.10, py:-0.06 },
    { x:0.82, y:0.62, rx:0.38, ry:0.42, drift:[-0.00005,  0.00006], px:-0.08, py: 0.09 },
    { x:0.18, y:0.22, rx:0.35, ry:0.26, drift:[ 0.00006,  0.00005], px: 0.12, py: 0.08 },
    { x:0.88, y:0.30, rx:0.28, ry:0.32, drift:[ 0.00004, -0.00005], px:-0.14, py:-0.10 },
    { x:0.12, y:0.68, rx:0.32, ry:0.22, drift:[-0.00003,  0.00006], px: 0.16, py: 0.12 },
    { x:0.50, y:0.50, rx:1.00, ry:0.85, drift:[ 0.00002,  0.00002], px: 0.01, py: 0.01 }, // bg wash
  ];

  /* ── SCENE PALETTES ──────────────────────────────────────── */
  const SCENE_PALETTES = {
    light: {
      home:     { bg:[250,248,243], clouds:[
        {color:[90,175,168],  alpha:0.42},{color:[170,130,115],alpha:0.18},
        {color:[130,195,210], alpha:0.38},{color:[195,150,70], alpha:0.18},
        {color:[175,115,90],  alpha:0.14},{color:[110,188,178],alpha:0.30},
        {color:[210,185,145], alpha:0.16},{color:[150,210,200],alpha:0.26},
        {color:[175,135,115], alpha:0.12},{color:[145,205,200],alpha:0.18},
      ]},
      services: { bg:[252,247,238], clouds:[
        {color:[130,180,172],alpha:0.18},{color:[210,145,110],alpha:0.40},
        {color:[150,190,195],alpha:0.16},{color:[225,165,60], alpha:0.42},
        {color:[215,130,95], alpha:0.34},{color:[125,178,165],alpha:0.14},
        {color:[235,195,130],alpha:0.30},{color:[145,185,175],alpha:0.14},
        {color:[220,145,105],alpha:0.26},{color:[210,180,130],alpha:0.18},
      ]},
      team:     { bg:[252,246,244], clouds:[
        {color:[195,145,130],alpha:0.38},{color:[210,140,115],alpha:0.42},
        {color:[145,185,190],alpha:0.16},{color:[210,155,90], alpha:0.24},
        {color:[215,130,105],alpha:0.38},{color:[120,175,168],alpha:0.12},
        {color:[225,175,145],alpha:0.30},{color:[140,182,178],alpha:0.12},
        {color:[205,145,125],alpha:0.28},{color:[210,170,155],alpha:0.18},
      ]},
      contact:  { bg:[246,248,252], clouds:[
        {color:[115,170,195],alpha:0.38},{color:[155,135,125],alpha:0.18},
        {color:[120,185,205],alpha:0.42},{color:[190,145,70], alpha:0.16},
        {color:[165,120,105],alpha:0.14},{color:[100,175,188],alpha:0.34},
        {color:[195,178,158],alpha:0.16},{color:[130,195,210],alpha:0.28},
        {color:[150,118,108],alpha:0.10},{color:[140,200,210],alpha:0.18},
      ]},
    },
    dark: {
      home:     { bg:[8,9,15], clouds:[
        {color:[40,90,110],  alpha:0.14},{color:[70,45,60],   alpha:0.08},
        {color:[30,70,95],   alpha:0.12},{color:[100,75,30],  alpha:0.08},
        {color:[65,40,30],   alpha:0.06},{color:[45,95,105],  alpha:0.10},
        {color:[110,85,45],  alpha:0.08},{color:[35,85,100],  alpha:0.10},
        {color:[70,50,45],   alpha:0.06},{color:[40,75,90],   alpha:0.06},
      ]},
      services: { bg:[8,9,15], clouds:[
        {color:[55,80,90],   alpha:0.08},{color:[120,70,35],  alpha:0.16},
        {color:[60,85,95],   alpha:0.06},{color:[140,95,30],  alpha:0.18},
        {color:[125,55,35],  alpha:0.14},{color:[50,85,80],   alpha:0.06},
        {color:[155,110,55], alpha:0.12},{color:[55,80,75],   alpha:0.06},
        {color:[130,60,40],  alpha:0.10},{color:[120,95,55],  alpha:0.08},
      ]},
      team:     { bg:[13,14,24], clouds:[
        {color:[105,60,65],  alpha:0.14},{color:[115,55,45],  alpha:0.16},
        {color:[60,80,85],   alpha:0.06},{color:[120,75,35],  alpha:0.10},
        {color:[125,55,50],  alpha:0.14},{color:[50,80,75],   alpha:0.06},
        {color:[135,90,65],  alpha:0.12},{color:[55,75,75],   alpha:0.06},
        {color:[110,60,55],  alpha:0.10},{color:[115,80,70],  alpha:0.08},
      ]},
      contact:  { bg:[8,9,15], clouds:[
        {color:[40,75,95],   alpha:0.14},{color:[60,55,65],   alpha:0.08},
        {color:[45,85,105],  alpha:0.16},{color:[90,70,30],   alpha:0.06},
        {color:[65,50,45],   alpha:0.06},{color:[35,80,95],   alpha:0.12},
        {color:[90,85,70],   alpha:0.06},{color:[50,95,110],  alpha:0.10},
        {color:[55,45,45],   alpha:0.06},{color:[50,90,105],  alpha:0.08},
      ]},
    },
  };

  /* ── THEME / SCENE STATE ─────────────────────────────────── */
  let currentTheme = (document.documentElement.getAttribute('data-theme') || 'light');
  let currentSceneName = 'home';

  /* ── INIT ────────────────────────────────────────────────── */
  const canvas = document.getElementById(CANVAS_ID);
  if (!canvas) { console.warn('[HeliosNebula] canvas#' + CANVAS_ID + ' not found'); return; }
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  /* ── MOUSE PARALLAX ──────────────────────────────────────── */
  let mouseX = 0.5, mouseY = 0.5;
  let smoothX = 0.5, smoothY = 0.5;
  window.addEventListener('mousemove', function(e) {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  });

  /* ── LIVE CLOUD STATE ────────────────────────────────────── */
  const liveClouds = POSITIONS.map(function(pos, i) {
    return Object.assign({}, pos, {
      color: SCENE_PALETTES[currentTheme].home.clouds[i].color.slice(),
      alpha: SCENE_PALETTES[currentTheme].home.clouds[i].alpha,
    });
  });
  let liveBg = SCENE_PALETTES[currentTheme].home.bg.slice();

  /* ── SCENE TRANSITION ────────────────────────────────────── */
  let fromSnap = {
    clouds: SCENE_PALETTES[currentTheme].home.clouds.map(function(c) {
      return { color: c.color.slice(), alpha: c.alpha };
    }),
    bg: SCENE_PALETTES[currentTheme].home.bg.slice()
  };
  let toSceneName = 'home', transitioning = false, transStart = null;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

  function setScene(name) {
    if (!SCENE_PALETTES[currentTheme][name]) { console.warn('[HeliosNebula] unknown scene:', name); return; }
    if (name === toSceneName) return;
    currentSceneName = name;
    fromSnap = {
      clouds: liveClouds.map(function(c) { return { color: c.color.slice(), alpha: c.alpha }; }),
      bg: liveBg.slice()
    };
    toSceneName = name; transStart = null; transitioning = true;
  }

  function setTheme(theme) {
    if (theme === currentTheme) return;
    currentTheme = theme;
    // Force a transition to the same scene in the new theme palette.
    // We can't reuse setScene() because it short-circuits when the scene
    // name hasn't changed — directly initiate the transition instead.
    fromSnap = {
      clouds: liveClouds.map(function(c) { return { color: c.color.slice(), alpha: c.alpha }; }),
      bg: liveBg.slice()
    };
    toSceneName = currentSceneName;
    transStart = null;
    transitioning = true;
  }

  function updateTransition(ts) {
    if (!transitioning) return;
    if (!transStart) transStart = ts;
    const raw = Math.min((ts - transStart) / TRANSITION_MS, 1);
    const t   = ease(raw);
    const to  = SCENE_PALETTES[currentTheme][toSceneName];
    liveClouds.forEach(function(c, i) {
      c.color[0] = lerp(fromSnap.clouds[i].color[0], to.clouds[i].color[0], t);
      c.color[1] = lerp(fromSnap.clouds[i].color[1], to.clouds[i].color[1], t);
      c.color[2] = lerp(fromSnap.clouds[i].color[2], to.clouds[i].color[2], t);
      c.alpha    = lerp(fromSnap.clouds[i].alpha,     to.clouds[i].alpha,    t);
    });
    liveBg[0] = lerp(fromSnap.bg[0], to.bg[0], t);
    liveBg[1] = lerp(fromSnap.bg[1], to.bg[1], t);
    liveBg[2] = lerp(fromSnap.bg[2], to.bg[2], t);
    if (raw >= 1) transitioning = false;
  }

  /* ── DRAW HELPERS ────────────────────────────────────────── */
  function drawCloud(c, w, h, time, sx, sy) {
    const driftX = Math.sin(time * c.drift[0] * 1000) * 0.04;
    const driftY = Math.cos(time * c.drift[1] * 1000) * 0.04;
    const cx = (c.x + driftX + sx * c.px * PARALLAX_STRENGTH) * w;
    const cy = (c.y + driftY + sy * c.py * PARALLAX_STRENGTH) * h;
    const rx = c.rx * w, ry = c.ry * h, maxR = Math.max(rx, ry);
    const r = c.color[0], g = c.color[1], b = c.color[2];
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    grad.addColorStop(0,    'rgba(' + (r|0) + ',' + (g|0) + ',' + (b|0) + ',' + c.alpha + ')');
    grad.addColorStop(0.45, 'rgba(' + (r|0) + ',' + (g|0) + ',' + (b|0) + ',' + (c.alpha * 0.55) + ')');
    grad.addColorStop(1,    'rgba(' + (r|0) + ',' + (g|0) + ',' + (b|0) + ',0)');
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(rx / maxR, ry / maxR); ctx.translate(-cx, -cy);
    ctx.beginPath(); ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
    ctx.fillStyle = grad; ctx.fill(); ctx.restore();
  }

  /* ── RENDER LOOP ─────────────────────────────────────────── */
  function draw(ts) {
    if (PARALLAX_ACTIVE) {
      smoothX += (mouseX - smoothX) * MOUSE_SMOOTHING;
      smoothY += (mouseY - smoothY) * MOUSE_SMOOTHING;
    }
    const sx = smoothX - 0.5;
    const sy = smoothY - 0.5;
    const t  = ts / 1000;

    updateTransition(ts);
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = 'rgb(' + (liveBg[0]|0) + ',' + (liveBg[1]|0) + ',' + (liveBg[2]|0) + ')';
    ctx.fillRect(0, 0, w, h);
    liveClouds.forEach(function(c) { drawCloud(c, w, h, t, sx, sy); });
    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  /* ── PUBLIC API ──────────────────────────────────────────── */
  window.HeliosNebula = { setScene: setScene, setTheme: setTheme };

})();
