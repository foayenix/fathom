"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { DomainChip } from "@/components/DomainChip";
import { DepthGauge } from "@/components/DepthGauge";
import { ThinkingDots } from "@/components/ThinkingDots";
import { getDomain, levelName, LEVEL_BLURB } from "@/lib/domains";
import { getSounding, patchSounding } from "@/lib/db";
import type { Sounding } from "@/lib/types";

export default function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [sounding, setSounding] = useState<Sounding | null>(null);
  const [missing, setMissing] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [error, setError] = useState("");
  const requested = useRef(false);

  useEffect(() => {
    let active = true;
    getSounding(id).then((s) => {
      if (!active) return;
      if (!s) {
        setMissing(true);
        return;
      }
      setSounding(s);
      if (s.steps.length === 0 && !requested.current) {
        requested.current = true;
        assess(s);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function assess(s: Sounding) {
    const domain = getDomain(s.domainId);
    if (!domain) return;
    setAssessing(true);
    setError("");
    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainName: domain.name,
          topic: s.topic,
          questions: s.questions,
          answers: s.answers,
        }),
      });
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      const updated = await patchSounding(s.id, {
        currentLevel: data.currentLevel,
        targetLevel: data.targetLevel,
        readout: data.readout,
        durationMinutes: data.durationMinutes,
        durationLabel: data.durationLabel,
        steps: data.steps,
      });
      if (updated) setSounding(updated);
    } catch {
      setError("Couldn't build the plan. Try again.");
    }
    setAssessing(false);
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
  const ready = sounding && sounding.steps.length > 0;
  const resuming = (sounding?.progress ?? 0) > 0;

  return (
    <PageShell domain={domain} maxWidth={760}>
      <button
        className="ghost"
        onClick={() => sounding && router.push(`/s/${sounding.id}/diagnostic`)}
      >
        ← Diagnostic
      </button>

      {sounding && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {domain && <DomainChip domain={domain} />}
          {ready && (
            <>
              <span className="chip chip-mono">
                {levelName(sounding.currentLevel)} → {levelName(sounding.targetLevel)}
              </span>
              <span className="chip chip-mono">{sounding.durationLabel}</span>
            </>
          )}
        </div>
      )}

      <h1 className="display mt-3 text-[32px] leading-tight" style={{ color: "var(--ink)" }}>
        Where you&rsquo;re standing
      </h1>

      {assessing && !ready ? (
        <div className="surface mt-5 flex items-center gap-3 p-[22px]" style={{ boxShadow: "var(--shadow)" }}>
          <ThinkingDots />
          <span className="text-[14px]" style={{ color: "var(--muted)" }}>
            Reading your answers and sizing the session…
          </span>
        </div>
      ) : error && !ready ? (
        <div className="surface mt-5 p-[22px]" style={{ boxShadow: "var(--shadow)" }}>
          <span
            className="rounded-[10px] px-3 py-2 text-[13px]"
            style={{ background: "#FBEAEA", color: "#8B2D2D", border: "1px solid #E8B4B4" }}
          >
            {error}
          </span>
          <button
            className="ghost ml-3 underline"
            onClick={() => sounding && assess(sounding)}
          >
            Retry
          </button>
        </div>
      ) : ready && sounding ? (
        <div className="surface mt-5 p-[22px]" style={{ boxShadow: "var(--shadow)" }}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="shrink-0">
              <span className="eyebrow mb-2 block">Reading</span>
              <DepthGauge
                reading={sounding.currentLevel}
                targetLevel={sounding.targetLevel}
                height={260}
              />
            </div>

            <div className="flex-1">
              <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink)" }}>
                You&rsquo;re at <strong>{levelName(sounding.currentLevel)}</strong> —{" "}
                {LEVEL_BLURB[sounding.currentLevel]}. Target:{" "}
                <strong>{levelName(sounding.targetLevel)}</strong>. {sounding.readout}
              </p>

              <span className="chip chip-mono mt-4">{sounding.durationLabel}</span>

              <ol className="mt-4 list-none p-0">
                {sounding.steps.map((s, i) => (
                  <li
                    key={i}
                    className="flex gap-3 py-2.5 text-[14px]"
                    style={{
                      borderTop: i === 0 ? "none" : "1px solid var(--line)",
                      color: "var(--ink)",
                    }}
                  >
                    <span
                      className="chip-mono min-w-[18px] text-[12px] font-bold"
                      style={{ color: "var(--accent)" }}
                    >
                      0{i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex items-center gap-4">
                <button
                  className="btn"
                  onClick={() => router.push(`/s/${sounding.id}/session`)}
                >
                  {resuming ? "Resume session" : "Start the session"}
                </button>
                <button
                  className="ghost"
                  onClick={() => router.push(`/s/${sounding.id}/diagnostic`)}
                >
                  Redo answers
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
