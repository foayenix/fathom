// Core data model for Fathom. One Sounding per concept; everything lives
// on-device in IndexedDB.

export type DomainId =
  | "biomed"
  | "cs"
  | "psych"
  | "law"
  | "econ"
  | "eng"
  | "social"
  | "hum";

export type SoundingStatus = "in_progress" | "sounded" | "stale";

export type Level = 0 | 1 | 2 | 3; // 0=Surface 1=Working 2=Deep 3=Fluent

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface LevelStamp {
  level: number;
  ts: number;
}

export interface Sounding {
  id: string; // uid()
  domainId: DomainId;
  topic: string; // pasted concept/passage
  context?: string; // "what are you writing about?"
  status: SoundingStatus;
  currentLevel: Level; // measured depth
  targetLevel: Level; // where the session aims
  readout: string; // one-line candid assessment
  durationLabel: string; // e.g. "25-min focused session"
  durationMinutes: number;
  steps: string[]; // 3-5 plan steps
  questions: string[]; // 4 diagnostic questions
  answers: string[]; // learner's answers
  messages: Message[]; // full chat history, resumable
  progress: number; // 0–1, how far through the session
  levelHistory: LevelStamp[];
  createdAt: number;
  updatedAt: number;
}
