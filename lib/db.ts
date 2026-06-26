"use client";

import { getSupabase, requireUserId } from "./supabase";
import type { DomainId, Level, Sounding } from "./types";

// ── Supabase-backed data layer ────────────────────────────────────────────
// Each sounding is one row in the `soundings` table:
//   id uuid · user_id uuid · data jsonb (the full Sounding) · updated_at
// Row-Level Security ensures every query only ever touches the signed-in
// user's own rows, so "your data is your own" is enforced at the database.

const TABLE = "soundings";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

interface Row {
  id: string;
  data: Sounding;
  updated_at: string;
}

function rowToSounding(row: Row): Sounding {
  // The row id is authoritative; keep the embedded copy in step.
  return { ...row.data, id: row.id };
}

// ── Small id helper ───────────────────────────────────────────────────────
export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── CRUD ──────────────────────────────────────────────────────────────────
export async function getAllSoundings(): Promise<Sounding[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("id, data, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Row[]).map(rowToSounding);
}

export async function getSounding(id: string): Promise<Sounding | undefined> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("id, data, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToSounding(data as Row) : undefined;
}

export async function putSounding(s: Sounding): Promise<Sounding> {
  const userId = await requireUserId();
  const updatedAt = new Date(s.updatedAt || Date.now()).toISOString();
  const { error } = await getSupabase().from(TABLE).upsert({
    id: s.id,
    user_id: userId,
    data: s,
    updated_at: updatedAt,
  });
  if (error) throw new Error(error.message);
  return s;
}

export async function deleteSounding(id: string): Promise<void> {
  const { error } = await getSupabase().from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Patch an existing sounding and bump updatedAt.
export async function patchSounding(
  id: string,
  patch: Partial<Sounding>,
): Promise<Sounding | undefined> {
  const existing = await getSounding(id);
  if (!existing) return undefined;
  const next: Sounding = { ...existing, ...patch, updatedAt: Date.now() };
  await putSounding(next);
  return next;
}

export interface NewSoundingInput {
  domainId: DomainId;
  topic: string;
  context?: string;
}

export async function createSounding(input: NewSoundingInput): Promise<Sounding> {
  const now = Date.now();
  const s: Sounding = {
    id: uid(),
    domainId: input.domainId,
    topic: input.topic.trim(),
    context: input.context?.trim() || undefined,
    status: "in_progress",
    currentLevel: 0,
    targetLevel: 2,
    readout: "",
    durationLabel: "",
    durationMinutes: 0,
    steps: [],
    questions: [],
    answers: [],
    messages: [],
    progress: 0,
    levelHistory: [],
    createdAt: now,
    updatedAt: now,
  };
  await putSounding(s);
  return s;
}

// ── Staleness rule ─────────────────────────────────────────────────────────
// A `sounded` sounding becomes `stale` after 30 days untouched. Called on
// library/map load: silently flips state and persists — no prompt.
export async function applyStaleness(): Promise<Sounding[]> {
  const all = await getAllSoundings();
  const now = Date.now();
  const toFlip = all.filter(
    (s) => s.status === "sounded" && now - s.updatedAt > THIRTY_DAYS,
  );
  for (const s of toFlip) {
    s.status = "stale";
    // Preserve updatedAt so a flipped-stale item doesn't jump to the top.
    await putSounding(s);
  }
  return all;
}

// Deepest level a sounding has ever reached (for map node sizing).
export function deepestLevel(s: Sounding): Level {
  const fromHistory = s.levelHistory.reduce((m, h) => Math.max(m, h.level), 0);
  return Math.max(fromHistory, s.currentLevel) as Level;
}
