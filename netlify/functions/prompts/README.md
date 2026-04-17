# Personality Prompts

Each `.md` file in this directory is a complete system prompt for a distinct Helios voice.

## Rules

- **Full override** — each file is a self-contained system prompt. There is no shared scaffolding; what's in the file is exactly what Claude receives.
- **Filename = personality ID** — the filename without `.md` is the `personality` field clients pass in the request body. `grounded-coach.md` → `"personality": "grounded-coach"`.
- **To add a new voice** — drop a new `.md` file here and commit. No code changes needed; the loader discovers files at module load.
- **Git is the version log** — do not suffix filenames with `-v2`, `-v3`, etc. Use `git log -- prompts/<name>.md` to view history for a specific voice.

## Current personalities

| ID | File | Description |
|----|------|-------------|
| `grounded-coach` | `grounded-coach.md` | Warm, grounded life coach. Default voice. |
| `systems-observer` | `systems-observer.md` | Systems-literate observer. Patterns, dynamics, leverage points. No affirmation, no CTA. |
