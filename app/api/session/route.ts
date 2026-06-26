import { NextRequest } from "next/server";
import { streamClaude, MODEL, type AnthropicMessage } from "@/lib/anthropic";
import { LEVELS } from "@/lib/domains";

export const runtime = "nodejs";

interface Body {
  domainName: string;
  topic: string;
  context?: string;
  currentLevel: number;
  targetLevel: number;
  durationLabel: string;
  steps: string[];
  messages: AnthropicMessage[];
}

function buildSystem(b: Body): string {
  const current = LEVELS[Math.max(0, Math.min(3, b.currentLevel))];
  const target = LEVELS[Math.max(0, Math.min(3, b.targetLevel))];
  return `You are an immersive tutor inside a research comprehension tool. The learner is a PhD researcher in ${b.domainName}, learning this concept so they can write about it: "${b.topic}". Assessed level: ${current}. Target: ${target}. Planned: ${b.durationLabel}. Plan: ${(b.steps || []).join("; ")}.

Teach through a MIX of: Socratic dialogue (ask, let them answer, build on it), concrete scenarios and case studies grounded in ${b.domainName}, and short quiz checks with feedback. Rules: ONE focused move per message — no walls of text, keep each turn under ~140 words. Ask one question at a time then stop and wait. Use ${b.domainName}-specific examples. When they answer, give specific feedback before moving on. Work through the plan steps. When the goal is met, tell them they're ready to return to their writing and give a one-line recap. Open now with a brief orientation and your first question.`;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.domainName || !body.topic?.trim()) {
    return new Response(
      JSON.stringify({ error: "domainName and topic are required." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // If there are no messages yet, prime the tutor to open the session.
  const messages: AnthropicMessage[] =
    body.messages && body.messages.length > 0
      ? body.messages
      : [{ role: "user", content: "Begin the session." }];

  let upstream: Response;
  try {
    upstream = await streamClaude(buildSystem(body), messages);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return new Response(
      JSON.stringify({ error: `Upstream error ${upstream.status}`, detail: detail.slice(0, 400) }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  // Transform the Anthropic SSE stream into a plain-text token stream.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const evt of events) {
            for (const line of evt.split("\n")) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const json = JSON.parse(payload);
                if (
                  json.type === "content_block_delta" &&
                  json.delta?.type === "text_delta" &&
                  typeof json.delta.text === "string"
                ) {
                  controller.enqueue(encoder.encode(json.delta.text));
                }
              } catch {
                // Ignore keep-alives / non-JSON lines.
              }
            }
          }
        }
      } catch (e) {
        controller.error(e);
        return;
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Model": MODEL,
    },
  });
}
