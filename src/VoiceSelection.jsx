import { useState, useEffect } from "react";

/* ------------------------------------------------------------------
 * Topographic contour generator for the Terrain tile visual.
 *
 * Defines a synthetic elevation field (sum of 2D Gaussians forming
 * peaks and a soft ridge connector), samples it on a regular grid,
 * and runs marching squares at evenly-spaced threshold values to
 * extract real isolines. The result is a proper contour map that
 * obeys topographic conventions: lines never cross, closed loops
 * surround peaks, lines bunch where the gradient is steep.
 * ------------------------------------------------------------------ */

// Catmull-Rom-to-Bezier — smooth path through ordered points
function smoothPath(points, closed) {
  if (points.length < 2) return "";
  const n = points.length;
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const p0 = points[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[closed ? (i + 1) % n : i + 1];
    const p3 = points[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d + (closed ? " Z" : "");
}

// Anisotropic 2D Gaussian
function gauss(x, y, cx, cy, sx, sy, amp) {
  const dx = (x - cx) / sx;
  const dy = (y - cy) / sy;
  return amp * Math.exp(-0.5 * (dx * dx + dy * dy));
}

// Elevation field over the 300×200 viewBox.
// Three principal peaks roughly arranged along a lower-left → upper-right
// ridge, plus a soft Gaussian "ridge backbone" connecting them, plus
// a small foothill on the lower-left edge for variety.
function elevation(x, y) {
  return (
    // Main summit (largest, slightly off-center)
    gauss(x, y, 175, 92, 30, 34, 9.6) +
    // Secondary summit, lower-right of main
    gauss(x, y, 232, 138, 26, 24, 6.5) +
    // Far ridge bump, upper-right
    gauss(x, y, 262, 50, 18, 18, 4.2) +
    // Foothill, lower-left
    gauss(x, y, 70, 162, 24, 22, 3.4) +
    // Small saddle ridge, between the two main peaks
    gauss(x, y, 205, 118, 14, 12, 2.0) +
    // Soft ridge backbone along diagonal (lower-left → upper-right)
    2.4 * Math.exp(-Math.pow((0.46 * x + 0.52 * y - 122) / 26, 2) / 2) -
    0.6 // baseline so outer contours appear
  );
}

// Marching squares over the precomputed FIELD at a given threshold.
// Returns an array of polylines (each polyline is an array of {x, y}
// in grid-cell coordinates).
function marchingSquares(field, threshold, w, h) {
  const segsByKey = new Map();
  const allSegs = [];
  const fmt = (p) => `${p.x.toFixed(5)},${p.y.toFixed(5)}`;

  function addSeg(a, b) {
    const seg = { a, b, used: false };
    allSegs.push(seg);
    const ka = fmt(a), kb = fmt(b);
    if (!segsByKey.has(ka)) segsByKey.set(ka, []);
    if (!segsByKey.has(kb)) segsByKey.set(kb, []);
    segsByKey.get(ka).push(seg);
    segsByKey.get(kb).push(seg);
  }

  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const v0 = field[j][i];           // top-left
      const v1 = field[j][i + 1];       // top-right
      const v2 = field[j + 1][i + 1];   // bottom-right
      const v3 = field[j + 1][i];       // bottom-left
      const idx =
        ((v0 >= threshold) ? 8 : 0) |
        ((v1 >= threshold) ? 4 : 0) |
        ((v2 >= threshold) ? 2 : 0) |
        ((v3 >= threshold) ? 1 : 0);
      if (idx === 0 || idx === 15) continue;

      // Linear-interpolate edge crossings
      const T = { x: i + (threshold - v0) / (v1 - v0), y: j };
      const R = { x: i + 1, y: j + (threshold - v1) / (v2 - v1) };
      const B = { x: i + (threshold - v3) / (v2 - v3), y: j + 1 };
      const L = { x: i, y: j + (threshold - v0) / (v3 - v0) };

      switch (idx) {
        case 1: case 14: addSeg(L, B); break;
        case 2: case 13: addSeg(B, R); break;
        case 3: case 12: addSeg(L, R); break;
        case 4: case 11: addSeg(T, R); break;
        case 5: addSeg(L, T); addSeg(B, R); break;
        case 6: case 9:  addSeg(T, B); break;
        case 7: case 8:  addSeg(L, T); break;
        case 10: addSeg(T, R); addSeg(L, B); break;
        default: break;
      }
    }
  }

  // Chain shared-endpoint segments into long polylines
  const polylines = [];
  for (const seed of allSegs) {
    if (seed.used) continue;
    seed.used = true;
    const line = [seed.a, seed.b];

    // Extend forward from current tail
    while (true) {
      const tail = line[line.length - 1];
      const candidates = segsByKey.get(fmt(tail)) || [];
      const next = candidates.find((s) => !s.used);
      if (!next) break;
      next.used = true;
      const other = (Math.abs(next.a.x - tail.x) < 1e-7 && Math.abs(next.a.y - tail.y) < 1e-7) ? next.b : next.a;
      line.push(other);
    }
    // Extend backward from current head
    while (true) {
      const head = line[0];
      const candidates = segsByKey.get(fmt(head)) || [];
      const next = candidates.find((s) => !s.used);
      if (!next) break;
      next.used = true;
      const other = (Math.abs(next.a.x - head.x) < 1e-7 && Math.abs(next.a.y - head.y) < 1e-7) ? next.b : next.a;
      line.unshift(other);
    }

    polylines.push(line);
  }
  return polylines;
}

