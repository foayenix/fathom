import type { Sounding } from "./types";

// Where opening a sounding should land you — its furthest reached point.
export function resumeHref(s: Sounding): string {
  if (s.questions.length === 0) return `/s/${s.id}/diagnostic`;
  if (s.steps.length === 0) return `/s/${s.id}/diagnostic`;
  if (s.messages.length === 0 && s.progress === 0) return `/s/${s.id}/plan`;
  return `/s/${s.id}/session`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = Date.now();
  const days = Math.floor((now - ts) / (24 * 60 * 60 * 1000));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
