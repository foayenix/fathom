import { NextRequest, NextResponse } from "next/server";
import { callClaude, parseJSON } from "@/lib/anthropic";

export const runtime = "nodejs";

interface Body {
  domainName: string;
  topic: string;
  context?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { domainName, topic, context } = body;
  if (!domainName || !topic?.trim()) {
    return NextResponse.json(
      { error: "domainName and topic are required." },
      { status: 400 },
    );
  }

  const system = `You are the diagnostic engine for a research comprehension tool. The learner is a PhD researcher in ${domainName}. They want to understand this concept well enough to write about it: "${topic}".${
    context ? ` Writing context: "${context}".` : ""
  } Generate exactly 4 open-ended diagnostic questions that gauge how deeply they already understand THIS specific concept — ranging from basic recognition through mechanism and application. Each answerable in 1-3 sentences. Tuned to ${domainName}. Return ONLY valid JSON, no markdown, no preamble: {"questions":["...","...","...","..."]}`;

  try {
    const out = await callClaude(system, [
      { role: "user", content: "Generate the diagnostic." },
    ]);
    const parsed = parseJSON<{ questions: string[] }>(out);
    const questions = (parsed.questions || []).slice(0, 4);
    if (questions.length < 4) {
      throw new Error("Model returned fewer than 4 questions.");
    }
    return NextResponse.json({ questions });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Couldn't generate the diagnostic.", detail: message },
      { status: 502 },
    );
  }
}
