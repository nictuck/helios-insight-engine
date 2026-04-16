export const BEHAVIORAL_THRESHOLDS = {
  longReflectionSeconds: 25,
  highSliderActivity: 4,
};

export const CATEGORIES = [
  { id: "career", label: "Career & Purpose" },
  { id: "relationships", label: "Relationships" },
  { id: "health", label: "Health & Vitality" },
  { id: "finance", label: "Financial Health" },
  { id: "growth", label: "Personal Growth" },
  { id: "joy", label: "Joy & Recreation" },
  { id: "family", label: "Family & Community" },
  { id: "environment", label: "Physical Environment" },
];

export function buildUserMessage({ scores, behavioral, totalDurationSeconds, optionalResponses }) {
  const sorted = Object.entries(scores)
    .map(([id, score]) => {
      const cat = CATEGORIES.find((c) => c.id === id);
      const meta = behavioral?.[id] ?? {};
      return { id, label: cat?.label || id, score, ...meta };
    })
    .sort((a, b) => a.score - b.score);

  let message = `Here are this person's Life Diagnostic scores, from lowest to highest:\n\n`;

  for (const item of sorted) {
    let line = `- ${item.label}: ${item.score}/10`;

    const annotations = [];
    if ((item.elapsedSeconds ?? 0) >= BEHAVIORAL_THRESHOLDS.longReflectionSeconds) {
      annotations.push(`spent ${item.elapsedSeconds}s reflecting`);
    }
    if ((item.sliderChanges ?? 0) >= BEHAVIORAL_THRESHOLDS.highSliderActivity) {
      annotations.push(`adjusted slider ${item.sliderChanges} times`);
    }
    if (item.revisited === true && item.scoreChanged === true) {
      annotations.push(`came back and changed from ${item.originalScore} to ${item.score}`);
    } else if (item.revisited === true) {
      annotations.push(`revisited but kept the same score`);
    }

    if (annotations.length > 0) {
      line += ` (${annotations.join("; ")})`;
    }

    message += line + "\n";
  }

  if (totalDurationSeconds) {
    message += `\nTotal time spent on assessment: ${Math.round(totalDurationSeconds / 60)} minutes.\n`;
  }

  if (optionalResponses?.intention?.trim()) {
    message += `\nWhen asked what brought them here, they wrote: "${optionalResponses.intention.trim()}"\n`;
  }

  if (optionalResponses?.context?.trim()) {
    message += `\nWhen asked if there's anything they want the reflection to capture, they wrote: "${optionalResponses.context.trim()}"\n`;
  }

  message += `\nWrite their personalized insight summary.`;
  return message;
}
