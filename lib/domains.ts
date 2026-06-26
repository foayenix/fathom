import type { DomainId } from "./types";

// The eight "hats". Neutral chrome; the chosen hat injects a single accent
// colour (and a soft tint) that recolours the whole experience.
export interface Domain {
  id: DomainId;
  name: string;
  short: string;
  accent: string;
  soft: string;
}

export const DOMAINS: readonly Domain[] = [
  { id: "biomed", name: "Biomedical & Pharmacology", short: "Biomed", accent: "#0E8B7E", soft: "#E3F1EF" },
  { id: "cs", name: "Computer Science & AI", short: "CS / AI", accent: "#4F46E5", soft: "#E8E7FB" },
  { id: "psych", name: "Psychology & Neuroscience", short: "Psych / Neuro", accent: "#C2376B", soft: "#F8E6EE" },
  { id: "law", name: "Law & Policy", short: "Law", accent: "#8B2D3A", soft: "#F4E3E5" },
  { id: "econ", name: "Economics & Finance", short: "Econ", accent: "#9A7B2E", soft: "#F2ECDA" },
  { id: "eng", name: "Engineering & Physics", short: "Eng / Physics", accent: "#2563A8", soft: "#E2EBF6" },
  { id: "social", name: "Social Sciences", short: "Social Sci", accent: "#C2603A", soft: "#F7E8DF" },
  { id: "hum", name: "Literature & Humanities", short: "Humanities", accent: "#6B4A8A", soft: "#EDE6F4" },
] as const;

// Neutral accent for chrome with no domain selected (library, map).
export const NEUTRAL_ACCENT = "#2C3A47";
export const NEUTRAL_SOFT = "#E7E9E4";

export function getDomain(id: DomainId | string | undefined): Domain | undefined {
  return DOMAINS.find((d) => d.id === id);
}

// ── Depth scale ─────────────────────────────────────────────────────────
export const LEVELS = ["Surface", "Working", "Deep", "Fluent"] as const;

export const LEVEL_BLURB = [
  "you recognise the terms",
  "you can use it in context",
  "you can explain the why and connect it",
  "you could teach it or apply it to new problems",
] as const;

export function levelName(level: number): string {
  return LEVELS[Math.max(0, Math.min(3, Math.round(level)))];
}
