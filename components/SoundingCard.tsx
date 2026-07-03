"use client";

import Link from "next/link";
import { getDomain, levelName, LEVEL_BLURB } from "@/lib/domains";
import { resumeHref, formatDate } from "@/lib/nav";
import type { Sounding } from "@/lib/types";
import { AccentScope } from "./AccentScope";
import { CompactGauge } from "./DepthGauge";
import { StateBadge } from "./StateBadge";

export function SoundingCard({ sounding }: { sounding: Sounding }) {
  const domain = getDomain(sounding.domainId);

  return (
    <AccentScope domain={domain}>
      <Link
        href={resumeHref(sounding)}
        className="group block h-full no-underline"
      >
        <article
          className="card-hover flex h-full flex-col gap-3 rounded-[14px] border p-[18px]"
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
            <StateBadge status={sounding.status} />
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
        </article>
      </Link>
    </AccentScope>
  );
}
