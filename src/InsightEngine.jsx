import { useState, useEffect, useRef, useCallback } from "react";
import AuraDaisy from "./AuraDaisy";

const CATEGORIES = [
  { id: "career", label: "Career & Purpose", icon: "◈", color: "#D4A574" },
  { id: "relationships", label: "Relationships", icon: "◇", color: "#A8C4D4" },
  { id: "health", label: "Health & Vitality", icon: "○", color: "#B8D4A8" },
  { id: "finance", label: "Financial Health", icon: "△", color: "#D4C4A8" },
  { id: "growth", label: "Personal Growth", icon: "☆", color: "#C4A8D4" },
  { id: "joy", label: "Joy & Recreation", icon: "◎", color: "#D4A8B8" },
  { id: "family", label: "Family & Community", icon: "⬡", color: "#A8D4C4" },
  { id: "environment", label: "Physical Environment", icon: "□", color: "#D4D4A8" },
];

const QUESTIONS = {
  career: [
    "How fulfilled do you feel in your current work or career path?",
    "How aligned is your daily work with your deeper sense of purpose?",
  ],
  relationships: [
    "How satisfied are you with the depth and quality of your closest relationships?",
    "How supported do you feel by the people around you?",
  ],
  health: [
    "How would you rate your overall physical energy and vitality?",
    "How consistently do you prioritize your physical and mental wellbeing?",
  ],
  finance: [
    "How secure and at ease do you feel about your financial situation?",
    "How confident are you in your financial direction and planning?",
  ],
  growth: [
    "How actively are you learning, evolving, and challenging yourself?",
    "How connected do you feel to your own personal development journey?",
  ],
  joy: [
    "How often do you experience genuine fun, play, or creative expression?",
    "How well do you balance responsibility with things that light you up?",
  ],
  family: [
    "How strong and nourishing are your family and community connections?",
    "How much do you feel you belong to something larger than yourself?",
  ],
  environment: [
    "How much does your physical space support your wellbeing and productivity?",
    "How comfortable and inspired do you feel in your daily surroundings?",
  ],
};

const MOCK_INSIGHTS = (scores) => {
  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  const lowest = sorted.slice(0, 2).map(([k]) => CATEGORIES.find((c) => c.id === k));
  const highest = sorted.slice(-2).map(([k]) => CATEGORIES.find((c) => c.id === k));

  return `Your Life Diagnostic reveals a rich and nuanced picture. Your strongest areas — **${highest[1]?.label}** and **${highest[0]?.label}** — reflect real investment and intention. These are foundations you can build from.

At the same time, **${lowest[0]?.label}** (${scores[lowest[0]?.id]}/10) and **${lowest[1]?.label}** (${scores[lowest[1]?.id]}/10) are asking for your attention. This isn't about failure — it's about signal. These areas are telling you where growth wants to happen next.

**Here's what stands out:**

When ${lowest[0]?.label.toLowerCase()} scores are lower while areas like ${highest[1]?.label.toLowerCase()} are thriving, it often means your energy is flowing strongly in one direction. The opportunity isn't to pull back from what's working — it's to redirect some of that same intentionality toward what's been waiting.

**Recommended focus areas:**

1. **${lowest[0]?.label}** — This is where the biggest shift is available to you right now. Even small, consistent changes here tend to create ripple effects across other areas of your life.

2. **${lowest[1]?.label}** — Consider what one boundary, habit, or conversation could begin to move this number. You don't need a complete overhaul — you need a starting point.

3. **The connection between ${lowest[0]?.label.toLowerCase()} and ${highest[1]?.label.toLowerCase()}** — These two areas often have a hidden relationship. Exploring that dynamic with a coach can unlock insights that are hard to see on your own.

*At Helios, we work with the whole person — not just the symptom. Whether through integrative coaching, systems work, or therapeutic support, we help you find the leverage points that matter most.*`;
};

