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
- **Supabase** — Postgres + auth (email magic-link or Google), with
  Row-Level Security so each person only ever sees their own soundings. Your
  library follows you across devices.
- **Anthropic Messages API** (`claude-sonnet-4-6`) called from Next.js API routes
  so the key stays server-side
- **Fonts:** Spectral (serif display), IBM Plex Sans (body), IBM Plex Mono
  (instrument read-outs)

Sign in with a one-click email link or a Google account; soundings are saved
to your account.

---

## Getting started

### 1. Create a Supabase project

1. At [supabase.com](https://supabase.com), create a free project.
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates the
   `soundings` table and the Row-Level Security policies.
3. Under **Authentication → URL Configuration**, set the **Site URL** to your
   app's URL (e.g. your Railway domain, or `http://localhost:3000` for local),
   and add the same URL under **Redirect URLs**. Magic links and OAuth both
   bounce back here.
4. Grab **Settings → API → Project URL** and the **anon public** key.
5. *(Optional)* To enable **Continue with Google**: in [Google Cloud
   Console](https://console.cloud.google.com), create an OAuth client (type
   **Web application**) with authorized redirect URI
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback`. Then in Supabase, go
   to **Authentication → Providers → Google**, enable it, and paste in the
   client ID and secret. Without this step the Google button still renders
   but sign-in will fail — email magic link keeps working either way.

### 2. Configure and run

```bash
npm install

cp .env.example .env.local
# Fill in:
#   ANTHROPIC_API_KEY=sk-ant-...
#   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

npm run dev
```

Open <http://localhost:3000>, enter your email, and click the link it sends.

> **Deploying (Railway etc.):** set the same env vars in the service's
> Variables tab. `NEXT_PUBLIC_*` values are baked in at **build** time, so set
> them before deploying and **redeploy** after any change. Set the Supabase Site
> URL / Redirect URL to your deployed domain.

> Without an Anthropic key (with credit), the app signs in and saves fine, but
> the diagnostic / assess / session routes return a clear error instead of
> generating content.

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
  supabase.ts                  Browser Supabase client + auth helpers
  db.ts                        Supabase data layer (soundings table), staleness
  anthropic.ts                 Server-side Messages API helpers
  nav.ts                       Resume routing + date formatting
components/
  TopBar, PageShell, NavSegment
  AuthProvider (session context), SignIn (magic-link + Google form)
  DepthGauge (the signature vertical gauge) + CompactGauge
  SoundingCard, StateBadge, DomainChip
  PlumbBob, ThinkingDots
  ThemeProvider (dark/light), AccentScope (per-domain recolour)
supabase/
  schema.sql                   soundings table + Row-Level Security policies
```

---

## Design notes

- **The gauge is candid.** The system prompts judge level honestly and are never
  told to flatter. A surface read shown as surface is the whole point.
- **Your data is your own.** Row-Level Security scopes every read and write to
  the signed-in user at the database level — not just in app code.
- **One focused move per session turn.** Enforced by the prompt and by the UI —
  narrow bubbles make a wall of text look wrong.
- **Per-domain accent.** Each field injects one accent (`--accent`) and tint
  (`--soft`) that recolours the whole experience; the chrome stays neutral.
- Motion is restrained and respects `prefers-reduced-motion`.

## Out of scope

Export to writing tools, multi-concept capture, collaboration / shared
soundings, native mobile (the web app is responsive).
