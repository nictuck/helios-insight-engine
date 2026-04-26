import { useState, useEffect, useRef, useCallback } from "react";
import AuraDaisy from "./AuraDaisy";
import VoiceSelection from "./VoiceSelection";

const CATEGORIES = [
  { id: "career", label: "Career & Purpose", icon: "◈" },
  { id: "relationships", label: "Relationships", icon: "◇" },
  { id: "health", label: "Health & Vitality", icon: "○" },
  { id: "finance", label: "Financial Health", icon: "△" },
  { id: "growth", label: "Personal Growth", icon: "☆" },
  { id: "joy", label: "Joy & Recreation", icon: "◎" },
  { id: "belonging", label: "Belonging", icon: "⬡" },
  { id: "environment", label: "Physical Environment", icon: "□" },
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
  belonging: [
    "How nourishing are your closest non-romantic connections — family, friends, or chosen community?",
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

  return `Your Helios Assessment reveals a rich and nuanced picture. Your strongest areas — **${highest[1]?.label}** and **${highest[0]?.label}** — reflect real investment and intention. These are foundations you can build from.

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
            background: "var(--track-rail)",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            width: `${pct}%`,
            height: 3,
            background: "linear-gradient(90deg, var(--border-subtle), var(--gold))",
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
              background: i + 1 <= value ? "var(--track-tick-on)" : "var(--track-tick-off)",
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
            background: "var(--bg)",
            border: "2px solid var(--gold)",
            boxShadow: "0 0 20px rgba(154,111,32,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--gold)",
            fontFamily: "'Jost', sans-serif",
            transition: dragging ? "none" : "left 0.15s ease",
          }}
        >
          {value}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'Jost', sans-serif", letterSpacing: "0.08em" }}>
          Needs attention
        </span>
        <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'Jost', sans-serif", letterSpacing: "0.08em" }}>
          Thriving
        </span>
      </div>
    </div>
  );
}

function HeliosWordmark() {
  return (
    <span className="helios-wordmark" aria-label="Helios">
      HEL
      <span className="helios-wordmark__icon" aria-hidden="true">
        <span className="helios-wordmark__sun"></span>
        <span className="helios-wordmark__orbit helios-wordmark__orbit--1">
          <span className="helios-wordmark__planet helios-wordmark__planet--1"></span>
        </span>
        <span className="helios-wordmark__orbit helios-wordmark__orbit--2">
          <span className="helios-wordmark__planet helios-wordmark__planet--2"></span>
        </span>
      </span>
      OS
    </span>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="theme-toggle"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title="Toggle theme"
      onClick={onToggle}
      type="button"
    >
      <svg className="theme-icon theme-icon--moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      <svg className="theme-icon theme-icon--sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    </button>
  );
}

export default function InsightEngine() {
  const [screen, setScreen] = useState(() => {
    if (typeof window === "undefined") return "landing";
    const from = new URLSearchParams(window.location.search).get("from");
    return from && from.toLowerCase() === "helios-site" ? "voice" : "landing";
  });
  const [currentCategory, setCurrentCategory] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({});
  const [showChart, setShowChart] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [insightText, setInsightText] = useState("");
  const [, setInsightIndex] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [questionMetrics, setQuestionMetrics] = useState({});
  const [assessmentStart, setAssessmentStart] = useState(null);
  const [optionalResponses, setOptionalResponses] = useState({ intention: "", context: "" });
  const [personality, setPersonality] = useState("grounded-coach");
  const [scrolled, setScrolled] = useState(false);

  // Theme state — synced with <html data-theme> and localStorage
  const [theme, setTheme] = useState(() => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.getAttribute("data-theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("helios-theme", theme); } catch (e) { /* storage may be blocked */ }
    if (window.HeliosNebula) window.HeliosNebula.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    // Add theme-ready class after first paint so transitions don't fire on load
    const rafId = requestAnimationFrame(() => {
      document.body.classList.add("theme-ready");
    });
    // Set initial nebula scene
    if (window.HeliosNebula) window.HeliosNebula.setScene("home");
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const generateInsights = async (computed, behavioral, totalDurationSeconds, optional) => {
    try {
      const response = await fetch("/.netlify/functions/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scores: computed,
          behavioral: behavioral || {},
          totalDurationSeconds: totalDurationSeconds || null,
          optionalResponses: optional || { intention: "", context: "" },
          personality,
        }),
      });
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      return data.insights;
    } catch {
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    if (from && from.toLowerCase() === "helios-site") {
      params.delete("from");
      const qs = params.toString();
      const newUrl = window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }
    if (new URLSearchParams(window.location.search).has("preview")) {
      const previewScores = {
        career: 5, relationships: 7, health: 3, finance: 8,
        growth: 6, joy: 9, belonging: 4, environment: 7,
      };
      setScores(previewScores);
      setScreen("results");
      setTimeout(() => setShowChart(true), 400);
      setShowInsights(true);
      setInsightLoading(true);
      generateInsights(previewScores, {}, null, { intention: "", context: "" }).then((fullText) => {
        setInsightLoading(false);
        setInsightText(fullText);
        setInsightIndex(fullText.length);
        setShowCTA(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, [screen]);

  useEffect(() => { setFadeIn(false); }, [screen]);

  useEffect(() => {
    if (screen !== "assessment") return;
    const catId = CATEGORIES[currentCategory]?.id;
    if (!catId) return;
    setQuestionMetrics((prev) => {
      if (prev[catId]?.startTime && !prev[catId]?.endTime) return prev;
      return {
        ...prev,
        [catId]: {
          ...prev[catId],
          startTime: Date.now(),
          endTime: null,
          sliderChanges: prev[catId]?.sliderChanges || 0,
          revisited: prev[catId]?.revisited || false,
          originalScore: prev[catId]?.originalScore ?? null,
          scoreChanged: prev[catId]?.scoreChanged || false,
        },
      };
    });
  }, [currentCategory, screen]);

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
    setQuestionMetrics({});
    setAssessmentStart(null);
    setOptionalResponses({ intention: "", context: "" });
    setPersonality("grounded-coach");
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
          optionalResponses,
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
  const questionsBeforeCurrentCategory = CATEGORIES
    .slice(0, currentCategory)
    .reduce((sum, c) => sum + QUESTIONS[c.id].length, 0);
  const currentQuestionPosition = questionsBeforeCurrentCategory + currentQuestion;

  const cat = CATEGORIES[currentCategory];
  const questions = cat ? QUESTIONS[cat.id] : [];

  const getAnswerKey = (catIdx, qIdx) => `${CATEGORIES[catIdx].id}_${qIdx}`;

  const handleAnswer = (val) => {
    const key = getAnswerKey(currentCategory, currentQuestion);
    const catId = CATEGORIES[currentCategory].id;
    if (val !== answers[key]) {
      setQuestionMetrics((prev) => ({
        ...prev,
        [catId]: {
          ...prev[catId],
          sliderChanges: (prev[catId]?.sliderChanges || 0) + 1,
        },
      }));
    }
    setAnswers((prev) => ({ ...prev, [key]: val }));
  };

  const currentValue = answers[getAnswerKey(currentCategory, currentQuestion)] || 5;

  const finalizeCategoryMetrics = (catId) => {
    const qs = QUESTIONS[catId];
    const vals = qs.map((_, qi) => answers[`${catId}_${qi}`] || 5);
    const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    setQuestionMetrics((prev) => {
      const start = prev[catId]?.startTime;
      const elapsed = start ? Math.round((Date.now() - start) / 1000) : null;
      const wasRevisited = prev[catId]?.revisited || false;
      const orig = prev[catId]?.originalScore;
      return {
        ...prev,
        [catId]: {
          ...prev[catId],
          endTime: Date.now(),
          elapsedSeconds: elapsed,
          finalScore: avg,
          scoreChanged: wasRevisited && orig != null ? orig !== avg : false,
        },
      };
    });
  };

  const goToResults = (responses) => {
    const totalDuration = assessmentStart ? Math.round((Date.now() - assessmentStart) / 1000) : null;
    setScreen("results");
    setTimeout(() => setShowChart(true), 400);
    setTimeout(() => {
      setShowInsights(true);
      setInsightLoading(true);
      generateInsights(scores, questionMetrics, totalDuration, responses || optionalResponses).then((fullText) => {
        setInsightLoading(false);
        startTypewriter(fullText);
      });
    }, 2000);
  };

  const goNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((q) => q + 1);
    } else if (currentCategory < CATEGORIES.length - 1) {
      finalizeCategoryMetrics(CATEGORIES[currentCategory].id);
      setCurrentCategory((c) => c + 1);
      setCurrentQuestion(0);
    } else {
      finalizeCategoryMetrics(CATEGORIES[currentCategory].id);
      const computed = {};
      CATEGORIES.forEach((c) => {
        const qs = QUESTIONS[c.id];
        const vals = qs.map((_, qi) => answers[`${c.id}_${qi}`] || 5);
        computed[c.id] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
      });
      setScores(computed);
      setScreen("optional");
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((q) => q - 1);
    } else if (currentCategory > 0) {
      const prevCatId = CATEGORIES[currentCategory - 1].id;
      setQuestionMetrics((prev) => ({
        ...prev,
        [prevCatId]: {
          ...prev[prevCatId],
          revisited: true,
          originalScore: prev[prevCatId]?.originalScore ?? prev[prevCatId]?.finalScore ?? null,
        },
      }));
      setCurrentCategory((c) => c - 1);
      setCurrentQuestion(QUESTIONS[prevCatId].length - 1);
    }
  };

  const renderMarkdown = (text) => {
    return text
      .split("\n\n")
      .filter(Boolean)
      .map((block, i) => {
        block = block.replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--gold-light)">$1</strong>');
        block = block.replace(/\*(.+?)\*/g, '<em style="color:var(--text-dim);font-style:italic">$1</em>');
        if (block.startsWith("1.") || block.startsWith("2.") || block.startsWith("3.")) {
          return (
            <p key={i} style={{ margin: "12px 0", paddingLeft: 8 }} dangerouslySetInnerHTML={{ __html: block }} />
          );
        }
        return <p key={i} style={{ margin: "14px 0" }} dangerouslySetInnerHTML={{ __html: block }} />;
      });
  };

  const labelStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "1.1rem",
    fontWeight: 400,
    color: "var(--text)",
    marginBottom: 12,
    display: "block",
  };

  return (
    <div className="ie-app">
      <nav className={`ie-nav${scrolled ? " scrolled" : ""}`}>
        <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); resetAssessment(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <HeliosWordmark />
        </a>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </nav>

      <div className="ie-content">
        {screen === "landing" && (
          <div style={{ opacity: fadeIn ? 1 : 0, transition: "opacity 0.8s ease", transitionDelay: "0.1s" }}>
            <p className="ie-label" style={{ textAlign: "center", display: "block", marginBottom: 20 }}>
              Helios Assessment
            </p>
            <h1 className="ie-h1">
              Where your energy is <em>flowing</em>
            </h1>
            <p className="ie-subtitle">
              A quiet exploration of where you are — and where you want to be.
              Answer honestly. There are no wrong answers. Your results are yours alone.
            </p>
            <div style={{ textAlign: "center" }}>
              <button className="ie-btn ie-btn--primary" onClick={() => setScreen("voice")}>
                Begin
              </button>
            </div>
            <p className="ie-privacy-note">
              No account required · No personal information collected · Takes 3–5 minutes
            </p>
          </div>
        )}

        {screen === "voice" && (
          <VoiceSelection
            value={personality}
            onChange={setPersonality}
            onContinue={() => { setAssessmentStart(Date.now()); setScreen("assessment"); }}
            onSkip={() => { setPersonality("grounded-coach"); setAssessmentStart(Date.now()); setScreen("assessment"); }}
            fadeIn={fadeIn}
          />
        )}

        {screen === "assessment" && (
          <div style={{ opacity: fadeIn ? 1 : 0, transition: "opacity 0.5s ease", transitionDelay: "0.05s" }}>
            <div className="ie-progress">
              <div className="ie-progress__fill" style={{ width: `${(currentQuestionPosition / totalQuestions) * 100}%` }} />
            </div>

            <div className="ie-label" style={{ marginBottom: 16 }}>
              {cat.icon} &nbsp;{cat.label}
            </div>

            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1.35rem, 3.2vw, 1.7rem)",
              fontWeight: 300,
              lineHeight: 1.35,
              color: "var(--text)",
              marginBottom: 40,
              minHeight: 80,
            }}>
              {questions[currentQuestion]}
            </div>

            <SliderInput value={currentValue} onChange={handleAnswer} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32 }}>
              <button
                className="ie-btn--text"
                style={{ visibility: currentCategory === 0 && currentQuestion === 0 ? "hidden" : "visible" }}
                onClick={goBack}
              >
                ← Back
              </button>
              <button className="ie-btn ie-btn--small" onClick={goNext}>
                {currentCategory === CATEGORIES.length - 1 && currentQuestion === questions.length - 1
                  ? "Continue →"
                  : "Next →"}
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button className="ie-btn--text" onClick={resetAssessment}>
                Start over
              </button>
            </div>
          </div>
        )}

        {screen === "optional" && (
          <div style={{ opacity: fadeIn ? 1 : 0, transition: "opacity 0.8s ease", transitionDelay: "0.1s" }}>
            <h1 className="ie-h1" style={{ marginBottom: 8 }}>One more <em>thing</em></h1>
            <p className="ie-subtitle" style={{ marginBottom: 8 }}>
              These are optional — skip if you'd rather dive straight into your results.
            </p>
            <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginBottom: 40, letterSpacing: "0.05em" }}>
              Your responses are used to personalize your summary and are not stored.
            </p>

            <div style={{ marginBottom: 32 }}>
              <label style={labelStyle}>
                What brought you here today?
              </label>
              <textarea
                className="ie-textarea"
                value={optionalResponses.intention}
                onChange={(e) => setOptionalResponses((prev) => ({ ...prev, intention: e.target.value.slice(0, 300) }))}
                placeholder="A transition, a feeling, curiosity — whatever it is"
                rows={3}
              />
              <div style={{ textAlign: "right", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                {optionalResponses.intention.length} / 300
              </div>
            </div>

            <div style={{ marginBottom: 40 }}>
              <label style={labelStyle}>
                Is there anything you want to make sure this reflection captures?
              </label>
              <textarea
                className="ie-textarea"
                value={optionalResponses.context}
                onChange={(e) => setOptionalResponses((prev) => ({ ...prev, context: e.target.value.slice(0, 300) }))}
                placeholder="Optional — leave blank if nothing comes to mind"
                rows={3}
              />
              <div style={{ textAlign: "right", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                {optionalResponses.context.length} / 300
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
              <button className="ie-btn--text" onClick={() => goToResults(optionalResponses)}>
                Skip
              </button>
              <button className="ie-btn ie-btn--small" onClick={() => goToResults(optionalResponses)}>
                See Results →
              </button>
            </div>
          </div>
        )}

        {screen === "results" && (
          <div style={{ opacity: fadeIn ? 1 : 0, transition: "opacity 0.6s ease", transitionDelay: "0.1s" }}>
            <h1 className="ie-h1" style={{ marginBottom: 8 }}>Your Helios <em>Assessment</em></h1>
            <p className="ie-subtitle" style={{ marginBottom: 12 }}>
              Each shape represents a dimension of your life. Larger blooms are thriving. Smaller ones are asking for attention. The brighter the center, the more balanced your life feels.
            </p>

            <div style={{ display: "flex", justifyContent: "center", marginTop: -40, marginBottom: -40 }}>
              <AuraDaisy scores={scores} animate={showChart} theme={theme} />
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
                  belonging: [40, 190, 185],
                  environment: [130, 190, 50],
                };
                const [r, g, b] = petalColors[c.id] || [212, 165, 116];
                const bgA = theme === "light" ? 0.12 : 0.08;
                return (
                  <div
                    key={c.id}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: `1px solid rgba(${r},${g},${b},0.35)`,
                      background: `rgba(${r},${g},${b},${bgA})`,
                      fontSize: 12,
                      color: `rgb(${r},${g},${b})`,
                      letterSpacing: "0.04em",
                      fontWeight: 500,
                    }}
                  >
                    {c.label}: <strong>{scores[c.id]}</strong>
                  </div>
                );
              })}
            </div>

            {showInsights && (
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 32, marginTop: 8 }}>
                <div className="ie-label" style={{ marginBottom: 20 }}>
                  Your Insights
                </div>
                <div style={{ fontSize: "1rem", lineHeight: 1.85, color: "var(--text)", fontWeight: 400 }}>
                  {insightLoading ? (
                    <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
                      Reading your results…
                    </p>
                  ) : (
                    renderMarkdown(insightText)
                  )}
                </div>
              </div>
            )}

            {showCTA && !submitted && (
              <div className="ie-card" style={{ marginTop: 48, textAlign: "center" }}>
                <div style={{ fontSize: "1.4rem", color: "var(--text)", marginBottom: 8, fontWeight: 300, fontFamily: "'Cormorant Garamond', serif" }}>
                  Does this <em style={{ fontStyle: "italic", color: "var(--gold-light)" }}>resonate</em> with you?
                </div>
                <p style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 24, fontWeight: 400, lineHeight: 1.7 }}>
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
                <div style={{ display: "flex", gap: 12, maxWidth: 400, margin: "0 auto", flexWrap: "wrap" }}>
                  <input
                    className="ie-input"
                    type="email"
                    name="email"
                    id="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ flex: "1 1 200px", padding: "12px 16px", fontSize: 14 }}
                  />
                  <button
                    className="ie-btn ie-btn--primary ie-btn--small"
                    style={{
                      opacity: (!consentChecked || submitting) ? 0.4 : 1,
                      pointerEvents: (!consentChecked || submitting) ? "none" : "auto",
                    }}
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
                  color: "var(--muted)",
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
                    style={{ marginTop: 2, accentColor: "var(--gold)" }}
                  />
                  I consent to sharing my email and assessment results with the Helios team for the purpose of scheduling a consultation.
                </label>
                {submitError && (
                  <p style={{
                    fontSize: 13,
                    color: "var(--error)",
                    textAlign: "center",
                    marginTop: 12,
                  }}>
                    {submitError}
                  </p>
                )}
              </div>
            )}

            {submitted && (
              <div className="ie-card" style={{ marginTop: 48, padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", color: "var(--gold-light)", marginBottom: 8, fontWeight: 300, fontFamily: "'Cormorant Garamond', serif" }}>
                  Thank you
                </div>
                <p style={{ fontSize: 15, color: "var(--text-dim)", marginBottom: 24, fontWeight: 400, lineHeight: 1.7 }}>
                  We've received your assessment. A member of our team will reach out within 24 hours to schedule a complimentary consultation.
                </p>
                <button
                  className="ie-btn"
                  onClick={() => window.open("https://calendly.com/nicholastucker/30min", "_blank")}
                >
                  Book Now
                </button>
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 16, letterSpacing: "0.08em" }}>
                  Or schedule at your convenience
                </p>
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: 48, paddingBottom: 40 }}>
              <button className="ie-btn--text" onClick={resetAssessment}>
                ← Retake Assessment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