function SliderInput({ value, onChange }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const updateValue = useCallback(
    (clientX) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onChange(Math.round(pct * 9) + 1);
    },
    [onChange]
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      e.preventDefault();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      updateValue(cx);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, updateValue]);

  const pct = ((value - 1) / 9) * 100;

  return (
    <div style={{ padding: "8px 0" }}>
      <div
        ref={trackRef}
        onMouseDown={(e) => {
          setDragging(true);
          updateValue(e.clientX);
        }}
        onTouchStart={(e) => {
          setDragging(true);
          updateValue(e.touches[0].clientX);
        }}
        style={{
          position: "relative",
          height: 40,
          cursor: "pointer",
          touchAction: "none",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 3,
            background: "rgba(212,165,116,0.15)",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            width: `${pct}%`,
            height: 3,
            background: "linear-gradient(90deg, rgba(212,165,116,0.3), #D4A574)",
            borderRadius: 2,
            transition: dragging ? "none" : "width 0.15s ease",
          }}
        />
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(i / 9) * 100}%`,
              width: 2,
              height: i % 5 === 0 ? 10 : 6,
              background: i + 1 <= value ? "rgba(212,165,116,0.5)" : "rgba(212,165,116,0.15)",
              borderRadius: 1,
              transform: "translateX(-50%)",
              transition: "background 0.2s",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: `${pct}%`,
            transform: "translateX(-50%)",
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#0D0D12",
            border: "2px solid #D4A574",
            boxShadow: "0 0 20px rgba(212,165,116,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
            color: "#D4A574",
            fontFamily: "'Jost', sans-serif",
            transition: dragging ? "none" : "left 0.15s ease",
          }}
        >
          {value}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 11, color: "#8a8070", fontFamily: "'Jost', sans-serif" }}>
          Needs attention
        </span>
        <span style={{ fontSize: 11, color: "#8a8070", fontFamily: "'Jost', sans-serif" }}>
          Thriving
        </span>
      </div>
    </div>
  );
}

export default function InsightEngine() {
  const [screen, setScreen] = useState("landing");
  const [currentCategory, setCurrentCategory] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({});
  const [showChart, setShowChart] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [insightText, setInsightText] = useState("");
  const [insightIndex, setInsightIndex] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);

  const generateInsights = async (computed) => {
    try {
      const response = await fetch("/.netlify/functions/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: computed }),
      });
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      return data.insights;
    } catch {
      // Fall back to template-based insights if API is unavailable
      return MOCK_INSIGHTS(computed);
    }
  };

  const startTypewriter = (fullText) => {
    let idx = 0;
    const typeInterval = setInterval(() => {
      idx += 3;
      if (idx >= fullText.length) {
        idx = fullText.length;
        clearInterval(typeInterval);
        setTimeout(() => setShowCTA(true), 600);
      }
      setInsightText(fullText.slice(0, idx));
      setInsightIndex(idx);
    }, 8);
  };

  // Dev shortcut: add ?preview to URL to skip straight to results
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("preview")) {
      const previewScores = {
        career: 5, relationships: 7, health: 3, finance: 8,
        growth: 6, joy: 9, family: 4, environment: 7,
      };
      setScores(previewScores);
      setScreen("results");
      setTimeout(() => setShowChart(true), 400);
      setShowInsights(true);
      setInsightLoading(true);
      generateInsights(previewScores).then((fullText) => {
        setInsightLoading(false);
        setInsightText(fullText);
        setInsightIndex(fullText.length);
        setShowCTA(true);
      });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, [screen]);

  useEffect(() => {
    setFadeIn(false);
  }, [screen]);

  const resetAssessment = () => {
    setScreen("landing");
    setCurrentCategory(0);
    setCurrentQuestion(0);
    setAnswers({});
    setScores({});
    setShowChart(false);
    setShowInsights(false);
    setInsightText("");
    setInsightIndex(0);
    setShowCTA(false);
    setEmail("");
    setSubmitted(false);
    setConsentChecked(false);
    setSubmitting(false);
    setSubmitError("");
  };

  const handleOptIn = async () => {
    if (!email.includes("@") || !email.includes(".") || !consentChecked) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/.netlify/functions/submit-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          scores,
          insights: insightText,
          honeypot: document.getElementById("hp-field")?.value || "",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Something went wrong");
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalQuestions = CATEGORIES.reduce((sum, c) => sum + QUESTIONS[c.id].length, 0);
  const answeredCount = Object.keys(answers).length;

  const cat = CATEGORIES[currentCategory];
  const questions = cat ? QUESTIONS[cat.id] : [];

  const getAnswerKey = (catIdx, qIdx) => `${CATEGORIES[catIdx].id}_${qIdx}`;

  const handleAnswer = (val) => {
    const key = getAnswerKey(currentCategory, currentQuestion);
    setAnswers((prev) => ({ ...prev, [key]: val }));
  };

  const currentValue = answers[getAnswerKey(currentCategory, currentQuestion)] || 5;

  const goNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((q) => q + 1);
    } else if (currentCategory < CATEGORIES.length - 1) {
      setCurrentCategory((c) => c + 1);
      setCurrentQuestion(0);
    } else {
      const computed = {};
      CATEGORIES.forEach((c) => {
        const qs = QUESTIONS[c.id];
        const vals = qs.map((_, qi) => answers[`${c.id}_${qi}`] || 5);
        computed[c.id] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
      });
      setScores(computed);
      setScreen("results");
      setTimeout(() => setShowChart(true), 400);
      setTimeout(() => {
        setShowInsights(true);
        setInsightLoading(true);
        generateInsights(computed).then((fullText) => {
          setInsightLoading(false);
          startTypewriter(fullText);
        });
      }, 2000);
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((q) => q - 1);
    } else if (currentCategory > 0) {
      setCurrentCategory((c) => c - 1);
      setCurrentQuestion(QUESTIONS[CATEGORIES[currentCategory - 1].id].length - 1);
    }
  };

  const renderMarkdown = (text) => {
    return text
      .split("\n\n")
      .filter(Boolean)
      .map((block, i) => {
        block = block.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#E8C97A">$1</strong>');
        block = block.replace(/\*(.+?)\*/g, '<em style="color:#b8b0a0">$1</em>');
        if (block.startsWith("1.") || block.startsWith("2.") || block.startsWith("3.")) {
          return (
            <p key={i} style={{ margin: "12px 0", paddingLeft: 8 }} dangerouslySetInnerHTML={{ __html: block }} />
          );
        }
        return <p key={i} style={{ margin: "14px 0" }} dangerouslySetInnerHTML={{ __html: block }} />;
      });
  };

  const styles = {
    app: {
      minHeight: "100vh",
      background: "#0D0D12",
      color: "#EDE8DC",
      fontFamily: "'Jost', sans-serif",
      position: "relative",
      overflow: "hidden",
    },
    noise: {
      position: "fixed",
      inset: 0,
      opacity: 0.03,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      pointerEvents: "none",
      zIndex: 0,
    },
    orb1: {
      position: "fixed",
      width: 600,
      height: 600,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(212,165,116,0.06) 0%, transparent 70%)",
      top: -200,
      right: -200,
      pointerEvents: "none",
      zIndex: 0,
    },
    orb2: {
      position: "fixed",
      width: 500,
      height: 500,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(168,196,212,0.04) 0%, transparent 70%)",
      bottom: -150,
      left: -150,
      pointerEvents: "none",
      zIndex: 0,
    },
    content: {
      position: "relative",
      zIndex: 1,
      maxWidth: 640,
      margin: "0 auto",
      padding: "40px 24px",
    },
    logo: {
      textAlign: "center",
      marginBottom: 48,
    },
    logoText: {
      fontSize: 14,
      letterSpacing: 6,
      textTransform: "uppercase",
      color: "#C9A84C",
      fontFamily: "'Jost', sans-serif",
      fontWeight: 300,
    },
    h1: {
      fontSize: 42,
      fontWeight: 300,
      lineHeight: 1.15,
      color: "#EDE8DC",
      fontFamily: "'Cormorant Garamond', serif",
      marginBottom: 20,
      textAlign: "center",
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 1.85,
      color: "#b8b0a0",
      textAlign: "center",
      maxWidth: 480,
      margin: "0 auto 40px",
      fontWeight: 300,
    },
    btn: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px 48px",
      background: "transparent",
      border: "1px solid rgba(201,168,76,0.5)",
      color: "#C9A84C",
      fontSize: 13,
      fontFamily: "'Jost', sans-serif",
      letterSpacing: 3,
      textTransform: "uppercase",
      cursor: "pointer",
      transition: "all 0.4s ease",
      fontWeight: 500,
    },
    btnHover: {
      background: "rgba(201,168,76,0.08)",
      borderColor: "#C9A84C",
      boxShadow: "0 0 30px rgba(201,168,76,0.15)",
    },
    privacyNote: {
      fontSize: 12,
      color: "#8a8070",
      textAlign: "center",
      marginTop: 24,
      letterSpacing: 1,
    },
    progressBar: {
      height: 1,
      background: "rgba(212,165,116,0.1)",
      marginBottom: 48,
      position: "relative",
    },
    progressFill: {
      height: "100%",
      background: "linear-gradient(90deg, rgba(212,165,116,0.2), #D4A574)",
      transition: "width 0.5s ease",
    },
    categoryLabel: {
      fontSize: 11,
      letterSpacing: 4,
      textTransform: "uppercase",
      color: "#C9A84C",
      fontFamily: "'Jost', sans-serif",
      fontWeight: 400,
      marginBottom: 12,
    },
    questionText: {
      fontSize: 26,
      fontWeight: 300,
      lineHeight: 1.4,
      color: "#EDE8DC",
      fontFamily: "'Cormorant Garamond', serif",
      marginBottom: 40,
      minHeight: 80,
    },
    navRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 32,
    },
    backBtn: {
      background: "none",
      border: "none",
      color: "#8a8070",
      fontSize: 13,
      fontFamily: "'Jost', sans-serif",
      letterSpacing: 2,
      cursor: "pointer",
      padding: "8px 0",
      textTransform: "uppercase",
    },
    nextBtn: {
      padding: "12px 36px",
      background: "transparent",
      border: "1px solid rgba(201,168,76,0.5)",
      color: "#C9A84C",
      fontSize: 13,
      fontFamily: "'Jost', sans-serif",
      letterSpacing: 3,
      textTransform: "uppercase",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
  };

  const [hoveredBtn, setHoveredBtn] = useState(null);

  return (
    <div style={styles.app}>
      <div style={styles.noise} />
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      <div style={styles.content}>
        <div style={styles.logo}>
          <div style={styles.logoText}>Helios</div>
        </div>

        {screen === "landing" && (
          <div style={{ opacity: fadeIn ? 1 : 0, transition: "opacity 0.8s ease", transitionDelay: "0.1s" }}>
            <h1 style={styles.h1}>Life Diagnostic</h1>
            <p style={styles.subtitle}>
              A quiet exploration of where you are — and where you want to be.
              Answer honestly. There are no wrong answers. Your results are yours alone.
            </p>
            <div style={{ textAlign: "center" }}>
              <button
                style={{ ...styles.btn, ...(hoveredBtn === "start" ? styles.btnHover : {}) }}
                onMouseEnter={() => setHoveredBtn("start")}
                onMouseLeave={() => setHoveredBtn(null)}
                onClick={() => setScreen("assessment")}
              >
                Begin
              </button>
            </div>
            <p style={styles.privacyNote}>
              No account required · No personal information collected · Takes 3–5 minutes
            </p>
          </div>
        )}

        {screen === "assessment" && (
          <div style={{ opacity: fadeIn ? 1 : 0, transition: "opacity 0.5s ease", transitionDelay: "0.05s" }}>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${(answeredCount / totalQuestions) * 100}%` }} />
            </div>

            <div style={styles.categoryLabel}>
              {cat.icon} &nbsp;{cat.label}
            </div>

            <div style={styles.questionText}>{questions[currentQuestion]}</div>

            <SliderInput value={currentValue} onChange={handleAnswer} />

            <div style={styles.navRow}>
              <button
                style={{
                  ...styles.backBtn,
                  visibility: currentCategory === 0 && currentQuestion === 0 ? "hidden" : "visible",
                }}
                onClick={goBack}
              >
                ← Back
              </button>
              <span />
              <button
                style={{
                  ...styles.nextBtn,
                  ...(hoveredBtn === "next"
                    ? { background: "rgba(201,168,76,0.08)", borderColor: "#C9A84C" }
                    : {}),
                }}
                onMouseEnter={() => setHoveredBtn("next")}
                onMouseLeave={() => setHoveredBtn(null)}
                onClick={goNext}
              >
                {currentCategory === CATEGORIES.length - 1 && currentQuestion === questions.length - 1
                  ? "See Results →"
                  : "Next →"}
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button
                onClick={resetAssessment}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8a8070",
                  fontSize: 11,
                  fontFamily: "'Jost', sans-serif",
                  letterSpacing: 2,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  transition: "color 0.3s",
                }}
                onMouseEnter={(e) => e.target.style.color = "#C9A84C"}
                onMouseLeave={(e) => e.target.style.color = "#8a8070"}
              >
                Start over
              </button>
            </div>
          </div>
        )}

        {screen === "results" && (
          <div style={{ opacity: fadeIn ? 1 : 0, transition: "opacity 0.6s ease", transitionDelay: "0.1s" }}>
            <h1 style={{ ...styles.h1, fontSize: 34, marginBottom: 8 }}>Your Life Diagnostic</h1>
            <p style={{ ...styles.subtitle, fontSize: 15, marginBottom: 12 }}>
              Each shape represents a dimension of your life. Larger blooms are thriving. Smaller ones are asking for attention. The brighter the center, the more balanced your life feels.
            </p>

            <div style={{ display: "flex", justifyContent: "center", marginTop: -60, marginBottom: -56 }}>
              <AuraDaisy scores={scores} animate={showChart} />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 40 }}>
              {CATEGORIES.map((c) => {
                const petalColors = {
                  career: [220, 155, 50],
                  relationships: [65, 135, 215],
                  health: [50, 185, 110],
                  finance: [195, 165, 55],
                  growth: [150, 85, 210],
                  joy: [215, 65, 115],
                  family: [40, 190, 185],
                  environment: [130, 190, 50],
                };
                const [r, g, b] = petalColors[c.id] || [212, 165, 116];
                return (
                  <div
                    key={c.id}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: `1px solid rgba(${r},${g},${b},0.25)`,
                      background: `rgba(${r},${g},${b},0.08)`,
                      fontSize: 12,
                      color: `rgb(${r},${g},${b})`,
                      letterSpacing: 0.5,
                    }}
                  >
                    {c.label}: <strong style={{ color: `rgb(${r},${g},${b})` }}>{scores[c.id]}</strong>
                  </div>
                );
              })}
            </div>

            {showInsights && (
              <div
                style={{
                  borderTop: "1px solid rgba(212,165,116,0.1)",
                  paddingTop: 32,
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: 4,
                    textTransform: "uppercase",
                    color: "#C9A84C",
                    marginBottom: 20,
                  }}
                >
                  Your Insights
                </div>
                <div
                  style={{
                    fontSize: 16,
                    lineHeight: 1.85,
                    color: "#EDE8DC",
                    fontWeight: 400,
                  }}
                >
                  {insightLoading ? (
                    <p style={{ color: "#8a8070", fontStyle: "italic" }}>
                      Reading your results…
                    </p>
                  ) : (
                    renderMarkdown(insightText)
                  )}
                </div>
              </div>
            )}

            {showCTA && !submitted && (
              <div
                style={{
                  marginTop: 48,
                  padding: 32,
                  border: "1px solid rgba(212,165,116,0.15)",
                  background: "rgba(212,165,116,0.03)",
                  textAlign: "center",
                  opacity: showCTA ? 1 : 0,
                  transition: "opacity 0.8s ease",
                }}
              >
                <div style={{ fontSize: 22, color: "#EDE8DC", marginBottom: 8, fontWeight: 300, fontFamily: "'Cormorant Garamond', serif" }}>
                  Does this resonate with you?
                </div>
                <p style={{ fontSize: 14, color: "#b8b0a0", marginBottom: 24, fontWeight: 400 }}>
                  If you'd like to explore what came up, we're here. Share your email and we'll connect you
                  with the right support — whether that's coaching, therapeutic guidance, or both.
                </p>
                <input
                  id="hp-field"
                  name="website_url"
                  type="text"
                  tabIndex={-1}
                  autoComplete="new-password"
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    opacity: 0,
                    height: 0,
                    width: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                  }}
                />
                <div style={{ display: "flex", gap: 12, maxWidth: 400, margin: "0 auto" }}>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      background: "rgba(13,13,18,0.8)",
                      border: "1px solid rgba(201,168,76,0.35)",
                      color: "#EDE8DC",
                      fontSize: 14,
                      fontFamily: "'Jost', sans-serif",
                      outline: "none",
                    }}
                  />
                  <button
                    style={{
                      ...styles.nextBtn,
                      padding: "12px 24px",
                      opacity: (!consentChecked || submitting) ? 0.4 : 1,
                      pointerEvents: (!consentChecked || submitting) ? "none" : "auto",
                      ...(hoveredBtn === "submit"
                        ? { background: "rgba(201,168,76,0.08)", borderColor: "#C9A84C" }
                        : {}),
                    }}
                    onMouseEnter={() => setHoveredBtn("submit")}
                    onMouseLeave={() => setHoveredBtn(null)}
                    onClick={handleOptIn}
                  >
                    {submitting ? "Sending..." : "Connect"}
                  </button>
                </div>
                <label style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginTop: 12,
                  cursor: "pointer",
                  fontSize: 12,
                  color: "rgba(212,165,116,0.4)",
                  lineHeight: 1.5,
                  maxWidth: 400,
                  margin: "12px auto 0",
                  textAlign: "left",
                }}>
                  <input
                    type="checkbox"
                    id="consent"
                    name="consent"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    style={{ marginTop: 2, accentColor: "#D4A574" }}
                  />
                  I consent to sharing my email and assessment results with the Helios team for the purpose of scheduling a consultation.
                </label>
                {submitError && (
                  <p style={{
                    fontSize: 13,
                    color: "#E24B4A",
                    textAlign: "center",
                    marginTop: 12,
                  }}>
                    {submitError}
                  </p>
                )}
              </div>
            )}

            {submitted && (
              <div
                style={{
                  marginTop: 48,
                  padding: 40,
                  border: "1px solid rgba(212,165,116,0.2)",
                  background: "rgba(212,165,116,0.04)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 28, color: "#E8C97A", marginBottom: 8, fontWeight: 300, fontFamily: "'Cormorant Garamond', serif" }}>
                  Thank you
                </div>
                <p style={{ fontSize: 15, color: "#b8b0a0", marginBottom: 24, fontWeight: 400 }}>
                  We've received your assessment. A member of our team will reach out within 24 hours to schedule a complimentary consultation.
                </p>
                <button
                  style={{
                    ...styles.btn,
                    fontSize: 13,
                    padding: "14px 36px",
                    ...(hoveredBtn === "book" ? styles.btnHover : {}),
                  }}
                  onMouseEnter={() => setHoveredBtn("book")}
                  onMouseLeave={() => setHoveredBtn(null)}
                  onClick={() => window.open("https://calendly.com/nicholastucker/30min", "_blank")}
                >
                  Book Now
                </button>
                <p style={{ fontSize: 11, color: "#8a8070", marginTop: 16, letterSpacing: 0.5 }}>
                  Or schedule at your convenience
                </p>
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: 48, paddingBottom: 40 }}>
              <button
                onClick={resetAssessment}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8a8070",
                  fontSize: 13,
                  fontFamily: "'Jost', sans-serif",
                  letterSpacing: 2,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  transition: "color 0.3s",
                }}
                onMouseEnter={(e) => e.target.style.color = "#C9A84C"}
                onMouseLeave={(e) => e.target.style.color = "#8a8070"}
              >
                ← Retake Assessment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
