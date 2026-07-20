# 📖 User Guide — AI Structured-Data Extractor

🔗 **Live app:** https://ai-data-extractor-seven.vercel.app

This guide shows you how to use the app, what kinds of text it handles well, and what to do if something goes wrong.

## 🧭 How to use it

1. Open the live URL.
2. Paste any invoice, receipt, or billing email into the text box — messy formatting is fine.
3. Click **Extract**.
4. Read the formatted **Extracted result** card (document type, vendor, dates, line items, totals), then expand **Raw JSON** if you want the exact structured object Claude returned.

The same code path handles all three document styles below with **no document-specific logic** — see [`HOW_IT_WORKS.md`](./HOW_IT_WORKS.md) for why.

## 📂 Try the sample documents

Three genuinely different example documents ship in `/invoices` — paste any of them in to see the extractor handle very different layouts with the same result shape:

- `invoices/invoice-1-clean.txt` — a clean, table-formatted invoice (Northwind Traders). Expect **Total Due: $3,274.53**, 3 line items, vendor `Northwind Traders LLC`.
- `invoices/invoice-2-messy-receipt.txt` — an ASCII-art grocery store receipt (Greenleaf Grocery). Expect **TOTAL 34.18**, 6 line items, no formal "invoice number."
- `invoices/invoice-3-email-style.txt` — a billing email in prose (CloudStack Hosting). Expect **Total charged: $544.80**, vendor `CloudStack Hosting` (or similar), invoice number `CS-88213`.

## ✅ What works well

- Real invoices, receipts, and billing emails — printed, scanned-as-text, or emailed.
- Documents with clear totals, line items, and dates, even if the layout is inconsistent or ASCII-art-like.
- Any currency or locale the model recognizes from the text itself.

## ⚠️ What won't work well

- Text with **no financial structure at all** (e.g. a random paragraph) — the model will return mostly `null` fields rather than inventing numbers.
- **Images or scanned PDFs** — this app only accepts pasted plain text; it does not run OCR on an uploaded file.
- Extremely long documents may hit token limits — trim to the relevant billing section if extraction seems cut off.

## 💡 Tips for best results

- Paste the **full** document, including headers/footers — vendor name and dates are often near the top or bottom, not just in the line-item table.
- If a field comes back `null`, that's by design: the model is instructed to use `null` rather than guess when it can't confidently find a value.
- Check the **Raw JSON** panel if the formatted card looks incomplete — it shows exactly what the model returned, useful for spotting whether a field was truly missing from the source text.

## 🛠️ Troubleshooting

- **Error banner instead of a result:** usually a server-side issue (e.g. a missing/invalid `ANTHROPIC_API_KEY` on the deployment, or the model returned non-JSON). The error text will not contain the actual key.
- **All fields `null`:** the pasted text likely didn't contain recognizable invoice/receipt/email structure — try one of the sample documents in `/invoices` to confirm the app itself is working.
- **Extract button stays disabled:** the text box is empty — paste some text first.
