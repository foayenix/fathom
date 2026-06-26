"use client";

import { LEVELS } from "@/lib/domains";

// Vertical depth gauge — the signature instrument. Depth reads downward:
// Surface at the top, Fluent at the bottom. A sounding line (plumb bob) drops
// to the current reading; accent fills the depth reached, a soft tint shows
// the gap zone the session is closing, and a dashed line marks the target.

interface DepthGaugeProps {
  // Continuous current reading, 0–3. In the plan screen this equals the
  // measured currentLevel; in a live session it interpolates toward target.
  reading: number;
  targetLevel: number;
  // Bar geometry.
  height?: number;
  barWidth?: number;
  showLabels?: boolean;
}

// A level value (0–3) maps to a vertical fraction so that reaching a level
// fills its whole band: Surface=0 → 25%, Working=1 → 50%, Deep=2 → 75%,
// Fluent=3 → 100%. Smooth for continuous live readings.
function fillFrac(level: number): number {
  return Math.max(0, Math.min(1, (level + 1) / 4));
}

export function DepthGauge({
  reading,
  targetLevel,
  height = 280,
  barWidth = 58,
  showLabels = true,
}: DepthGaugeProps) {
  const clampedReading = Math.max(0, Math.min(3, reading));
  const clampedTarget = Math.max(0, Math.min(3, targetLevel));

  const readingFrac = fillFrac(clampedReading);
  const targetFrac = fillFrac(clampedTarget);

  const readingY = readingFrac * height;
  const targetY = targetFrac * height;
  const cx = barWidth / 2;

  return (
    <div className="flex items-stretch gap-3">
      {showLabels && (
        <div
          className="chip-mono flex flex-col justify-between text-right uppercase"
          style={{
            fontSize: "9.5px",
            letterSpacing: "0.08em",
            color: "var(--muted)",
            height,
          }}
        >
          {LEVELS.map((l) => (
            <span
              key={l}
              className="flex flex-1 items-center justify-end"
              style={{ lineHeight: 1 }}
            >
              {l}
            </span>
          ))}
        </div>
      )}

      <div
        className="relative overflow-hidden rounded-lg"
        style={{
          width: barWidth,
          height,
          background: "var(--card)",
          border: "1px solid var(--line)",
        }}
      >
        {/* Gap zone (soft tint) — from top down to the target. */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: targetY,
            background: "var(--soft)",
            transition: "height 0.5s cubic-bezier(0.22,1,0.36,1)",
          }}
        />

        {/* Accent fill — depth reached, from top down to the reading. */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: readingY,
            background: "var(--accent)",
            transition: "height 0.5s cubic-bezier(0.22,1,0.36,1)",
          }}
        />

        {/* Band dividers at 25 / 50 / 75%. */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute inset-x-0"
            style={{
              top: (i / 4) * height,
              height: 1,
              background: "var(--line)",
              opacity: 0.6,
            }}
          />
        ))}

        {/* Plumb line + bob, and the dashed target line. */}
        <svg
          className="absolute inset-0"
          width={barWidth}
          height={height}
          viewBox={`0 0 ${barWidth} ${height}`}
          fill="none"
          aria-hidden="true"
        >
          {/* Dashed target marker. */}
          <line
            x1={0}
            y1={targetY}
            x2={barWidth}
            y2={targetY}
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            opacity={0.85}
          />
          {/* Sounding line dropping to the reading. */}
          <line
            x1={cx}
            y1={0}
            x2={cx}
            y2={readingY}
            stroke="#fff"
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.85}
            style={{ transition: "all 0.5s cubic-bezier(0.22,1,0.36,1)" }}
          />
          {/* Plumb bob: a rotated diamond at the tip. */}
          <rect
            x={cx - 4}
            y={readingY - 4}
            width={8}
            height={8}
            transform={`rotate(45 ${cx} ${readingY})`}
            fill="#fff"
            stroke="var(--accent)"
            strokeWidth={1.5}
            style={{ transition: "all 0.5s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
      </div>
    </div>
  );
}

// Compact 4-segment horizontal gauge for library cards: accent = reached,
// soft = gap to target.
export function CompactGauge({
  currentLevel,
  targetLevel,
}: {
  currentLevel: number;
  targetLevel: number;
}) {
  return (
    <div className="flex gap-1.5">
      {LEVELS.map((_, i) => {
        const reached = i <= currentLevel;
        const gap = i > currentLevel && i <= targetLevel;
        return (
          <div
            key={i}
            className="h-2 flex-1 rounded-full"
            style={{
              background: reached
                ? "var(--accent)"
                : gap
                  ? "var(--soft)"
                  : "var(--line)",
            }}
          />
        );
      })}
    </div>
  );
}
