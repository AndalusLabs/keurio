"use server";

import Anthropic, { APIError } from "@anthropic-ai/sdk";
import type {
  ContentBlockParam,
  MessageParam,
} from "@anthropic-ai/sdk/resources/messages";

/**
 * Default if `ANTHROPIC_MODEL` is unset.
 * See https://docs.anthropic.com/en/docs/about-claude/models/all-models
 */
const DEFAULT_MODEL = "claude-sonnet-4-6";

function extractAssistantText(
  content: { type: string; text?: string }[]
): string {
  return content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function describeAnthropicFailure(e: unknown, model: string): string {
  if (e instanceof APIError) {
    if (e.status === 401) {
      return "Invalid or missing API key (401). Set ANTHROPIC_API_KEY in .env.local and restart the dev server.";
    }
    if (e.status === 400 || e.status === 404) {
      const m = e.message.toLowerCase();
      if (m.includes("model") || m.includes("not_found")) {
        return `Model not accepted (${model}). Set ANTHROPIC_MODEL in .env.local to a current id from console.anthropic.com (e.g. claude-sonnet-4-6 or claude-haiku-4-5).`;
      }
    }
    if (e.status === 429) {
      return "Rate limited — try again in a moment.";
    }
    const short = e.message.replace(/\s+/g, " ").trim();
    return short.length > 220 ? `${short.slice(0, 217)}…` : short;
  }
  if (e instanceof Error) {
    const short = e.message.replace(/\s+/g, " ").trim();
    return short.length > 220 ? `${short.slice(0, 217)}…` : short;
  }
  return "Request failed.";
}

export async function generateFinding(input: {
  checklistItem: string;
  rawNotes: string;
  photoBase64?: string;
  photoMediaType?: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  inspectionType: string;
}): Promise<{ text: string } | { error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    return { error: "AI service is not configured." };
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
  const client = new Anthropic({ apiKey });

  const prompt = `Je bent een professionele inspecteur die een inspectierapport schrijft.

Inspectie type: ${input.inspectionType}
Checklist punt: ${input.checklistItem}
Ruwe notitie van technicus: ${input.rawNotes}

Schrijf een professionele bevinding in het Nederlands voor dit inspectiepunt.
- Maximaal 2-3 zinnen
- Professionele maar duidelijke taal
- Inclusief aanbeveling indien nodig
- Geen opsommingstekens, gewone lopende tekst
- Geen inleiding of afsluiting, alleen de bevinding zelf`;

  const content: ContentBlockParam[] = [];

  if (input.photoBase64?.trim() && input.photoMediaType) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: input.photoMediaType,
        data: input.photoBase64.trim(),
      },
    });
  }

  content.push({ type: "text", text: prompt });

  const messages: MessageParam[] = [{ role: "user", content }];

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 300,
      messages,
    });
    const text = extractAssistantText(
      response.content as { type: string; text?: string }[]
    );
    if (!text) {
      return { error: "Empty response from model — try again or change ANTHROPIC_MODEL." };
    }
    return { text };
  } catch (e) {
    console.error("[generateFinding]", e);
    return { error: describeAnthropicFailure(e, model) };
  }
}
