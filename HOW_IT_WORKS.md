# 🔬 How This App Works

> 🤖 See also: [`THOUGHT_PROCESS.md`](./THOUGHT_PROCESS.md) for the reasoning behind *how this was built*, step by step.

This document explains, end to end, how a single, unchanging piece of code can correctly extract structured data from three very different kinds of documents — a clean invoice, a messy ASCII receipt, and a billing email — with no special-case logic for any of them.

## � The short answer (explained like you're 5)

Imagine a super-smart friend who has read millions of invoices, receipts, and emails.

You don't teach this friend "if you see the word INVOICE, do X; if you see a receipt, do Y." You just hand them any piece of paper and say:

> "Whatever this is, tell me who it's from, what date it is, what was bought, and the total. Write your answer using **this exact fill-in-the-blank form** — and leave a blank empty if you can't find that answer."

Your friend already knows what invoices/receipts/emails generally look like, from everything they've read before. So the *same* instruction works no matter what you hand over. The "smartness" lives in the friend's brain (the AI model), not in your instruction sheet (our code). Our code never changes because it never needs to know what the document *is* — it only needs to describe the **shape of the answer** it wants back.

## ❓ Why the same code handles every document type

Our code (`src/lib/extract.ts`, `src/app/api/extract/route.ts`) contains **zero branching logic** for document types. There is no `if (looksLikeInvoice) {...} else if (looksLikeReceipt) {...}`. Instead:

1. We give the AI a **fixed JSON schema** to fill in (`documentType`, `vendor`, `date`, `lineItems`, `subtotal`, `tax`, `total`, etc.), with the rule: *use `null` for anything you can't confidently find, don't invent data.*
2. We hand the AI the **raw, unmodified text** — table-formatted invoice, ASCII-art receipt, or prose email, doesn't matter.
3. The AI (Claude) was trained on enormous amounts of real-world text, including countless invoices, receipts, and emails in every format imaginable. It uses that general language understanding to recognize things like "this number near the word TOTAL is probably the total" or "this line with a quantity and a price is a line item" — regardless of layout, spacing, or whether it's a table or plain sentences.
4. The AI writes back **JSON only**, matching our schema, because we told it to.

This pattern is called **schema-first / zero-shot extraction**: we don't train or code any document-specific rules; we just describe the desired *output shape* and trust the model's general reasoning to map arbitrary input text onto that shape.

## 🔁 Full request flow, end to end

```
┌─────────────┐        1. paste text, click "Extract"
│   Browser   │───────────────────────────────────────┐
│ (page.tsx)  │                                        │
└─────────────┘                                        ▼
      ▲                                    ┌────────────────────────┐
      │ 8. JSON result rendered            │ POST /api/extract      │
      │    (formatted card + raw JSON)     │ (route.ts)             │
      │                                    └────────────────────────┘
      │                                        │ 2. validate `text`
      │                                        │    (400 if empty)
      │                                        ▼
      │                             ┌──────────────────────────┐
      │                             │ buildExtractionPrompt()  │
      │                             │ (extract.ts)              │
      │                             │ wraps raw text + schema  │
      │                             │ + rules into one prompt  │
      │                             └──────────────────────────┘
      │                                        │ 3. send prompt
      │                                        ▼
      │                             ┌──────────────────────────┐
      │                             │ Anthropic API (Claude)   │
      │                             │ model = ANTHROPIC_MODEL  │
      │                             │ reads text, understands  │
      │                             │ it via general language  │
      │                             │ knowledge, writes JSON   │
      │                             └──────────────────────────┘
      │                                        │ 4. raw text response
      │                                        ▼
      │                             ┌──────────────────────────┐
      │                             │ parseExtraction()        │
      │                             │ (extract.ts)              │
      │                             │ strip ``` fences if any  │
      │                             │ JSON.parse(...)          │
      │                             │ throw clear error if     │
      │                             │ invalid JSON              │
      │                             └──────────────────────────┘
      │                                        │ 5. typed result
      │                                        │    or error
      │                                        ▼
      │                             ┌──────────────────────────┐
      │                             │ route.ts returns          │
      │                             │ Response.json(result)     │
      │                             │ or 500 with safe message  │
      │                             └──────────────────────────┘
      │                                        │ 6. HTTP response
      └────────────────────────────────────────┘
```

### 🪜 Step by step:

1. **You paste text and click Extract** — `src/app/page.tsx` calls `fetch("/api/extract", { method: "POST", body: JSON.stringify({ text }) })`.
2. **The API route validates input** — `src/app/api/extract/route.ts` checks `text` exists and isn't empty; returns `400` if it is.
3. **A prompt is built** — `buildExtractionPrompt(text)` (`src/lib/extract.ts`) wraps your raw text together with the JSON schema and rules ("use null if unknown", "don't invent data", "return ONLY JSON").
4. **Claude is called** — the Anthropic SDK sends that prompt plus a system message ("You extract structured data...") to the model named in `ANTHROPIC_MODEL` (default `claude-sonnet-5`).
5. **Claude reads and reasons** — this is the step where "understanding" happens. Claude doesn't run our code to detect document type; it uses its own trained knowledge of language to map whatever text it sees onto the requested fields.
6. **The response is parsed safely** — `parseExtraction(rawText)` strips any accidental ` ```json ` fences and calls `JSON.parse`. If Claude ever returns something that isn't valid JSON, this throws a clear error instead of silently failing.
7. **The result is returned** — as plain JSON, or a `500` with a safe error message if anything failed (the API key itself is never included in any response).
8. **The browser renders it** — `page.tsx` stores the parsed result in React state and displays it as a formatted card (vendor, dates, line items table, totals) plus a collapsible raw-JSON block.

## 💾 Where does the data go?

> 🚫 **Nowhere persistent.** Every step above happens per-request, in memory. Nothing is written to a database or disk — see the note in `README.md` about this being fully stateless.

## 🏁 Key takeaway

The "intelligence" that lets one code path handle an invoice, a receipt, and an email equally well isn't in `extract.ts` or `route.ts` — it's in Claude itself. Our code's job is narrow and mechanical: build a clear instruction (prompt), send it, and safely parse whatever comes back into a predictable shape the UI can render. That's the entire trick behind "AI extraction" apps like this one.
