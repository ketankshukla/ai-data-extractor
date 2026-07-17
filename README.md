# AI Structured-Data Extractor

Paste messy text — an invoice, receipt, or email — and get back clean, structured JSON extracted by Claude. Results are shown as both a formatted summary and raw JSON.

**Live URL:** https://ai-data-extractor-seven.vercel.app/

*(Screenshot placeholder — add a screenshot of the UI here.)*

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Anthropic SDK](https://www.npmjs.com/package/@anthropic-ai/sdk) (`@anthropic-ai/sdk`)
- [Vitest](https://vitest.dev) for unit tests
- Vercel for hosting, GitHub Actions for CI

## How the AI extraction works

1. The UI (`src/app/page.tsx`) sends the pasted text to `POST /api/extract`.
2. The API route (`src/app/api/extract/route.ts`) builds a prompt with `buildExtractionPrompt` (`src/lib/extract.ts`) instructing Claude to return only a JSON object matching a fixed shape (`documentType`, `vendor`, `date`, `currency`, `lineItems`, `subtotal`, `tax`, `total`, `notes`), using `null` for anything it can't determine.
3. The route calls Claude via the Anthropic SDK, using the model from `process.env.ANTHROPIC_MODEL` (defaults to `claude-sonnet-5`).
4. `parseExtraction` strips any markdown code fences and safely `JSON.parse`s the response, throwing a clear error if the model didn't return valid JSON.
5. The UI renders the parsed result as a formatted card plus a collapsible raw-JSON block.

For a full end-to-end technical deep dive — including *why the same code correctly handles invoices, receipts, and emails with no document-specific logic* — see **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)**.

### Model configuration

| Env var | Purpose | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | — (required) |
| `ANTHROPIC_MODEL` | Model ID to use | `claude-sonnet-5` |

Cheaper alternative: `claude-haiku-4-5-20251001` (the date suffix is required — `claude-haiku-4-5` alone is invalid).

## Local setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` from the template:
   ```bash
   cp .env.local.example .env.local
   ```
3. Add your real Anthropic API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-sonnet-5
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) and paste a sample invoice, receipt, or email.

## Running tests

```bash
npm test
```

Unit tests cover `parseExtraction` (valid JSON, fenced JSON, invalid JSON) and `buildExtractionPrompt` (`src/lib/extract.test.ts`).

## Production build

```bash
npm run build
```

## Deployment

Deployed on [Vercel](https://vercel.com), connected directly to this GitHub repository — every push to `master` triggers a new deployment. Environment variables (`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`) are configured in the Vercel project settings, not committed to the repo.

## How I built this

This project was built phase-by-phase with an AI pair-programming agent (Windsurf/Cascade): scaffold → dependencies/env → pure extraction logic → API route → UI → tests → local verification → GitHub + CI → Vercel deployment → docs. Each phase was run, verified, and committed individually before moving to the next.
