import { NextRequest, NextResponse } from "next/server";
import { callClaude, parseJSON } from "@/lib/anthropic";

export const runtime = "nodejs";

interface Body {
  domainName: string;
  topic: string;
  questions: string[];
  answers: string[];
}

interface Assessment {
  currentLevel: number;
  targetLevel: number;
  readout: string;
  durationMinutes: number;
  durationLabel: string;
  steps: string[];
}

function clampLevel(n: unknown): 0 | 1 | 2 | 3 {
  const v = Math.round(Number(n));
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(3, v)) as 0 | 1 | 2 | 3;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { domainName, topic, questions, answers } = body;
  if (!domainName || !topic?.trim() || !Array.isArray(questions)) {
    return NextResponse.json(
      { error: "domainName, topic and questions are required." },
      { status: 400 },
    );
  }

  const qa = questions
    .map((q, i) => `Q: ${q}\nA: ${answers?.[i]?.trim() || "(no answer)"}`)
    .join("\n\n");

  const system = `You assess a PhD researcher's understanding and design a sized learning session. Domain: ${domainName}. Concept: "${topic}". Levels: Surface(0)=recognise terms, Working(1)=use in context, Deep(2)=explain why and connect, Fluent(3)=could teach or apply to novel problems. Read the diagnostic Q&A. Judge current level honestly. Pick a realistic target (usually Deep=2). Size the session: small gap 10-15min, medium 20-35min, large 45-60min. Return ONLY valid JSON, no markdown: {"currentLevel":0-3,"targetLevel":0-3,"readout":"one candid sentence on where they are and main gap","durationMinutes":int,"durationLabel":"e.g. 25-min focused session","steps":["3-5 short plan step phrases"]}

DIAGNOSTIC:
${qa}`;

  try {
    const out = await callClaude(system, [
      { role: "user", content: "Assess and plan." },
    ]);
    const parsed = parseJSON<Assessment>(out);

    const currentLevel = clampLevel(parsed.currentLevel);
    let targetLevel = clampLevel(parsed.targetLevel);
    // Target should never sit below the current reading.
    if (targetLevel < currentLevel) targetLevel = currentLevel;

    const steps = Array.isArray(parsed.steps) ? parsed.steps.slice(0, 5) : [];
    const durationMinutes =
      Number.isFinite(parsed.durationMinutes) && parsed.durationMinutes > 0
        ? Math.round(parsed.durationMinutes)
        : 25;

    return NextResponse.json({
      currentLevel,
      targetLevel,
      readout: parsed.readout || "",
      durationMinutes,
      durationLabel: parsed.durationLabel || `${durationMinutes}-min focused session`,
      steps,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Couldn't build the plan.", detail: message },
      { status: 502 },
    );
  }
}