function buildContourField() {
  const VB_W = 300, VB_H = 200;
  const GRID_W = 150, GRID_H = 100;
  const CELL_X = VB_W / GRID_W;
  const CELL_Y = VB_H / GRID_H;

  // Sample the elevation function on a (GRID_W+1) × (GRID_H+1) lattice
  const field = [];
  let minV = Infinity, maxV = -Infinity;
  for (let j = 0; j <= GRID_H; j++) {
    const row = new Float32Array(GRID_W + 1);
    for (let i = 0; i <= GRID_W; i++) {
      const v = elevation(i * CELL_X, j * CELL_Y);
      row[i] = v;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    field.push(row);
  }

  // Choose contour interval — roughly 18 levels across the value range
  const STEP = 0.6;
  const out = [];
  // Index every 4th level
  const startLevel = Math.ceil(minV / STEP) * STEP;
  let levelIdx = 0;
  for (let v = startLevel; v <= maxV; v += STEP) {
    const polylines = marchingSquares(field, v, GRID_W, GRID_H);
    const isIndex = levelIdx % 4 === 0;
    for (const line of polylines) {
      if (line.length < 3) continue; // skip tiny scraps
      // Detect closure
      const head = line[0];
      const tail = line[line.length - 1];
      const closed = Math.abs(head.x - tail.x) < 1e-6 && Math.abs(head.y - tail.y) < 1e-6;
      // Map grid coords → viewBox coords
      const pts = (closed ? line.slice(0, -1) : line).map((p) => ({
        x: p.x * CELL_X,
        y: p.y * CELL_Y,
      }));
      out.push({
        d: smoothPath(pts, closed),
        isIndex,
        depth: (v - minV) / (maxV - minV),
      });
    }
    levelIdx++;
  }
  return out;
}

const TOPO_CONTOURS = buildContourField();

/**
 * Voice selection screen — appears between landing and assessment.
 * Users pick between Terrain (grounded-coach) and Horizon (systems-observer).
 *
 * Clicking a voice card both selects it AND advances to the assessment —
 * there is no separate "Begin assessment" button. The skip link below
 * the cards lets users defer the choice and let Helios pick the default.
 */
export default function VoiceSelection({ value, onChange, onContinue, onSkip, fadeIn }) {
  const [hovered, setHovered] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const voices = [
    {
      id: "grounded-coach",
      name: "Terrain",
      cue: "Let's start with what's actually here.",
    },
    {
      id: "systems-observer",
      name: "Horizon",
      cue: "I want to see what this pattern is doing.",
    },
  ];

  const choose = (id) => {
    onChange(id);
    onContinue();
  };

  const handleKey = (e, id) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      choose(id);
    }
  };

  const styles = {
    wrap: {
      opacity: fadeIn ? 1 : 0,
      transition: "opacity 0.8s ease",
      transitionDelay: "0.1s",
    },
    framing: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: "clamp(1.3rem, 3.5vw, 1.8rem)",
      fontWeight: 300,
      lineHeight: 1.35,
      color: "var(--text)",
      marginBottom: isMobile ? 24 : 36,
      textAlign: "center",
      letterSpacing: "-0.01em",
      maxWidth: 520,
      marginLeft: "auto",
      marginRight: "auto",
    },
    cards: {
      display: "flex",
      flexDirection: "row",
      gap: isMobile ? 10 : 20,
      marginBottom: isMobile ? 24 : 32,
    },
    card: (selected, isHover) => ({
      flex: 1,
      minWidth: 0,
      background: selected
        ? "var(--glass-card-hover)"
        : isHover
          ? "var(--glass-card-hover)"
          : "var(--glass-card)",
      border: selected
        ? "1px solid var(--border-strong)"
        : isHover
          ? "1px solid var(--border-mid)"
          : "1px solid var(--border-subtle)",
      borderRadius: 4,
      padding: 0,
      cursor: "pointer",
      textAlign: "center",
      fontFamily: "'Jost', sans-serif",
      color: "var(--text)",
      transition: reducedMotion ? "none" : "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
      boxShadow: selected ? "0 0 40px rgba(201,168,76,0.10)" : "none",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      outline: "none",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    }),
    visual: {
      width: "100%",
      aspectRatio: "3 / 2",
      position: "relative",
      overflow: "hidden",
    },
    terrainVisual: {
      width: "100%",
      height: "100%",
      background:
        "radial-gradient(ellipse 110% 80% at 35% 40%, #4A2C16 0%, #2E1A0C 60%, #150A04 100%)",
      position: "relative",
      overflow: "hidden",
    },
    terrainGlow: {
      // Subtle warm light pooling along the ridge band
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 65% 60%, rgba(255,200,120,0.10) 0%, transparent 55%)",
      mixBlendMode: "screen",
      pointerEvents: "none",
    },
    horizonVisual: {
      width: "100%",
      height: "100%",
      background:
        "linear-gradient(180deg, #1B1F3A 0%, #2E3358 35%, #4A4A78 58%, #6B5A6E 62%, #8B6F5C 65%, #C99A6E 68%, #6B5A6E 72%, #2A2638 100%)",
      position: "relative",
    },
    horizonLine: {
      position: "absolute",
      left: 0,
      right: 0,
      top: "65%",
      height: 1,
      background:
        "linear-gradient(90deg, transparent 0%, rgba(237,232,220,0.4) 50%, transparent 100%)",
    },
    cardBody: {
      padding: isMobile ? "16px 12px 18px" : "26px 24px 28px",
      textAlign: "center",
    },
    name: {
      fontSize: isMobile ? "1.3rem" : "1.9rem",
      fontWeight: 400,
      fontFamily: "'Cormorant Garamond', serif",
      color: "var(--text)",
      marginBottom: isMobile ? 6 : 12,
      letterSpacing: "-0.01em",
      textAlign: "center",
    },
    cue: {
      fontSize: isMobile ? "0.78rem" : "1.05rem",
      lineHeight: 1.45,
      color: "var(--text-dim)",
      fontStyle: "italic",
      fontFamily: "'Cormorant Garamond', serif",
      margin: 0,
      fontWeight: 400,
      textAlign: "center",
    },
    btnWrap: {
      textAlign: "center",
    },
    skip: {
      display: "block",
      margin: "8px auto 0",
      background: "none",
      border: "none",
      color: "var(--muted)",
      fontSize: 12,
      fontFamily: "'Jost', sans-serif",
      letterSpacing: "0.12em",
      cursor: "pointer",
      padding: "8px 12px",
      textDecoration: "underline",
      textUnderlineOffset: 3,
      textDecorationColor: "var(--border-default)",
    },
  };

  return (
    <div style={styles.wrap}>
      <h1 style={styles.framing}>
        Helios reflections come in two voices. <em style={{ fontStyle: "italic", color: "var(--gold-light)" }}>Choose who reads your results.</em>
      </h1>

      <div
        role="radiogroup"
        aria-label="Choose a voice"
        style={styles.cards}
      >
        {voices.map((v) => {
          const selected = value === v.id;
          const isHover = hovered === v.id;
          return (
            <div
              key={v.id}
              role="radio"
              aria-checked={selected}
              tabIndex={0}
              onClick={() => choose(v.id)}
              onKeyDown={(e) => handleKey(e, v.id)}
              onMouseEnter={() => setHovered(v.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(v.id)}
              onBlur={() => setHovered(null)}
              style={styles.card(selected, isHover)}
            >
              <div style={styles.visual} aria-hidden="true">
                {v.id === "grounded-coach" ? (
                  <div style={styles.terrainVisual}>
                    <svg
                      viewBox="0 0 300 200"
                      preserveAspectRatio="xMidYMid slice"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                      aria-hidden="true"
                    >
                      <g fill="none" strokeLinejoin="round" strokeLinecap="round">
                        {TOPO_CONTOURS.map((c, i) => (
                          <path
                            key={i}
                            d={c.d}
                            stroke={c.isIndex ? "#E8B870" : "#C9924A"}
                            strokeWidth={c.isIndex ? 1.25 : 0.7}
                            opacity={c.isIndex ? 0.85 : 0.55 + c.depth * 0.25}
                          />
                        ))}
                      </g>
                    </svg>
                    <div style={styles.terrainGlow} />
                  </div>
                ) : (
                  <div style={styles.horizonVisual}>
                    <div style={styles.horizonLine} />
                  </div>
                )}
              </div>
              <div style={styles.cardBody}>
                <div style={styles.name}>{v.name}</div>
                <blockquote style={styles.cue}>“{v.cue}”</blockquote>
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.btnWrap}>
        <button type="button" style={styles.skip} onClick={onSkip}>
          Let Helios choose for me.
        </button>
      </div>
    </div>
  );
}
