"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { DomainChip } from "@/components/DomainChip";
import { ThinkingDots } from "@/components/ThinkingDots";
import { getDomain } from "@/lib/domains";
import { getSounding, patchSounding } from "@/lib/db";
import type { Sounding } from "@/lib/types";

export default function DiagnosticPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [sounding, setSounding] = useState<Sounding | null>(null);
  const [missing, setMissing] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const requested = useRef(false);

  // Load the sounding, then generate questions on first visit.
  useEffect(() => {
    let active = true;
    getSounding(id).then((s) => {
      if (!active) return;
      if (!s) {
        setMissing(true);
        return;
      }
      setSounding(s);
      setAnswers(s.answers.length ? s.answers : s.questions.map(() => ""));
      if (s.questions.length === 0 && !requested.current) {
        requested.current = true;
        generate(s);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function generate(s: Sounding) {
    const domain = getDomain(s.domainId);
    if (!domain) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainName: domain.name,
          topic: s.topic,
          context: s.context,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "bad response");
      const { questions } = data;
      const updated = await patchSounding(s.id, {
        questions,
        answers: questions.map(() => ""),
      });
      if (updated) {
        setSounding(updated);
        setAnswers(questions.map(() => ""));
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : "";
      setError(
        detail
          ? `Couldn't generate the diagnostic — ${detail}`
          : "Couldn't generate the diagnostic. Try again.",
      );
    }
    setGenerating(false);
  }

  async function seePlan() {
    if (!sounding) return;
    await patchSounding(sounding.id, { answers });
    router.push(`/s/${sounding.id}/plan`);
  }

  if (missing) {
    return (
      <PageShell maxWidth={760}>
        <p className="mt-10 text-[15px]" style={{ color: "var(--muted)" }}>
          That sounding couldn&rsquo;t be found.{" "}
          <button className="ghost underline" onClick={() => router.push("/")}>
            Back to library
          </button>
        </p>
      </PageShell>
    );
  }

  const domain = sounding ? getDomain(sounding.domainId) : undefined;

  return (
    <PageShell domain={domain} maxWidth={760}>
      <button
        className="ghost"
        onClick={() => router.push(`/new/${sounding?.domainId ?? ""}`)}
      >
        ← Back
      </button>

      <div className="mt-2 flex flex-col gap-2">
        {domain && <DomainChip domain={domain} />}
        <h1 className="display mt-1 text-[32px] leading-tight" style={{ color: "var(--ink)" }}>
          A few quick questions
        </h1>
        <p className="text-[15px]" style={{ color: "var(--muted)" }}>
          Answer in a sentence or two — even &ldquo;no idea&rdquo; is useful. Be honest; it sizes
          the plan.
        </p>
      </div>

      <div className="surface mt-5 p-[22px]" style={{ boxShadow: "var(--shadow)" }}>
        {generating && (sounding?.questions.length ?? 0) === 0 ? (
          <div className="flex items-center gap-3 py-6">
            <ThinkingDots />
            <span className="text-[14px]" style={{ color: "var(--muted)" }}>
              Tuning questions to your concept…
            </span>
          </div>
        ) : (
          <>
            {sounding?.questions.map((q, i) => (
              <div key={i} className="mb-5">
                <div className="chip-mono text-[12px] font-bold" style={{ color: "var(--accent)" }}>
                  0{i + 1}
                </div>
                <div className="mb-2 mt-1.5 text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                  {q}
                </div>
                <textarea
                  className="field"
                  rows={2}
                  value={answers[i] ?? ""}
                  onChange={(e) => {
                    const next = [...answers];
                    next[i] = e.target.value;
                    setAnswers(next);
                  }}
                />
              </div>
            ))}

            {(sounding?.questions.length ?? 0) > 0 && (
              <button className="btn" onClick={seePlan}>
                See my plan
              </button>
            )}
          </>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-3">
            <span
              className="rounded-[10px] px-3 py-2 text-[13px]"
              style={{ background: "#FBEAEA", color: "#8B2D2D", border: "1px solid #E8B4B4" }}
            >
              {error}
            </span>
            <button
              className="ghost underline"
              onClick={() => sounding && generate(sounding)}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
