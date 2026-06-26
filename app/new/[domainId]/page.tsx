"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { DomainChip } from "@/components/DomainChip";
import { ThinkingDots } from "@/components/ThinkingDots";
import { getDomain } from "@/lib/domains";
import { createSounding } from "@/lib/db";

export default function CapturePage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const { domainId } = use(params);
  const domain = getDomain(domainId);
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [saving, setSaving] = useState(false);

  if (!domain) return notFound();

  async function submit() {
    if (!topic.trim() || saving || !domain) return;
    setSaving(true);
    try {
      const s = await createSounding({
        domainId: domain.id,
        topic,
        context,
      });
      router.push(`/s/${s.id}/diagnostic`);
    } catch {
      setSaving(false);
    }
  }

  return (
    <PageShell domain={domain} maxWidth={760}>
      <button className="ghost" onClick={() => router.push("/new")}>
        ← Change field
      </button>

      <div className="mt-2 flex flex-col gap-2">
        <DomainChip domain={domain} />
        <h1 className="display mt-1 text-[32px] leading-tight" style={{ color: "var(--ink)" }}>
          What&rsquo;s tripping you up?
        </h1>
        <p className="text-[15px]" style={{ color: "var(--muted)" }}>
          Paste the concept, term, or a chunk of text you&rsquo;re trying to understand.
        </p>
      </div>

      <div className="surface mt-5 p-[22px]" style={{ boxShadow: "var(--shadow)" }}>
        <label className="mb-2 block text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
          Concept or passage
        </label>
        <textarea
          className="field"
          rows={4}
          value={topic}
          placeholder="e.g. Bayesian hierarchical models for partial pooling…"
          onChange={(e) => setTopic(e.target.value)}
        />

        <label
          className="mb-2 mt-5 block text-[13px]"
          style={{ color: "var(--muted)" }}
        >
          What are you writing about?{" "}
          <span style={{ fontWeight: 400 }}>(optional, sharpens the session)</span>
        </label>
        <textarea
          className="field"
          rows={2}
          value={context}
          placeholder="e.g. a chapter comparing pooling strategies across study sites"
          onChange={(e) => setContext(e.target.value)}
          style={{ background: "var(--paper)" }}
        />

        <div className="mt-5 flex items-center gap-3">
          <button
            className="btn"
            disabled={!topic.trim() || saving}
            onClick={submit}
          >
            {saving ? "Setting up…" : "Gauge my level"}
          </button>
          {saving && <ThinkingDots />}
        </div>
      </div>
    </PageShell>
  );
}
