/**
 * Engagement gate.
 *
 * Detects non-engagement (primarily bot traffic or null submissions) before
 * the model is called, and routes to a static voice-faithful redirect instead
 * of generating fabricated depth on thin input.
 *
 * Behavior is binary: engaged or gated. There is no middle tier for
 * "rushed but real" users — the threshold is set tight deliberately so the
 * gate primarily catches bots and null submissions, not fast humans.
 *
 * Fail-open: if the data needed to detect non-engagement isn't present
 * (e.g. missing totalDurationSeconds), normal generation runs.
 */

export function evaluateEngagement({ behavioral, totalDurationSeconds, optionalResponses, personality }) {
  // All four conditions must be true to gate. Any missing data fails open.

  const durationUnderThreshold = typeof totalDurationSeconds === "number" && totalDurationSeconds < 15;
  if (!durationUnderThreshold) return { engaged: true };

  const totalSliderChanges = Object.values(behavioral ?? {}).reduce(
    (sum, meta) => sum + (meta?.sliderChanges ?? 0),
    0,
  );
  if (totalSliderChanges >= 4) return { engaged: true };

  const anyRevisited = Object.values(behavioral ?? {}).some((meta) => meta?.revisited === true);
  if (anyRevisited) return { engaged: true };

  const intention = optionalResponses?.intention?.trim() ?? "";
  const context = optionalResponses?.context?.trim() ?? "";
  if (intention.length > 0 || context.length > 0) return { engaged: true };

  return { engaged: false, personality };
}

export const REDIRECT_RESPONSES = {
  "grounded-coach": `This one moved quickly — quickly enough that there's not much here for me to work with yet. An assessment like this reflects back what you put into it, and a few minutes of real attention is usually what makes the reflection worth having. Come back when you have the time to sit with the questions. I'll be here.`,

  "systems-observer": `The signal here is too thin to read from. An assessment produces a reflection proportional to the attention it receives, and what came through this time doesn't give me enough to find a pattern in. If you'd like something worth looking at, the questions are worth returning to with more time.`,
};
