# 🧠 The Thinking Process Behind This Build

> **⚠️ Rendering note:** GitHub sanitizes custom CSS out of markdown (no forced black backgrounds or custom font sizes on github.com, for security reasons). This doc uses everything GitHub *does* support to stay legible and visually distinct: big headers, emoji, blockquote callouts, tables, and horizontal rules.

> **What this document is:** A step-by-step reconstruction of the actual reasoning used to build this app — not a tutorial, a **replay of the decisions**, including the snags and how they were resolved. If you're starting a similar project from scratch, read the 🎯 section at the bottom for the generalizable checklist.

---

## 🗺️ Part 1 — How the build actually unfolded

### 🔍 Step 0 — Read everything before touching anything

**Thinking:** Before running a single command, both `PROMPT.md` and `SETUP.md` were read in full. Why both? `PROMPT.md` is the *what/how* (phases, rules, tech stack, exact model names), but `SETUP.md` is the *human's side* — which pauses map to which real-world actions (logins, keys). Skipping either risks either breaking a rule or stalling at a pause with no idea what the human needs to do.

**Action:** Converted every phase in `PROMPT.md` into an explicit todo list, one phase mapped to one todo item — so nothing could be silently skipped or batched, and progress was always visible.

> 💡 **Callout:** A checklist isn't bureaucracy — it's what lets you *stop mid-task*, come back later, and know exactly where you left off.

---

### ⚙️ Step 1 — Phase 0: Prerequisite check

**Thinking:** Five independent, read-only checks (`node -v`, `npm -v`, `git --version`, `gh --version`, `vercel --version`, plus two auth checks). None of these depend on each other — so they were run **in parallel**, not one-by-one. Sequential execution here would just be wasted wall-clock time.

**Result:** Everything was already installed and authenticated — no pause needed. ✅

---

### 🧱 Step 2 — Phase 1: Scaffold hits two real snags

**Snag #1 — interactive prompt, no stdin:**
`npx create-next-app@latest` asked *"Ok to proceed? (y)"* and just hung. There's no way to type "y" into a detached background process.

> 🛠️ **Fix:** Root-caused it as an `npx` install-confirmation prompt, not a scaffolding issue — added `--yes` to skip the confirmation entirely, rather than trying to hack around sending keystrokes.

**Snag #2 — non-empty directory refusal:**
`create-next-app` refused to scaffold because `PROMPT.md` and `SETUP.md` already existed in the folder.

> 🛠️ **Fix:** The *minimal, reversible* fix — move both files **out** of the folder temporarily, scaffold into the now-empty directory, then move them back. Deleting and recreating them was never considered; that would risk data loss for no benefit.

**Thinking about the framework itself:** The scaffold generated an `AGENTS.md` with an explicit warning: *"This is NOT the Next.js you know... read `node_modules/next/dist/docs/` before writing any code."* This matched an existing standing rule. Rather than treat that as boilerplate noise, it was taken literally — the actual installed docs (`route-handlers.md`, `upgrading/version-16.md`) were read before writing the API route in Phase 4, specifically to check whether `NextRequest`/`request.json()` patterns had changed in Next 16.

> 💡 **Callout:** When a tool tells you *"I'm not what you think I am,"* believe it — training data has a knowledge cutoff; the installed package on disk is ground truth.

**Verification before committing:** Before the "chore: scaffold Next.js app" commit, the dev server was actually started and hit with a real HTTP request (`Invoke-WebRequest` → `200`) — not just assumed to work because `next dev` printed "Ready."

---

### 🔐 Step 3 — Phase 2: Dependencies and environment

**Snag — a rule conflict inside the `.gitignore` itself:**
The brief required creating `.env.local.example` (a committable *template*) **and** ensuring `.env*` stays gitignored (to protect real secrets). But `.env*` as a pattern also blocked the example file from ever being committed — the tool literally refused to write it.

> 🛠️ **Fix:** Added a single negation line, `!.env.local.example`, to the `.gitignore`. This is the smallest possible change that satisfies *both* rules simultaneously — real secrets stay ignored, the template doesn't.

**Respecting the pause exactly as instructed:** Once `.env.local` existed, its *existence* was confirmed with `Test-Path` — its *contents* were never read. The rule "never print/log secrets" was treated as absolute, not "unless it seems safe this one time."

---

### 🧪 Step 4 — Phase 3: Extraction logic, designed for a future you haven't reached yet

**Thinking:** `extract.ts` was written with **zero network calls**, deliberately. At the time of writing this file, Phase 6 (tests) was still four phases away — but pure, I/O-free functions are trivially unit-testable, while anything touching `fetch`/the Anthropic SDK requires mocking or real API calls. Designing for testability *before* you're forced to test is cheaper than retrofitting it later.

---

### 🔌 Step 5 — Phase 4: The API route, cross-checked against real docs

**Thinking:** The brief supplied exact code for the Anthropic call — but rather than copy-paste blindly, it was checked against the Route Handler docs already read in Step 2, specifically to confirm `NextRequest`, `request.json()`, and `Response.json()` weren't deprecated in Next 16. They weren't — but the check happened *before* trusting the code, not after something broke.

---

### 🎨 Step 6 — Phase 5: UI, then a cheap sanity check

**Thinking:** After writing the UI, `npx tsc --noEmit` was run — a fast, lightweight type-check — *before* running the slower full `next build`. Fast feedback loops first, expensive ones second.

