import Anthropic from "@anthropic-ai/sdk";
import { PROMPTS, DEFAULT_PERSONALITY } from "./lib/load-prompts.js";
import { buildUserMessage } from "./lib/build-user-message.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { scores, behavioral, totalDurationSeconds, optionalResponses, personality } = JSON.parse(event.body);

    if (!scores || typeof scores !== "object") {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid scores" }) };
    }

    let resolvedId = DEFAULT_PERSONALITY;
    if (personality) {
      if (PROMPTS[personality]) {
        resolvedId = personality;
      } else {
        console.warn(`Unknown personality '${personality}', falling back to '${DEFAULT_PERSONALITY}'`);
      }
    }

    const systemPrompt = PROMPTS[resolvedId];

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: "user", content: buildUserMessage({ scores, behavioral, totalDurationSeconds, optionalResponses }) },
      ],
    });

    const insights = message.content[0]?.text || "";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insights, personality: resolvedId }),
    };
  } catch (error) {
    console.error("Generate insights error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate insights" }),
    };
  }
};
