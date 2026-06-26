# Fathom

**A depth gauge for research comprehension.**

When you hit something in your work you don't fully grasp, drop it in. Fathom
gauges how deep you already are, sizes a session to close the gap, and takes you
through an interactive tutor session. Every concept you *sound* is saved locally,
so you can leave and come back — building a growing library and research map
across your whole thesis.

Built for PhD researchers and serious self-learners. The tone target is
*scholarly instrument*, not streak-and-confetti.

---

## Stack

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **IndexedDB** via [`idb`](https://www.npmjs.com/package/idb) — local-first, no accounts
- **Anthropic Messages API** (`claude-sonnet-4-6`) called from Next.js API routes
  so the key stays server-side
- **Fonts:** Spectral (serif display), IBM Plex Sans (body), IBM Plex Mono
  (instrument read-outs)

No accounts, no cloud sync. Everything lives on-device in IndexedDB.

---

## Getting started

```bash
npm install

# Add your Anthropic API key (used only by the server-side API routes)
cp .env.example .env.local
# then edit .env.local and set ANTHROPIC_API_KEY=sk-ant-...

npm run dev
```

Open <http://localhost:3000>.

> Without a key, the UI loads and persists fine, but the diagnostic / assess /
> session API routes return a clear error instead of generating content.

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

---

## How it works

A **Sounding** is one concept you're trying to understand. Its lifecycle:

1. **Capture** (`/new` → `/new/[domainId]`) — pick your field (one of eight
   "hats"), paste the concept, optionally say what you're writing about.
2. **Diagnostic** (`/s/[id]/diagnostic`) — four open questions, tuned to the
   concept and field by the API. "No idea" is a valid answer.
3. **Gauge & plan** (`/s/[id]/plan`) — a candid depth reading on the signature
   vertical gauge (Surface → Working → Deep → Fluent), the gap to target, and a
   sized session plan.
4. **Session** (`/s/[id]/session`) — an immersive tutor: one focused move per
   turn, Socratic dialogue + field-grounded scenarios + quiz checks. The gauge
   fills live as you progress; the plan ticks off. Fully resumable.

Everything is recorded. The **Library** (`/`) is the home — a grid of all your
soundings with state (in progress / sounded / stale) legible at a glance. The
**Research map** (`/map`) plots every concept as a node, clustered by field and
sized by depth reached — the portrait of your growing understanding.

### States & staleness

A `sounded` sounding becomes `stale` after 30 days untouched. This is checked
silently on library/map load — no prompt, just an updated badge and a re-gauge
offer.

---

## Project structure

```
app/
  page.tsx                     Library (home)
  map/page.tsx                 Research map
  new/page.tsx                 Domain picker
  new/[domainId]/page.tsx      Capture
  s/[id]/diagnostic/page.tsx   Diagnostic
  s/[id]/plan/page.tsx         Gauge & plan
  s/[id]/session/page.tsx      Interactive session
  api/diagnostic/route.ts      Generates 4 diagnostic questions
  api/assess/route.ts          Judges level + sizes the session
  api/session/route.ts         Streaming tutor
lib/
  types.ts                     Sounding, Message, ...
  domains.ts                   DOMAINS, LEVELS, LEVEL_BLURB
  db.ts                        IndexedDB helpers (idb), staleness, uid
  anthropic.ts                 Server-side Messages API helpers
  nav.ts                       Resume routing + date formatting
components/
  TopBar, PageShell, NavSegment
  DepthGauge (the signature vertical gauge) + CompactGauge
  SoundingCard, StateBadge, DomainChip
  PlumbBob, ThinkingDots
  ThemeProvider (dark/light), AccentScope (per-domain recolour)
```

---

## Design notes

- **The gauge is candid.** The system prompts judge level honestly and are never
  told to flatter. A surface read shown as surface is the whole point.
- **No login wall.** The product works fully on-device.
- **One focused move per session turn.** Enforced by the prompt and by the UI —
  narrow bubbles make a wall of text look wrong.
- **Per-domain accent.** Each field injects one accent (`--accent`) and tint
  (`--soft`) that recolours the whole experience; the chrome stays neutral.
- Motion is restrained and respects `prefers-reduced-motion`.

## Out of scope (v1)

Accounts and cross-device sync, export to writing tools, multi-concept capture,
collaboration, native mobile (the web app is responsive).
