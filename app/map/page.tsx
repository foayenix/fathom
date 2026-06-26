"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { NavSegment } from "@/components/NavSegment";
import { DomainChip } from "@/components/DomainChip";
import { AccentScope } from "@/components/AccentScope";
import { DOMAINS, getDomain, levelName, LEVEL_BLURB } from "@/lib/domains";
import { applyStaleness, deepestLevel } from "@/lib/db";
import { resumeHref, formatDate } from "@/lib/nav";
import type { DomainId, Sounding } from "@/lib/types";

// Fixed cluster centres (as % of the canvas) — one per domain.
const CENTERS: Record<DomainId, { x: number; y: number }> = {
  biomed: { x: 18, y: 22 },
  cs: { x: 50, y: 17 },
  psych: { x: 82, y: 24 },
  law: { x: 18, y: 56 },
  econ: { x: 50, y: 52 },
  eng: { x: 82, y: 58 },
  social: { x: 32, y: 84 },
  hum: { x: 70, y: 84 },
};

const CANVAS_HEIGHT = 560;

interface Node {
  sounding: Sounding;
  left: string;
  top: string;
  size: number;
}

export default function MapPage() {
  const router = useRouter();
  const [soundings, setSoundings] = useState<Sounding[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    applyStaleness().then(setSoundings).catch(() => setSoundings([]));
  }, []);

  // Spiral each domain's soundings around its centre.
  const nodes = useMemo<Node[]>(() => {
    if (!soundings) return [];
    const perDomain: Record<string, number> = {};
    return soundings.map((s) => {
      const k = perDomain[s.domainId] ?? 0;
      perDomain[s.domainId] = k + 1;
      const center = CENTERS[s.domainId] ?? { x: 50, y: 50 };
      const angle = k * 2.4;
      const radius = k === 0 ? 0 : 18 + k * 13;
      const ox = Math.cos(angle) * radius;
      const oy = Math.sin(angle) * radius;
      const size = 14 + deepestLevel(s) * 7;
      return {
        sounding: s,
        left: `calc(${center.x}% + ${ox.toFixed(1)}px)`,
        top: `calc(${center.y}% + ${oy.toFixed(1)}px)`,
        size,
      };
    });
  }, [soundings]);

  const tally = useMemo(() => {
    const counts: Record<string, number> = {};
    (soundings ?? []).forEach((s) => {
      counts[s.domainId] = (counts[s.domainId] ?? 0) + 1;
    });
    return DOMAINS.filter((d) => counts[d.id]).map((d) => ({
      domain: d,
      count: counts[d.id],
    }));
  }, [soundings]);

  const selected = soundings?.find((s) => s.id === selectedId) ?? null;

  return (
    <PageShell>
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Across your thesis</span>
        <h1 className="display text-[34px] leading-tight" style={{ color: "var(--ink)" }}>
          Research map
        </h1>
        <p className="chip-mono mt-1 text-[12px]" style={{ color: "var(--muted)" }}>
          {(soundings ?? []).length} concept{(soundings ?? []).length === 1 ? "" : "s"} · clustered
          by field · sized by depth
        </p>
      </div>

      <div className="mt-6">
        <NavSegment />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Canvas */}
        <div
          className="surface relative overflow-hidden"
          style={{
            height: CANVAS_HEIGHT,
            boxShadow: "var(--shadow)",
            backgroundImage:
              "radial-gradient(circle, var(--line) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        >
          {/* Domain labels */}
          {DOMAINS.map((d) => {
            if (!(soundings ?? []).some((s) => s.domainId === d.id)) return null;
            const c = CENTERS[d.id];
            return (
              <span
                key={d.id}
                className="chip-mono absolute uppercase"
                style={{
                  left: `${c.x}%`,
                  top: `${c.y}%`,
                  transform: "translate(-50%, -64px)",
                  fontSize: "9.5px",
                  letterSpacing: "0.1em",
                  color: "var(--muted)",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {d.short}
              </span>
            );
          })}

          {/* Nodes */}
          {nodes.map(({ sounding: s, left, top, size }) => {
            const domain = getDomain(s.domainId);
            const accent = domain?.accent ?? "#888";
            const isSel = s.id === selectedId;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                title={s.topic}
                className="absolute rounded-full transition-transform hover:scale-110"
                style={{
                  left,
                  top,
                  width: size,
                  height: size,
                  transform: "translate(-50%, -50%)",
                  background:
                    s.status === "stale"
                      ? "transparent"
                      : accent,
                  opacity: s.status === "in_progress" ? 0.5 : 1,
                  border:
                    s.status === "stale"
                      ? `1.5px dashed ${accent}`
                      : isSel
                        ? "2px solid var(--ink)"
                        : "1px solid rgba(0,0,0,0.08)",
                  boxShadow: isSel ? "0 0 0 3px var(--soft)" : "none",
                  cursor: "pointer",
                }}
              />
            );
          })}

          {(soundings ?? []).length === 0 && soundings !== null && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[14px]" style={{ color: "var(--muted)" }}>
                Your map fills in as you sound concepts.
              </p>
            </div>
          )}
        </div>

        {/* Detail / legend */}
        <aside className="surface p-5" style={{ boxShadow: "var(--shadow)" }}>
          {selected ? (
            <NodeDetail sounding={selected} onOpen={() => router.push(resumeHref(selected))} />
          ) : (
            <Legend tally={tally} />
          )}
        </aside>
      </div>
    </PageShell>
  );
}

