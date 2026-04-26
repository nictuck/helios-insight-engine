import { useState, useEffect } from "react";

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
    hearthVisual: {
      width: "100%",
      height: "100%",
      background:
        "radial-gradient(circle at 50% 65%, #F5B14A 0%, #E08440 22%, #9C3A2E 52%, #3A1410 82%, #1A0F0A 100%)",
      position: "relative",
    },
    hearthGlow: {
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 50% 65%, rgba(255,210,140,0.35) 0%, transparent 35%)",
      mixBlendMode: "screen",
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
                  <div style={styles.hearthVisual}>
                    <div style={styles.hearthGlow} />
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
