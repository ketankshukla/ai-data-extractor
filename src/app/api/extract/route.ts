import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildExtractionPrompt, parseExtraction } from "@/lib/extract";

export async function POST(request: NextRequest) {
  let text: string | undefined;

  try {
    const body = await request.json();
    text = body?.text;
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON with a 'text' field." },
      { status: 400 }
    );
  }

  if (!text || typeof text !== "string" || text.trim() === "") {
    return Response.json(
      { error: "'text' is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

    const msg = await client.messages.create({
      model,
      max_tokens: 1024,
      system:
        "You extract structured data. Return ONLY valid JSON, no prose, no code fences.",
      messages: [{ role: "user", content: buildExtractionPrompt(text) }],
    });

    const rawText =
      msg.content.find((b) => b.type === "text")?.text ?? "";

    const result = parseExtraction(rawText);

    return Response.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error during extraction.";
    return Response.json(
      { error: `Extraction failed: ${message}` },
      { status: 500 }
    );
  }
}
