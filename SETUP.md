# SETUP — Project 1: AI Structured-Data Extractor

This is **your** checklist. The agent never does these steps — they need your accounts, logins, or secret keys. Do Section 1 once, kick off the build in Section 2, then use Section 3 whenever the agent pauses.

The companion file `PROMPT_1_ai-data-extractor.md` is the one you hand to Windsurf.

---

## 1. Before you start (one-time)

**Accounts & keys** (get these ready — you'll paste the key at Action 2):
- [ ] GitHub account — github.com
- [ ] Vercel account — vercel.com (sign in with GitHub)
- [ ] Anthropic API key with a few dollars of credit — console.anthropic.com  (this is separate from your Claude chat subscription)

**Tools on your machine** (check in a terminal; install anything missing):
- [ ] `node -v` → v20 or higher (nodejs.org)
- [ ] `git --version`
- [ ] `gh --version` (GitHub CLI — cli.github.com)
- [ ] `vercel --version` (`npm i -g vercel`)

**One-time logins** (do these now so the build doesn't stall later):
- [ ] `gh auth login`  → choose GitHub.com, HTTPS, authenticate in browser
- [ ] `vercel login`  → authenticate with the same account

---

## 2. Start the build

1. Create an **empty folder** named `ai-data-extractor`.
2. Put `PROMPT_1_ai-data-extractor.md` inside it and rename it to `PROMPT.md`.
3. Open the folder in Windsurf.
4. In Cascade, choose **Claude Opus 4.8** (or **Claude Sonnet 5**) and make sure it's allowed to run terminal commands.
5. Type exactly this:
   > Read `PROMPT.md` and complete every phase in order. Explain each step in plain language. Stop at every **⏸ PAUSE** and wait for me.

That's it — the agent takes over until it hits a pause.

---

## 3. When the agent pauses — do the matching Action

The agent will stop and say "complete Setup Action N." Find it here.

### Action 1 — (already done in Section 1)
Prerequisites and logins. If the agent's Phase 0 check says something's missing, install/log in, then tell it to continue.

### Action 2 — Add your API key locally
The agent will have created a file called `.env.local.example`. You create the real one:
1. In the project folder, create a file named `.env.local`.
2. Put this in it (paste your real key):
   ```
   ANTHROPIC_API_KEY=sk-ant-...your key...
   ANTHROPIC_MODEL=claude-sonnet-5
   ```
3. Save it. Tell the agent "done, continue."
> `.env.local` is git-ignored, so your key is never uploaded. Never paste your key into the PROMPT file or any committed file.

### Action 3 — (only if it asks) GitHub login
If pushing the repo fails, run `gh auth login`, then tell the agent to retry.

### Action 4 — Add your API key to Vercel (for the live site)
The local key doesn't travel to production; you add it in Vercel:
- Easiest: when the agent runs `vercel env add ANTHROPIC_API_KEY`, paste your key and choose **Production, Preview, and Development**. (Repeat for `ANTHROPIC_MODEL` with value `claude-sonnet-5` if it asks.)
- Or in the browser: Vercel dashboard → your project → **Settings → Environment Variables** → add `ANTHROPIC_API_KEY`.
Then tell the agent "done" so it can deploy to production.

---

## 4. You're done when
- The agent gives you a **live Vercel URL** and a real extraction works on it.
- The GitHub repo `ai-data-extractor` exists and its **Actions tab is green**.
- There's a `README.md`.

Send me the live URL + repo link and I'll add them to your resume.