---

### ✅ Step 7 — Phase 6: Tests — never claim green without running them

**Thinking:** Five tests were written covering exactly what the brief asked for (valid JSON, ` ```json ` fences, plain ` ``` ` fences, invalid JSON, prompt content) — then **actually executed** (`npm test`) and the real "5 passed" output was read before committing. "I wrote tests" and "the tests pass" are different claims; only the second one was made, and only after evidence.

---

### 🔬 Step 8 — Phase 7: Local verification — trust real calls over vibes

**Thinking:** Unit tests only prove `parseExtraction` works on *fake* JSON strings. They say nothing about whether the *actual* Anthropic API, with the *actual* prompt, on a *real* sample invoice, returns something usable. So a real HTTP request was sent to the local `/api/extract` route with a fabricated sample invoice, and the *actual* structured JSON that came back was inspected.

**Snag — confusing terminal output:** One polling attempt returned an empty result even though the request had (invisibly) succeeded. Rather than concluding "it's broken," the dev server's own log output was cross-checked as a second source of truth (`POST /api/extract 200 in 58s`) — and a follow-up request confirmed the real JSON. Two independent signals agreeing is more trustworthy than one ambiguous one.

Then `npm run build` was run as a *second, independent* check — a passing dev server doesn't guarantee a passing production build (different compiler pass, static analysis, etc.).

---

### 🚀 Step 9 — Phase 8 & 9: GitHub + CI

**Thinking:** Since Phase 0 had already empirically confirmed `gh` was authenticated, no guessing was needed — the repo was created and pushed directly. For CI, `npm run lint` was run **locally first**, before ever pushing the workflow file — catching a lint failure locally costs seconds; catching it in CI costs a round trip and a red build. Only after a clean local lint was the workflow pushed, and `gh run watch` was used to wait for and *confirm* an actual green run rather than assuming GitHub Actions would just work.

---

### ⚖️ Step 10 — Phase 10: A real conflict, surfaced instead of guessed

**The conflict:** `PROMPT.md` explicitly said to run `vercel link` / `vercel --prod` from the CLI. A separate standing rule said the opposite: *"Do not deploy directly to Vercel — deployment is done via GitHub."*

> 🛠️ **Resolution:** Neither instruction was silently prioritized. The conflict was surfaced directly, with two clear options, and the human made the call. This matters most exactly where it happened here — deployment and account/infrastructure actions are not the place to guess at someone's intent.

Once deployed via the GitHub integration, the *specific* Definition-of-Done requirement — "confirm the AI feature works in production" — was checked precisely: a real POST request with a real sample invoice was sent to the **live production URL**, not just a check that the homepage loaded.

---

### 📝 Step 11 — Phase 11 and beyond: Docs that prove claims, not just state them

**Thinking:** Rather than writing generic "paste text, get JSON" docs, three genuinely different example documents were created (a clean table invoice, a messy ASCII receipt, and a prose billing email) specifically so the central claim — *one unchanging code path handles all three* — could be **demonstrated**, not just asserted.

When later asked *"where is the data stored?"* and *"is this agentic?"*, both answers were grounded by re-reading the actual files (`route.ts`, `page.tsx`) and citing exact line ranges, rather than answering from general knowledge about how apps "usually" work.

---

## 🎯 Part 2 — How to think about a project like this from scratch

If you were starting this yourself, here's the transferable process, stripped of this-project-specific details:

| # | Principle | Why it matters |
|---|---|---|
| 1️⃣ | **Read the entire spec before writing code.** Find the non-negotiables (secrets handling, exact versions, definition of done) first. | You can't follow a rule you haven't seen yet. |
| 2️⃣ | **Turn requirements into a checklist**, one item in progress at a time. | Makes "where am I?" always answerable, even after a break. |
| 3️⃣ | **Small, verifiable, reversible steps.** Explain → do → verify with a real check → commit → move on. | Big untested leaps are where hours get lost debugging three things at once. |
| 4️⃣ | **Distrust memorized assumptions about fast-moving tools.** Check the installed docs/source, especially if the tool warns you it changed. | Training data has a cutoff; the disk doesn't. |
| 5️⃣ | **Separate pure logic from I/O ("glue") code.** | Pure logic is cheap to unit test; glue code needs real integration checks. |
| 6️⃣ | **"Compiles" ≠ "works."** For anything hitting an external API, make a real call with real example data before trusting it. | Type-checkers can't see what an LLM actually returns at runtime. |
| 7️⃣ | **Treat secrets as radioactive.** Verify presence, never read contents; keep templates and real files on opposite sides of `.gitignore`. | One accidental `cat .env.local` is one too many. |
| 8️⃣ | **When instructions conflict, stop and ask** — don't silently pick a side, especially for deployments, accounts, or spending money. | The cost of asking is one message; the cost of guessing wrong on a deploy can be much higher. |
| 9️⃣ | **Use CI as an independent second opinion.** "Works on my machine" and "works in a clean environment" are different claims. | Green CI catches what your local shortcuts hide. |
| 🔟 | **Keep commits scoped to one phase/concern.** | Makes any future regression trivial to bisect. |

---

## 🔁 The one-sentence version

> **Explain the plan, do the smallest useful piece of it, verify with a real check — not a guess — commit, and repeat; and the moment two instructions disagree, ask instead of assuming.**
