import { useState, useEffect } from "react";

/* ------------------------------------------------------------------
 * Topographic contour generator for the Terrain tile visual.
 *
 * Each peak is rendered as a stack of nested closed curves. Each curve
 * is a smooth cubic-Bezier-through-jittered-points path so the rings
 * look hand-drawn rather than mechanically circular.
 * ------------------------------------------------------------------ */

// Deterministic LCG so renders are stable
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function organicContour(cx, cy, rx, ry, rotationRad, seed, pointCount = 16, jitter = 0.1) {
  const rand = seededRandom(seed);
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);
  const pts = [];
  for (let i = 0; i < pointCount; i++) {
    const theta = (Math.PI * 2 * i) / pointCount;
    const j = 1 + (rand() - 0.5) * 2 * jitter;
    const lx = Math.cos(theta) * rx * j;
    const ly = Math.sin(theta) * ry * j;
    pts.push({
      x: cx + cos * lx - sin * ly,
      y: cy + sin * lx + cos * ly,
    });
  }
  // Catmull-Rom-to-Bezier closed path
  const n = pts.length;
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d + " Z";
}

// Build a stack of contour rings for a single peak
function buildPeak({ cx, cy, rx, ry, rotation, seed, rings, summitFraction = 0.08 }) {
  const out = [];
  for (let i = 0; i < rings; i++) {
    const t = rings === 1 ? 0 : i / (rings - 1); // 0 = outermost, 1 = innermost
    const scale = 1 - t * (1 - summitFraction);
    const jitter = 0.06 + (1 - t) * 0.07;
    const ringSeed = seed + i * 173;
    const points = 16 + ((seed + i) % 3);
    out.push({
      d: organicContour(cx, cy, rx * scale, ry * scale, rotation, ringSeed, points, jitter),
      depth: t,
      // Index contours every 3 rings get a slightly heavier stroke
      isIndex: (rings - 1 - i) % 3 === 0,
    });
  }
  return out;
}

// Pre-compute the topographic field once at module load
const TOPO_CONTOURS = [
  // Main summit, upper-left quadrant
  ...buildPeak({ cx: 92, cy: 78, rx: 96, ry: 72, rotation: -0.18, seed: 1031, rings: 9 }),
  // Secondary summit, lower-right
  ...buildPeak({ cx: 218, cy: 142, rx: 70, ry: 50, rotation: 0.42, seed: 7727, rings: 7 }),
  // Small ridge bump, upper-right
  ...buildPeak({ cx: 245, cy: 52, rx: 28, ry: 22, rotation: 0.65, seed: 4421, rings: 4 }),
  // Tiny crag, lower-left edge
  ...buildPeak({ cx: 36, cy: 172, rx: 22, ry: 17, rotation: -0.05, seed: 9133, rings: 3 }),
];

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
      // Soft warm light pooling near the main summit
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 35% 38%, rgba(255,205,130,0.18) 0%, transparent 45%)",
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
                      <g fill="none" stroke="#D9A058" strokeLinejoin="round" strokeLinecap="round">
                        {TOPO_CONTOURS.map((c, i) => (
                          <path
                            key={i}
                            d={c.d}
                            strokeWidth={c.isIndex ? 0.95 : 0.55}
                            opacity={(0.22 + c.depth * 0.55) * (c.isIndex ? 1.15 : 1)}
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
