"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { DomainChip } from "@/components/DomainChip";
import { DepthGauge } from "@/components/DepthGauge";
import { ThinkingDots } from "@/components/ThinkingDots";
import { getDomain, levelName } from "@/lib/domains";
import { getSounding, patchSounding } from "@/lib/db";
import { useAuth } from "@/components/AuthProvider";
import type { Message, Sounding } from "@/lib/types";

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [sounding, setSounding] = useState<Sounding | null>(null);
  const [missing, setMissing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [progress, setProgress] = useState(0);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [partial, setPartial] = useState("");
  const [error, setError] = useState("");

  const started = useRef(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const soundingRef = useRef<Sounding | null>(null);
  soundingRef.current = sounding;

  // Load and seed from stored state.
  useEffect(() => {
    if (!user) return;
    let active = true;
    getSounding(id).then((s) => {
      if (!active) return;
      if (!s) {
        setMissing(true);
        return;
      }
      setSounding(s);
      setMessages(s.messages);
      setProgress(s.progress);
      // Open the tutor only on a fresh, never-started session.
      if (s.messages.length === 0 && !started.current) {
        started.current = true;
        run([], s, s.progress);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partial, streaming]);

  // Stream a tutor reply for the given history, then persist.
  async function run(history: Message[], s: Sounding, currentProgress: number) {
    const domain = getDomain(s.domainId);
    if (!domain) return;
    setStreaming(true);
    setPartial("");
    setError("");
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainName: domain.name,
          topic: s.topic,
          context: s.context,
          currentLevel: s.currentLevel,
          targetLevel: s.targetLevel,
          durationLabel: s.durationLabel,
          steps: s.steps,
          messages: history,
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || data?.error || "bad response");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setPartial(acc);
      }

      const stepCount = Math.max(1, s.steps.length);
      const nextProgress = Math.min(1, currentProgress + 1 / (stepCount * 2));
      const finalMessages: Message[] = [
        ...history,
        { role: "assistant", content: acc },
      ];

      setMessages(finalMessages);
      setPartial("");
      setProgress(nextProgress);

      await patchSounding(s.id, {
        messages: finalMessages,
        progress: nextProgress,
      });
    } catch (e) {
      const detail = e instanceof Error ? e.message : "";
      setError(detail ? `Reply failed — ${detail}` : "Reply failed. Try sending again.");
    }
    setStreaming(false);
  }

  function send() {
    const text = input.trim();
    const s = soundingRef.current;
    if (!text || streaming || !s) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    run(next, s, progress);
  }

  async function markSounded() {
    const s = soundingRef.current;
    if (!s || progress < 0.6) return;
    const reached = s.targetLevel;
    await patchSounding(s.id, {
      status: "sounded",
      currentLevel: reached,
      progress: Math.max(progress, 1),
      messages,
      levelHistory: [...s.levelHistory, { level: reached, ts: Date.now() }],
    });
    router.push("/");
  }

  async function saveExit() {
    const s = soundingRef.current;
    if (s) {
      await patchSounding(s.id, { messages, progress });
    }
    router.push("/");
  }

  if (missing) {
    return (
      <PageShell maxWidth={1080}>
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
  const reading = sounding
    ? sounding.currentLevel +
      (sounding.targetLevel - sounding.currentLevel) * progress
    : 0;
  const pctToTarget = Math.round(progress * 100);
  const stepsDone = sounding
    ? Math.floor(progress * sounding.steps.length + 1e-6)
    : 0;

  return (
    <PageShell domain={domain} maxWidth={1080}>
      {sounding && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {domain && <DomainChip domain={domain} />}
            <span className="chip chip-mono">
              {levelName(sounding.currentLevel)} → {levelName(sounding.targetLevel)}
            </span>
            <span className="chip chip-mono">{sounding.durationLabel}</span>
            <button
              className="ghost ml-auto"
              onClick={() => router.push(`/s/${sounding.id}/plan`)}
            >
              ← Plan
            </button>
          </div>

          <h1 className="display mt-3 text-[24px] leading-tight" style={{ color: "var(--ink)" }}>
            {sounding.topic.length > 80 ? sounding.topic.slice(0, 78) + "…" : sounding.topic}
          </h1>

          <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
            {/* Chat column */}
            <div className="flex flex-col">
              <div className="flex flex-col gap-3.5">
                {messages.map((m, i) => (
                  <Bubble key={i} role={m.role} content={m.content} />
                ))}
                {streaming && partial && (
                  <Bubble role="assistant" content={partial} />
                )}
                {streaming && !partial && (
                  <div
                    className="bubble-in self-start rounded-[13px] px-4 py-3"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--line)",
                      borderTopLeftRadius: 4,
                    }}
                  >
                    <ThinkingDots />
                  </div>
                )}
                <div ref={chatEnd} />
              </div>

              {error && (
                <div
                  className="mt-4 rounded-[10px] px-3 py-2.5 text-[13px]"
                  style={{ background: "#FBEAEA", color: "#8B2D2D", border: "1px solid #E8B4B4" }}
                >
                  {error}
                </div>
              )}

              <div className="mt-4 flex items-end gap-2.5">
                <textarea
                  className="field"
                  rows={2}
                  value={input}
                  placeholder="Type your answer…"
                  style={{ minHeight: 48 }}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <button className="btn" disabled={!input.trim() || streaming} onClick={send}>
                  Send
                </button>
              </div>
              <p className="chip-mono mt-2 text-[11px]" style={{ color: "var(--muted)" }}>
                Enter to send · Shift+Enter for a new line
              </p>
            </div>

            {/* Instrument panel */}
            <aside className="lg:sticky lg:top-[88px] lg:self-start">
              <div className="surface p-5" style={{ boxShadow: "var(--shadow)" }}>
                <span className="eyebrow">Live reading</span>
                <div className="mt-3 flex justify-center">
                  <DepthGauge
                    reading={reading}
                    targetLevel={sounding.targetLevel}
                    height={240}
                  />
                </div>
                <p
                  className="chip-mono mt-4 text-center text-[11px] uppercase tracking-wide"
                  style={{ color: "var(--muted)" }}
                >
                  Reading:{" "}
                  <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                    {levelName(reading)}
                  </span>{" "}
                  · {pctToTarget}% to target
                </p>

                <div className="mt-5">
                  <span className="eyebrow">Plan</span>
                  <ul className="mt-2 list-none p-0">
                    {sounding.steps.map((s, i) => {
                      const done = i < stepsDone;
                      return (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 py-1.5 text-[13px]"
                          style={{ color: done ? "var(--ink)" : "var(--muted)" }}
                        >
                          <span
                            className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]"
                            style={{
                              background: done ? "var(--accent)" : "transparent",
                              border: done ? "none" : "1.5px solid var(--line)",
                              color: "#fff",
                            }}
                          >
                            {done ? "✓" : ""}
                          </span>
                          <span>{s}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <button
                    className="btn"
                    disabled={progress < 0.6}
                    onClick={markSounded}
                    title={progress < 0.6 ? "Keep going — unlocks at 60%" : undefined}
                  >
                    Mark as sounded
                  </button>
                  <button className="ghost text-center" onClick={saveExit}>
                    Save &amp; exit
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </PageShell>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isBot = role === "assistant";
  return (
    <div
      className="bubble-in px-4 py-3 text-[15px]"
      style={{
        whiteSpace: "pre-wrap",
        maxWidth: "min(90%, 560px)",
        alignSelf: isBot ? "flex-start" : "flex-end",
        background: isBot ? "var(--card)" : "var(--accent)",
        color: isBot ? "var(--ink)" : "#fff",
        border: isBot ? "1px solid var(--line)" : "none",
        borderRadius: 13,
        borderTopLeftRadius: isBot ? 4 : 13,
        borderTopRightRadius: isBot ? 13 : 4,
        lineHeight: 1.5,
      }}
    >
      {content}
    </div>
  );
}
