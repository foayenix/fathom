"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { DomainId, Level, Sounding } from "./types";

// ── IndexedDB schema ──────────────────────────────────────────────────────
// One object store, `soundings`, keyed by `id`.
const DB_NAME = "fathom";
const DB_VERSION = 1;
const STORE = "soundings";

interface FathomDB extends DBSchema {
  soundings: {
    key: string;
    value: Sounding;
    indexes: { "by-updatedAt": number };
  };
}

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

let dbPromise: Promise<IDBPDatabase<FathomDB>> | null = null;

function getDB() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser.");
  }
  if (!dbPromise) {
    dbPromise = openDB<FathomDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("by-updatedAt", "updatedAt");
        }
      },
    });
  }
  return dbPromise;
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
  const db = await getDB();
  const all = await db.getAll(STORE);
  // Newest first.
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getSounding(id: string): Promise<Sounding | undefined> {
  const db = await getDB();
  return db.get(STORE, id);
}

export async function putSounding(s: Sounding): Promise<Sounding> {
  const db = await getDB();
  await db.put(STORE, s);
  return s;
}

export async function deleteSounding(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, id);
}

// Patch an existing sounding and bump updatedAt.
export async function patchSounding(
  id: string,
  patch: Partial<Sounding>,
): Promise<Sounding | undefined> {
  const db = await getDB();
  const existing = await db.get(STORE, id);
  if (!existing) return undefined;
  const next: Sounding = { ...existing, ...patch, updatedAt: Date.now() };
  await db.put(STORE, next);
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
// library load: silently flips state and persists — no prompt.
export async function applyStaleness(): Promise<Sounding[]> {
  const db = await getDB();
  const all = await db.getAll(STORE);
  const now = Date.now();
  const tx = db.transaction(STORE, "readwrite");
  let changed = false;
  for (const s of all) {
    if (s.status === "sounded" && now - s.updatedAt > THIRTY_DAYS) {
      s.status = "stale";
      await tx.store.put(s);
      changed = true;
    }
  }
  await tx.done;
  if (!changed) return all.sort((a, b) => b.updatedAt - a.updatedAt);
  return (await db.getAll(STORE)).sort((a, b) => b.updatedAt - a.updatedAt);
}

// Deepest level a sounding has ever reached (for map node sizing).
export function deepestLevel(s: Sounding): Level {
  const fromHistory = s.levelHistory.reduce((m, h) => Math.max(m, h.level), 0);
  return Math.max(fromHistory, s.currentLevel) as Level;
}
