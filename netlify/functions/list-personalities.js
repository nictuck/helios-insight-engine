import { PROMPTS, DEFAULT_PERSONALITY } from "./lib/load-prompts.js";

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personalities: Object.keys(PROMPTS),
      default: DEFAULT_PERSONALITY,
    }),
  };
};
