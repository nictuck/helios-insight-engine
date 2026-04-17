import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function resolvePromptsDir() {
  // process.cwd() is the repo root in both netlify dev and production
  const cwdPath = path.join(process.cwd(), "netlify", "functions", "prompts");
  if (fs.existsSync(cwdPath)) return cwdPath;
  // Fallback: relative to this file (works when not bundled)
  const filePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "prompts");
  if (fs.existsSync(filePath)) return filePath;
  throw new Error(`prompts/ directory not found (tried cwd and import.meta.url)`);
}

const promptsDir = resolvePromptsDir();

const files = fs.readdirSync(promptsDir).filter((f) => f.endsWith(".md") && f !== "README.md");

export const PROMPTS = Object.fromEntries(
  files.map((f) => [f.replace(/\.md$/, ""), fs.readFileSync(path.join(promptsDir, f), "utf8")])
);

export const DEFAULT_PERSONALITY = "grounded-coach";

if (!PROMPTS[DEFAULT_PERSONALITY]) {
  throw new Error(`Default personality '${DEFAULT_PERSONALITY}' not found in prompts/`);
}
