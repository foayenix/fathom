"use client";

import { useState } from "react";
import Link from "next/link";
import { getDomain, levelName, LEVEL_BLURB } from "@/lib/domains";
import { resumeHref, formatDate } from "@/lib/nav";
import type { Sounding } from "@/lib/types";
import { AccentScope } from "./AccentScope";
import { CompactGauge } from "./DepthGauge";
import { StateBadge } from "./StateBadge";

export function SoundingCard({
  sounding,
  onDelete,
}: {
  sounding: Sounding;
  onDelete?: (id: string) => Promise<void> | void;
}) {
  const domain = getDomain(sounding.domainId);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function remove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!onDelete || removing) return;
    setRemoving(true);
    try {
      await onDelete(sounding.id);
    } finally {
      setRemoving(false);
      setConfirming(false);
    }
  }

  return (
    <AccentScope domain={domain}>
      <Link
        href={resumeHref(sounding)}
        className="group block h-full no-underline"
      >
        <article
          className="card-hover relative flex h-full flex-col gap-3 rounded-[14px] border p-[18px]"
          style={{
            background: "var(--card)",
            borderColor: "var(--line)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="chip-mono flex items-center gap-1.5 text-[11px] uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              <span className="dot" style={{ width: 9, height: 9, background: domain?.accent }} />
              {domain?.short}
            </span>
            <span className="flex items-center gap-1.5">
              <StateBadge status={sounding.status} />
              {onDelete && (
                <button
                  aria-label="Remove sounding"
                  title="Remove sounding"
                  className="reveal-on-hover flex h-5 w-5 items-center justify-center rounded-full text-[13px] leading-none opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                  style={{ color: "var(--muted)" }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirming(true);
                  }}
                >
                  ×
                </button>
              )}
            </span>
          </div>

          <h3
            className="display text-[18px] leading-tight"
            style={{ color: "var(--ink)" }}
          >
            {sounding.topic.length > 90
              ? sounding.topic.slice(0, 88) + "…"
              : sounding.topic}
          </h3>

          {sounding.context && (
            <p
              className="text-[13px] leading-snug"
              style={{ color: "var(--muted)" }}
            >
              {sounding.context.length > 100
                ? sounding.context.slice(0, 98) + "…"
                : sounding.context}
            </p>
          )}

          <div className="mt-auto flex flex-col gap-2 pt-1">
            <CompactGauge
              currentLevel={sounding.currentLevel}
              targetLevel={sounding.targetLevel}
            />
            <div
              className="chip-mono text-[10.5px] uppercase tracking-wide"
              style={{ color: "var(--muted)" }}
            >
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                {levelName(sounding.currentLevel)}
              </span>
              {" — "}
              {LEVEL_BLURB[sounding.currentLevel]}
            </div>
            <div
              className="chip-mono text-[10.5px] uppercase tracking-wide"
              style={{ color: "var(--muted)" }}
            >
              {formatDate(sounding.updatedAt)}
            </div>
          </div>

          {confirming && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[14px] p-4 text-center"
              style={{ background: "var(--card)" }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <p className="text-[14px]" style={{ color: "var(--ink)" }}>
                Remove this sounding?
              </p>
              <p className="text-[12px]" style={{ color: "var(--muted)" }}>
                Its session history and level record go with it.
              </p>
              <div className="flex items-center gap-3">
                <button className="btn" style={{ padding: "8px 14px", fontSize: 13 }} onClick={remove} disabled={removing}>
                  {removing ? "Removing…" : "Remove"}
                </button>
                <button
                  className="ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirming(false);
                  }}
                >
                  Keep
                </button>
              </div>
            </div>
          )}
        </article>
      </Link>
    </AccentScope>
  );
}
