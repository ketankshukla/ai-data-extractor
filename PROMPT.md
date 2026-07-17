# BUILD PROMPT — Project 1: AI Structured-Data Extractor

You are a senior full-stack engineer pair-building with a developer who is new to agentic workflows. Build the project described below, end to end, from an empty folder to a live Vercel URL. The developer has a separate setup checklist; at the points below you will pause and ask them to complete a numbered "Setup Action."

## RULES (follow for the entire build)
- Work **one phase at a time, in order.** After each phase: run it, confirm it works, then make a git commit with a clear message. Do not batch phases.
- **Explain each step in plain language** before running it (what the command does, why).
- **Never print, log, or commit secrets.** Keys live in `.env.local` (git-ignored) and Vercel environment variables.
- **Read config from environment variables**, never hardcode keys.
- Keep diffs small. Announce destructive actions before doing them.
- If a command **fails**, stop, show the exact error, explain it, and propose a fix before continuing. Never silently retry.
- At every **⏸ PAUSE**, stop, tell the developer which Setup Action to do, and wait for their confirmation. Do not log in, create accounts, or enter secrets yourself.

## DEFINITION OF DONE (all must be true)
`npm run dev` runs with no errors · `npm test` passes · `npm run build` succeeds · code pushed to a **public** GitHub repo `ai-data-extractor` · GitHub Actions CI green · deployed to Vercel with a working **live URL** where the AI feature works · complete `README.md`.

## PROJECT OVERVIEW
A web app where a user pastes messy text (invoice, receipt, or email) and gets back clean structured JSON extracted by Claude, shown as both a formatted view and raw JSON.

## TECH STACK (use exactly this)
- Next.js (latest, App Router) + TypeScript + Tailwind CSS
- Anthropic SDK (`@anthropic-ai/sdk`)
- Vitest for tests; Vercel hosting; GitHub Actions CI

### Model configuration (exact values)
- Read the model from `process.env.ANTHROPIC_MODEL`, default **`claude-sonnet-5`**.
- Cheaper alternative to mention in the README: **`claude-haiku-4-5-20251001`** (the date suffix is required; `claude-haiku-4-5` alone is invalid).
- If a call returns an "invalid model" error, stop and tell the developer.

---

## PHASE 0 — Prerequisite check
Run and report versions: `node -v` (need v20+), `npm -v`, `git --version`, `gh --version`, `vercel --version`. Check `gh auth status` and `vercel whoami`. If anything is missing or not logged in → **⏸ PAUSE (Setup Action 1)**.

## PHASE 1 — Scaffold
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm --no-import-alias
```
Start the dev server, confirm http://localhost:3000 loads, stop it. **Commit:** `chore: scaffold Next.js app`.

## PHASE 2 — Dependencies and environment
- `npm install @anthropic-ai/sdk` and `npm install -D vitest @vitejs/plugin-react`.
- Create `.env.local.example`:
  ```
  ANTHROPIC_API_KEY=your_key_here
  ANTHROPIC_MODEL=claude-sonnet-5
  ```
- Ensure `.gitignore` ignores `.env*` and `.vercel` (add if missing).
- **⏸ PAUSE (Setup Action 2):** the developer creates `.env.local` with their real key. Wait for confirmation.
- **Commit:** `chore: add deps and env template`.

## PHASE 3 — Core extraction logic (pure, testable)
Create `src/lib/extract.ts`:
- Type `ExtractionResult`: `{ documentType, vendor, date, currency, lineItems: {description, quantity, unitPrice, amount}[], subtotal, tax, total, notes }` using `string|null` / `number|null` for unknowns.
- `buildExtractionPrompt(text: string): string` — instructs Claude to return ONLY valid JSON matching the shape, nulls where unknown.
- `parseExtraction(raw: string): ExtractionResult` — strip code fences, `JSON.parse` in try/catch, throw a clear error on invalid JSON.
Keep the network call OUT of this file. **Commit:** `feat: extraction prompt + safe JSON parser`.

## PHASE 4 — API route
Create `src/app/api/extract/route.ts` (POST):
- Read `{ text }`; 400 on empty.
- Call Anthropic:
  ```ts
  import Anthropic from "@anthropic-ai/sdk";
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
  const msg = await client.messages.create({
    model, max_tokens: 1024,
    system: "You extract structured data. Return ONLY valid JSON, no prose, no code fences.",
    messages: [{ role: "user", content: buildExtractionPrompt(text) }],
  });
  const rawText = msg.content.find(b => b.type === "text")?.text ?? "";
  ```
- Parse with `parseExtraction`, return JSON. try/catch → 500 with a readable message (never leak the key). **Commit:** `feat: /api/extract route`.

## PHASE 5 — UI
In `src/app/page.tsx` (Tailwind): a titled page with a description, a large textarea ("Paste an invoice, receipt, or email"), an "Extract" button (disabled + spinner while loading), a formatted result card, and a collapsible raw-JSON block. Handle/display errors gracefully. **Commit:** `feat: extractor UI`.

## PHASE 6 — Tests
- `vitest.config.ts` + `"test": "vitest run"` in package.json.
- `src/lib/extract.test.ts`: `parseExtraction` handles valid JSON incl. ```json fences; throws on non-JSON; `buildExtractionPrompt` includes the user text.
- `npm test` green. **Commit:** `test: extraction unit tests`.

## PHASE 7 — Local verification
`npm run dev` → paste a sample invoice → confirm real structured JSON. `npm run build` succeeds. Fix any failures before continuing.

## PHASE 8 — GitHub repo + push
Ensure all committed, then:
```bash
gh repo create ai-data-extractor --public --source=. --remote=origin --push
```
If `gh` isn't authenticated → **⏸ PAUSE (Setup Action 3)**. Confirm the repo on GitHub.

## PHASE 9 — CI
Create `.github/workflows/ci.yml`: on push/PR → checkout, Node 20, `npm ci`, `npm run lint`, `npm test`, `npm run build`. Push, confirm the Actions run is **green**; if red, show the log and fix. **Commit:** `ci: add GitHub Actions workflow`.

## PHASE 10 — Deploy to Vercel
```bash
vercel link
vercel
```
- **⏸ PAUSE (Setup Action 4):** the developer adds `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`) to Vercel. Wait for confirmation.
- Then:
```bash
vercel --prod
```
Open the live URL, run one real extraction in production, confirm it works.

## PHASE 11 — README and finish
`README.md`: what it does, live URL, screenshot placeholder, tech stack, how the AI extraction works, local setup (`.env.local`), how to run tests, and a short "How I built this" note. Add MIT `LICENSE`. **Commit:** `docs: README and license`, push. Then report the Definition-of-done checklist as pass/fail.

---

## TROUBLESHOOTING
- **Invalid model error:** use a current ID (`claude-sonnet-5`, `claude-opus-4-8`, `claude-haiku-4-5-20251001`).
- **401 from Anthropic:** key missing/wrong in `.env.local` (local) or Vercel env vars (prod).
- **Model returns non-JSON:** tighten the system prompt; keep the fence-stripping in `parseExtraction`.
- **CI fails on lint:** fix the errors; don't disable the check.
