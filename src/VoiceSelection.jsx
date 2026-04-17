import { useState, useEffect } from "react";

/**
 * Voice selection screen — appears between landing and assessment.
 * Users pick between Hearth (grounded-coach) and Horizon (systems-observer).
 *
 * Props:
 *   value:      currently selected personality id ("grounded-coach" | "systems-observer")
 *   onChange:   (id) => void — called when user picks a card
 *   onContinue: () => void   — called when user clicks "Begin assessment"
 *   onSkip:     () => void   — called when user clicks "Let Helios choose for me."
 *   fadeIn:     boolean      — drives the same fade-in transition used elsewhere
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
      name: "Hearth",
      cue: "Let's start with what's actually here.",
    },
    {
      id: "systems-observer",
      name: "Horizon",
      cue: "I want to see what this pattern is doing.",
    },
  ];

  const handleKey = (e, id) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(id);
    }
  };

  const styles = {
    wrap: {
      opacity: fadeIn ? 1 : 0,
      transition: "opacity 0.8s ease",
      transitionDelay: "0.1s",
    },
    framing: {
      fontSize: 28,
      fontWeight: 300,
      lineHeight: 1.35,
      color: "#EDE8DC",
      fontFamily: "'Cormorant Garamond', serif",
      marginBottom: 36,
      textAlign: "center",
      letterSpacing: -0.3,
      maxWidth: 520,
      marginLeft: "auto",
      marginRight: "auto",
    },
    cards: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: 20,
      marginBottom: 40,
    },
    card: (selected, isHover) => ({
      flex: 1,
      background: selected ? "rgba(201,168,76,0.05)" : "rgba(237,232,220,0.015)",
      border: selected
        ? "1px solid rgba(201,168,76,0.7)"
        : isHover
          ? "1px solid rgba(201,168,76,0.3)"
          : "1px solid rgba(237,232,220,0.08)",
      borderRadius: 4,
      padding: 0,
      cursor: "pointer",
      textAlign: "center",
      fontFamily: "'Jost', sans-serif",
      color: "#EDE8DC",
      transition: reducedMotion ? "none" : "all 0.3s ease",
      boxShadow: selected ? "0 0 40px rgba(201,168,76,0.08)" : "none",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      outline: "none",
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
        "radial-gradient(circle at 50% 65%, #F5B14A 0%, #E08440 22%, #9C3A2E 52%, #3A1410 82%, #0D0D12 100%)",
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
      padding: "26px 24px 28px",
      textAlign: "center",
    },
    name: {
      fontSize: 34,
      fontWeight: 400,
      fontFamily: "'Cormorant Garamond', serif",
      color: "#EDE8DC",
      marginBottom: 12,
      letterSpacing: -0.2,
      textAlign: "center",
    },
    cue: {
      fontSize: 18,
      lineHeight: 1.55,
      color: "#c9c1b0",
      fontStyle: "italic",
      fontFamily: "'Cormorant Garamond', serif",
      margin: 0,
      fontWeight: 400,
      textAlign: "center",
    },
    btnWrap: {
      textAlign: "center",
    },
    btn: (isHover) => ({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px 48px",
      background: isHover ? "rgba(201,168,76,0.08)" : "transparent",
      border: isHover ? "1px solid #C9A84C" : "1px solid rgba(201,168,76,0.5)",
      color: "#C9A84C",
      fontSize: 13,
      fontFamily: "'Jost', sans-serif",
      letterSpacing: 3,
      textTransform: "uppercase",
      cursor: "pointer",
      transition: reducedMotion ? "none" : "all 0.4s ease",
      fontWeight: 500,
      width: isMobile ? "100%" : "auto",
      boxShadow: isHover ? "0 0 30px rgba(201,168,76,0.15)" : "none",
    }),
    skip: {
      display: "block",
      margin: "20px auto 0",
      background: "none",
      border: "none",
      color: "#8a8070",
      fontSize: 12,
      fontFamily: "'Jost', sans-serif",
      letterSpacing: 1.5,
      cursor: "pointer",
      padding: "8px 12px",
      textDecoration: "underline",
      textUnderlineOffset: 3,
      textDecorationColor: "rgba(138,128,112,0.4)",
    },
  };

  return (
    <div style={styles.wrap}>
      <h1 style={styles.framing}>
        Helios reflections come in two voices. Choose who reads your results.
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
              onClick={() => onChange(v.id)}
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
        <button
          type="button"
          style={styles.btn(hovered === "continue")}
          onMouseEnter={() => setHovered("continue")}
          onMouseLeave={() => setHovered(null)}
          onClick={onContinue}
        >
          Begin assessment
        </button>
        <button type="button" style={styles.skip} onClick={onSkip}>
          Let Helios choose for me.
        </button>
      </div>
    </div>
  );
}