function NodeDetail({
  sounding,
  onOpen,
}: {
  sounding: Sounding;
  onOpen: () => void;
}) {
  const domain = getDomain(sounding.domainId);
  return (
    <AccentScope domain={domain}>
      <div className="flex flex-col gap-3">
        {domain && <DomainChip domain={domain} />}
        <h2 className="display text-[19px] leading-tight" style={{ color: "var(--ink)" }}>
          {sounding.topic}
        </h2>
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>
          <span className="chip-mono uppercase" style={{ color: "var(--ink)", fontWeight: 600 }}>
            {levelName(sounding.currentLevel)}
          </span>{" "}
          — {LEVEL_BLURB[sounding.currentLevel]}
        </p>

        <div>
          <span className="eyebrow">Level history</span>
          <LevelHistory sounding={sounding} />
        </div>

        <p className="chip-mono text-[10.5px] uppercase" style={{ color: "var(--muted)" }}>
          Last touched {formatDate(sounding.updatedAt)}
        </p>

        <div className="mt-1 flex flex-col gap-2">
          <button className="btn" onClick={onOpen}>
            Open
          </button>
          {sounding.status === "stale" && (
            <button className="ghost text-center" onClick={onOpen}>
              Re-gauge
            </button>
          )}
        </div>
      </div>
    </AccentScope>
  );
}

function LevelHistory({ sounding }: { sounding: Sounding }) {
  // Stepped bars — soundings move up in discrete levels. Opacity rises with
  // recency. Fall back to the current reading if no history yet.
  const history =
    sounding.levelHistory.length > 0
      ? sounding.levelHistory
      : [{ level: sounding.currentLevel, ts: sounding.updatedAt }];

  return (
    <div className="mt-2 flex items-end gap-1.5" style={{ height: 64 }}>
      {history.map((h, i) => {
        const opacity = 0.4 + (0.6 * (i + 1)) / history.length;
        const heightPct = ((h.level + 1) / 4) * 100;
        return (
          <div
            key={i}
            className="flex-1 rounded-t-sm"
            title={`${levelName(h.level)} · ${formatDate(h.ts)}`}
            style={{
              height: `${heightPct}%`,
              minWidth: 10,
              background: "var(--accent)",
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}

function Legend({
  tally,
}: {
  tally: { domain: (typeof DOMAINS)[number]; count: number }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="eyebrow">Reading the map</span>
        <ul className="mt-3 flex flex-col gap-2.5 text-[13px]" style={{ color: "var(--muted)" }}>
          <li className="flex items-center gap-2.5">
            <span className="rounded-full" style={{ width: 18, height: 18, background: "var(--accent)" }} />
            <span>Solid — sounded</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="rounded-full" style={{ width: 18, height: 18, background: "var(--accent)", opacity: 0.5 }} />
            <span>Faded — in progress</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span
              className="rounded-full"
              style={{ width: 18, height: 18, border: "1.5px dashed var(--accent)" }}
            />
            <span>Dashed — stale</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="flex items-center gap-1">
              <span className="rounded-full" style={{ width: 10, height: 10, background: "var(--muted)" }} />
              <span className="rounded-full" style={{ width: 20, height: 20, background: "var(--muted)" }} />
            </span>
            <span>Bigger — deeper</span>
          </li>
        </ul>
        <p className="mt-3 text-[12px]" style={{ color: "var(--muted)" }}>
          Colour marks the field; position clusters concepts by hat. Click any node for its history.
        </p>
      </div>

      {tally.length > 0 && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <span className="eyebrow">By field</span>
          <ul className="mt-2.5 flex flex-col gap-1.5">
            {tally.map(({ domain, count }) => (
              <li
                key={domain.id}
                className="flex items-center justify-between text-[13px]"
                style={{ color: "var(--ink)" }}
              >
                <span className="flex items-center gap-2">
                  <span className="dot" style={{ width: 10, height: 10, background: domain.accent }} />
                  {domain.short}
                </span>
                <span className="chip-mono" style={{ color: "var(--muted)" }}>
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
