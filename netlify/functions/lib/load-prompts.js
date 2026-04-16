import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const promptsDir = path.join(__dirname, "..", "prompts");

const files = fs.readdirSync(promptsDir).filter((f) => f.endsWith(".md") && f !== "README.md");

export const PROMPTS = Object.fromEntries(
  files.map((f) => [f.replace(/\.md$/, ""), fs.readFileSync(path.join(promptsDir, f), "utf8")])
);

export const DEFAULT_PERSONALITY = "grounded-coach";

if (!PROMPTS[DEFAULT_PERSONALITY]) {
  throw new Error(`Default personality '${DEFAULT_PERSONALITY}' not found in prompts/`);
}
