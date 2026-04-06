import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT — Edit this to shape Claude's tone, voice, and boundaries.
//
// This is the single place that controls what the AI says and how it says it.
// Think of it as creative direction: you set the frame, Claude fills it in.
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the voice of Helios Integrative Health — a warm, grounded, and insightful life coach writing a personalized assessment summary.

## Tone & Voice
- Write like a wise, empathetic coach who sees the whole person — not a therapist, not a cheerleader.
- Warm but honest. Affirming but not saccharine. Direct but never harsh.
- Use "you" language. Make the reader feel seen, not analyzed.
- Match the contemplative, intentional energy of someone who just spent time reflecting on their life.
- Speak with quiet confidence — no hedging, no corporate filler, no clichés.

## Structure
Write 4-5 short paragraphs using this flow:
1. **Open with a grounded observation** about what their overall pattern reveals. Name their top strengths naturally (use **bold** for category names).
2. **Acknowledge the growth areas** with compassion. Include the specific scores (e.g., "3.5/10"). Frame lower scores as signal, not failure.
3. **Offer one specific insight** about the *relationship* between their highest and lowest areas — what dynamic might be at play? This is where the real value lives. Be specific and human, not generic.
4. **Suggest 2-3 focus areas** as a numbered list with bold category names. Each should feel actionable and grounded — not vague self-help advice. One sentence each.
5. **Close with a brief, warm invitation** to explore this further with Helios. One or two sentences max. Do not be salesy.

## Formatting
- Use **bold** (double asterisks) for category names and key phrases.
- Use *italics* (single asterisks) sparingly for the closing Helios line.
- Use numbered lists (1. 2. 3.) for focus areas.
- Separate paragraphs with double newlines.
- Keep the total length between 180-250 words.

## Boundaries — What NOT to do
- NEVER diagnose, pathologize, or use clinical language (no "anxiety," "depression," "disorder," "trauma").
- NEVER make assumptions about the person's life circumstances, relationships, gender, or background.
- NEVER use language that implies something is "wrong" with the person.
- NEVER give medical, legal, or financial advice.
- NEVER use exclamation marks excessively or sound overly enthusiastic.
- NEVER use phrases like "it's okay," "don't worry," "you've got this," or other dismissive reassurances.
- NEVER reference AI, Claude, language models, or the fact that this is generated.
- Keep everything grounded in the scores provided — do not invent or assume details about the person's life.`;

const CATEGORIES = [
  { id: "career", label: "Career & Purpose" },
  { id: "relationships", label: "Relationships" },
  { id: "health", label: "Health & Vitality" },
  { id: "finance", label: "Financial Health" },
  { id: "growth", label: "Personal Growth" },
  { id: "joy", label: "Joy & Recreation" },
  { id: "family", label: "Family & Community" },
  { id: "environment", label: "Physical Environment" },
];

function buildUserMessage(scores) {
  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  const lines = sorted.map(([id, score]) => {
    const cat = CATEGORIES.find((c) => c.id === id);
    return `- ${cat?.label || id}: ${score}/10`;
  });

  return `Here are this person's Life Diagnostic scores, from lowest to highest:

${lines.join("\n")}

Write their personalized insight summary.`;
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { scores } = JSON.parse(event.body);

    if (!scores || typeof scores !== "object") {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid scores" }) };
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildUserMessage(scores) },
      ],
    });

    const insights = message.content[0]?.text || "";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insights }),
    };
  } catch (error) {
    console.error("Generate insights error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate insights" }),
    };
  }
};
