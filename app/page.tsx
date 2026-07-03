"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { NavSegment } from "@/components/NavSegment";
import { SoundingCard } from "@/components/SoundingCard";
import { PlumbBob } from "@/components/PlumbBob";
import { applyStaleness, deleteSounding } from "@/lib/db";
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
  const [loadError, setLoadError] = useState(false);
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  function load() {
    setLoadError(false);
    setSoundings(null);
    // Stale-check on load: silently flips long-untouched soundings.
    applyStaleness()
      .then(setSoundings)
      .catch(() => setLoadError(true));
  }

  useEffect(() => {
    if (!user) {
      setSoundings(null);
      return;
    }
    load();
  }, [user]);

  async function removeSounding(id: string) {
    try {
      await deleteSounding(id);
      setSoundings((prev) => prev?.filter((s) => s.id !== id) ?? prev);
    } catch {
      // Row stays; the card simply closes its confirm state.
    }
  }

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
    const q = query.trim().toLowerCase();
    return (soundings ?? []).filter((s) => {
      if (stateFilter !== "all" && s.status !== stateFilter) return false;
      if (domainFilter && s.domainId !== domainFilter) return false;
      if (
        q &&
        !s.topic.toLowerCase().includes(q) &&
        !(s.context ?? "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [soundings, stateFilter, domainFilter, query]);

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

      {loadError ? (
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <span className="error-strip">
            Couldn&rsquo;t load your soundings — they&rsquo;re safe, this is just a
            connection problem.
          </span>
          <button className="ghost underline" onClick={load}>
            Retry
          </button>
        </div>
      ) : soundings === null ? (
        <LoadingGrid />
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
                    aria-pressed={active}
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
                      aria-label={`Filter by ${d.name}`}
                      aria-pressed={active}
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

            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search soundings…"
              aria-label="Search soundings"
              className="field ml-auto"
              style={{ width: 210, padding: "6px 11px", fontSize: 13 }}
            />
          </div>

          {/* Card grid */}
          {filtered.length === 0 ? (
            <p className="chip-mono mt-10 text-[12px]" style={{ color: "var(--muted)" }}>
              {query.trim()
                ? `Nothing matches “${query.trim()}”.`
                : "No soundings match this filter."}
            </p>
          ) : (
            <div
              className="mt-6 grid gap-[14px]"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(258px, 1fr))" }}
            >
              {filtered.map((s) => (
                <SoundingCard key={s.id} sounding={s} onDelete={removeSounding} />
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}

function LoadingGrid() {
  return (
    <div
      className="mt-6 grid gap-[14px]"
      aria-hidden="true"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(258px, 1fr))" }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-[14px] border p-[18px]"
          style={{ background: "var(--card)", borderColor: "var(--line)" }}
        >
          <div className="flex items-center justify-between">
            <span className="skeleton h-3 w-16" />
            <span className="skeleton h-4 w-20 rounded-full" />
          </div>
          <span className="skeleton h-5 w-4/5" />
          <span className="skeleton h-4 w-3/5" />
          <span className="skeleton mt-4 h-2 w-full rounded-full" />
          <span className="skeleton h-3 w-2/5" />
        </div>
      ))}
    </div>
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
