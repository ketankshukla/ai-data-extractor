import { describe, expect, it } from "vitest";
import { buildExtractionPrompt, parseExtraction } from "./extract";

describe("parseExtraction", () => {
  it("parses valid JSON", () => {
    const raw = JSON.stringify({
      documentType: "invoice",
      vendor: "Acme Corp",
      date: "2024-01-01",
      currency: "USD",
      lineItems: [],
      subtotal: 100,
      tax: 10,
      total: 110,
      notes: null,
    });

    const result = parseExtraction(raw);

    expect(result.documentType).toBe("invoice");
    expect(result.vendor).toBe("Acme Corp");
    expect(result.total).toBe(110);
  });

  it("parses JSON wrapped in ```json code fences", () => {
    const raw = [
      "```json",
      JSON.stringify({
        documentType: "receipt",
        vendor: null,
        date: null,
        currency: null,
        lineItems: [],
        subtotal: null,
        tax: null,
        total: null,
        notes: null,
      }),
      "```",
    ].join("\n");

    const result = parseExtraction(raw);

    expect(result.documentType).toBe("receipt");
  });

  it("parses JSON wrapped in plain ``` code fences (no language tag)", () => {
    const raw = [
      "```",
      JSON.stringify({
        documentType: "email",
        vendor: null,
        date: null,
        currency: null,
        lineItems: [],
        subtotal: null,
        tax: null,
        total: null,
        notes: null,
      }),
      "```",
    ].join("\n");

    const result = parseExtraction(raw);

    expect(result.documentType).toBe("email");
  });

  it("throws a clear error on non-JSON input", () => {
    expect(() => parseExtraction("this is not json")).toThrowError();
  });
});

describe("buildExtractionPrompt", () => {
  it("includes the user text in the prompt", () => {
    const text = "Invoice #12345 from Acme Corp, total $99.99";
    const prompt = buildExtractionPrompt(text);

    expect(prompt).toContain(text);
  });
});
