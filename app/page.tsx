"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { NavSegment } from "@/components/NavSegment";
import { SoundingCard } from "@/components/SoundingCard";
import { PlumbBob } from "@/components/PlumbBob";
import { applyStaleness } from "@/lib/db";
import { useAuth } from "@/components/AuthProvider";
import { DOMAINS } from "@/lib/domains";
import type { Sounding, SoundingStatus } from "@/lib/types";

type StateFilter = "all" | SoundingStatus;

const STATE_FILTERS: { id: StateFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In progress" },
  { id: "sounded", label: "Sounded" },
  { id: "stale", label: "Stale" },
];

export default function LibraryPage() {
  const { user } = useAuth();
  const [soundings, setSoundings] = useState<Sounding[] | null>(null);
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [domainFilter, setDomainFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSoundings(null);
      return;
    }
    // Stale-check on load: silently flips long-untouched soundings.
    applyStaleness().then(setSoundings).catch(() => setSoundings([]));
  }, [user]);

  const counts = useMemo(() => {
    const list = soundings ?? [];
    return {
      total: list.length,
      inProgress: list.filter((s) => s.status === "in_progress").length,
      stale: list.filter((s) => s.status === "stale").length,
    };
  }, [soundings]);

  const usedDomains = useMemo(() => {
    const ids = new Set((soundings ?? []).map((s) => s.domainId));
    return DOMAINS.filter((d) => ids.has(d.id));
  }, [soundings]);

  const filtered = useMemo(() => {
    return (soundings ?? []).filter((s) => {
      if (stateFilter !== "all" && s.status !== stateFilter) return false;
      if (domainFilter && s.domainId !== domainFilter) return false;
      return true;
    });
  }, [soundings, stateFilter, domainFilter]);

  const countLine = `${counts.total} sounding${counts.total === 1 ? "" : "s"} · ${counts.inProgress} in progress · ${counts.stale} stale`;

  return (
    <PageShell>
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Your soundings</span>
        <h1 className="display text-[34px] leading-tight" style={{ color: "var(--ink)" }}>
          Library
        </h1>
        <p className="chip-mono mt-1 text-[12px]" style={{ color: "var(--muted)" }}>
          {countLine}
        </p>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <NavSegment />
        <Link href="/new" className="btn no-underline">
          ＋ New sounding
        </Link>
      </div>

      {soundings === null ? (
        <p className="chip-mono mt-12 text-[12px]" style={{ color: "var(--muted)" }}>
          Loading…
        </p>
      ) : soundings.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Filters */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex flex-wrap gap-1.5">
              {STATE_FILTERS.map((f) => {
                const active = stateFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setStateFilter(f.id)}
                    className="chip-mono rounded-full px-3 py-1 text-[11px] uppercase tracking-wide transition-colors"
                    style={{
                      background: active ? "var(--accent)" : "var(--card)",
                      color: active ? "#fff" : "var(--muted)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {usedDomains.length > 0 && (
              <div className="flex items-center gap-2">
                {usedDomains.map((d) => {
                  const active = domainFilter === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDomainFilter(active ? null : d.id)}
                      title={d.name}
                      className="flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:scale-110"
                      style={{
                        border: active ? `2px solid ${d.accent}` : "2px solid transparent",
                      }}
                    >
                      <span className="dot" style={{ width: 12, height: 12, background: d.accent }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card grid */}
          {filtered.length === 0 ? (
            <p className="chip-mono mt-10 text-[12px]" style={{ color: "var(--muted)" }}>
              No soundings match this filter.
            </p>
          ) : (
            <div
              className="mt-6 grid gap-[14px]"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(258px, 1fr))" }}
            >
              {filtered.map((s) => (
                <SoundingCard key={s.id} sounding={s} />
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}

function EmptyState() {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <span style={{ color: "var(--accent)" }}>
        <PlumbBob width={28} height={48} />
      </span>
      <h2 className="display mt-5 text-[24px]" style={{ color: "var(--ink)" }}>
        Nothing sounded yet
      </h2>
      <p className="mt-2 max-w-[40ch] text-[15px]" style={{ color: "var(--muted)" }}>
        Hit something in your research you don&rsquo;t fully grasp? Drop it in. Fathom gauges how
        deep you already are, sizes a session to the gap, and keeps a record you can return to.
      </p>
      <Link href="/new" className="btn mt-6 no-underline">
        Take the first sounding
      </Link>
    </div>
  );
}
