"use client";

import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { DOMAINS } from "@/lib/domains";

export default function DomainPickerPage() {
  const router = useRouter();

  return (
    <PageShell maxWidth={760}>
      <button className="ghost" onClick={() => router.push("/")}>
        ← Library
      </button>

      <div className="mt-2 flex flex-col gap-1">
        <span className="eyebrow">New sounding</span>
        <h1 className="display text-[32px] leading-tight" style={{ color: "var(--ink)" }}>
          Pick your field
        </h1>
        <p className="mt-1 text-[15px]" style={{ color: "var(--muted)" }}>
          The chrome stays neutral; your field sets the accent for this sounding.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {DOMAINS.map((d) => (
          <button
            key={d.id}
            onClick={() => router.push(`/new/${d.id}`)}
            className="card-hover flex items-center gap-3.5 rounded-[12px] border p-4 text-left"
            style={{ background: "var(--card)", borderColor: "var(--line)" }}
          >
            <span className="dot" style={{ width: 13, height: 13, background: d.accent }} />
            <span>
              <span className="block text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                {d.short}
              </span>
              <span className="block text-[12px]" style={{ color: "var(--muted)" }}>
                {d.name}
              </span>
            </span>
          </button>
        ))}
      </div>
    </PageShell>
  );
}
