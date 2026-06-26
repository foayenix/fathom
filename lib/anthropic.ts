// Server-side Anthropic Messages API helpers. The API key never reaches the
// client — these run only inside Next.js API routes.

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

function apiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key.",
    );
  }
  return key;
}

// Non-streaming call: returns the concatenated text content.
export async function callClaude(
  system: string,
  messages: AnthropicMessage[],
  maxTokens = 1024,
): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey(),
      "anthropic-version": API_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${detail.slice(0, 400)}`);
  }

  const data = await res.json();
  return (data.content || [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n")
    .trim();
}

// Streaming call: returns the raw upstream SSE Response so a route can pipe it
// through to the client.
export async function streamClaude(
  system: string,
  messages: AnthropicMessage[],
  maxTokens = 1024,
): Promise<Response> {
  return fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey(),
      "anthropic-version": API_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages,
      stream: true,
    }),
  });
}

// Tolerant JSON parse for model output that may be fenced or padded.
export function parseJSON<T = unknown>(text: string): T {
  const clean = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  // Pull the outermost {...} if there's stray prose around it.
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  const slice = start >= 0 && end >= 0 ? clean.slice(start, end + 1) : clean;
  return JSON.parse(slice) as T;
}
