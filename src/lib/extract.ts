export interface LineItem {
  description: string | null;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
}

export interface ExtractionResult {
  documentType: string | null;
  vendor: string | null;
  date: string | null;
  currency: string | null;
  lineItems: LineItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  notes: string | null;
}

/**
 * Builds the prompt sent to Claude, instructing it to extract structured
 * data from the given raw text and return ONLY valid JSON matching the
 * ExtractionResult shape.
 */
export function buildExtractionPrompt(text: string): string {
  return `You are extracting structured data from a messy document (invoice, receipt, or email).

Return ONLY a single valid JSON object, with no prose, no explanation, and no markdown code fences, matching exactly this shape:

{
  "documentType": string | null,
  "vendor": string | null,
  "date": string | null,
  "currency": string | null,
  "lineItems": [
    { "description": string | null, "quantity": number | null, "unitPrice": number | null, "amount": number | null }
  ],
  "subtotal": number | null,
  "tax": number | null,
  "total": number | null,
  "notes": string | null
}

Rules:
- Use null for any field you cannot confidently determine.
- "lineItems" should be an empty array if no line items are found.
- Do not invent data that is not present in the text.
- Return ONLY the JSON object, nothing else.

Document text:
"""
${text}
"""`;
}

/**
 * Parses the raw text returned by Claude into an ExtractionResult.
 * Strips markdown code fences (```json ... ``` or ``` ... ```) if present,
 * then attempts to JSON.parse the result. Throws a clear error on invalid JSON.
 */
export function parseExtraction(raw: string): ExtractionResult {
  const stripped = stripCodeFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw new Error(
      "Failed to parse extraction result: the model did not return valid JSON."
    );
  }

  return parsed as ExtractionResult;
}

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return trimmed;
}
