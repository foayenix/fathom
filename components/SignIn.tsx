"use client";

import { useState } from "react";
import { PlumbBob } from "./PlumbBob";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

// Magic-link sign-in. Enter an email, get a one-click link. Shown by PageShell
// whenever someone isn't authenticated.
export function SignIn() {
  const { configured } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  async function send() {
    const addr = email.trim();
    if (!addr || status === "sending") return;
    setStatus("sending");
    setError("");
    try {
      const { error } = await getSupabase().auth.signInWithOtp({
        email: addr,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/`
              : undefined,
        },
      });
      if (error) throw new Error(error.message);
      setStatus("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the link.");
      setStatus("error");
    }
  }

  async function signInWithGoogle() {
    if (googleLoading) return;
    setGoogleLoading(true);
    setError("");
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/`
              : undefined,
        },
      });
      if (error) throw new Error(error.message);
      // On success the browser redirects to Google, so we stay loading.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start Google sign-in.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 flex max-w-[420px] flex-col items-center text-center">
      <span style={{ color: "var(--accent)" }}>
        <PlumbBob width={28} height={48} />
      </span>
      <h1 className="display mt-5 text-[28px]" style={{ color: "var(--ink)" }}>
        Fathom
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "var(--ink)" }}>
        A depth gauge for research comprehension. Drop in a concept you don&rsquo;t
        fully grasp — Fathom gauges how deep you already are, sizes a focused
        tutor session to close the gap, and saves every concept you sound so
        your understanding builds into a map across your whole thesis.
      </p>
      <p className="mt-4 text-[13px]" style={{ color: "var(--muted)" }}>
        Sign in below to start. Your soundings are saved to your account, so
        they follow you across devices. No password — a one-click link, or
        Google.
      </p>

      {!configured ? (
        <div
          className="mt-6 w-full rounded-[10px] px-4 py-3 text-left text-[13px]"
          style={{ background: "var(--soft)", color: "var(--ink)" }}
        >
          Sign-in isn&rsquo;t configured yet. Set{" "}
          <code className="chip-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="chip-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and
          redeploy.
        </div>
      ) : status === "sent" ? (
        <div
          className="mt-6 w-full rounded-[12px] border p-5 text-[15px]"
          style={{ borderColor: "var(--line)", background: "var(--card)", color: "var(--ink)" }}
        >
          <strong>Check your inbox.</strong>
          <p className="mt-1 text-[14px]" style={{ color: "var(--muted)" }}>
            We sent a sign-in link to <strong>{email.trim()}</strong>. Open it on
            this device to continue.
          </p>
          <button
            className="ghost mt-3 underline"
            onClick={() => setStatus("idle")}
          >
            Use a different email
          </button>
        </div>
      ) : (
        <div className="mt-6 w-full">
          <button
            className="flex w-full items-center justify-center gap-2.5"
            style={{
              border: "1px solid var(--line)",
              borderRadius: 10,
              padding: "11px 16px",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "inherit",
              background: "var(--card)",
              color: "var(--ink)",
              cursor: googleLoading ? "not-allowed" : "pointer",
              opacity: googleLoading ? 0.6 : 1,
            }}
            disabled={googleLoading}
            onClick={signInWithGoogle}
          >
            <GoogleIcon />
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: "var(--line)" }} />
            <span
              className="chip-mono text-[11px] uppercase tracking-wide"
              style={{ color: "var(--muted)" }}
            >
              or
            </span>
            <span className="h-px flex-1" style={{ background: "var(--line)" }} />
          </div>

          <input
            type="email"
            className="field mt-5 text-center"
            placeholder="you@university.edu"
            value={email}
            autoFocus
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            className="btn mt-3 w-full"
            disabled={!email.trim() || status === "sending"}
            onClick={send}
          >
            {status === "sending" ? "Sending…" : "Email me a sign-in link"}
          </button>
          {error && (
            <div
              className="mt-3 rounded-[10px] px-3 py-2 text-[13px]"
              style={{ background: "#FBEAEA", color: "#8B2D2D", border: "1px solid #E8B4B4" }}
            >
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18A14.5 14.5 0 0 1 10.95 24c0-1.45.25-2.86.74-4.18v-5.7H4.34A23.93 23.93 0 0 0 2 24c0 3.87.93 7.53 2.34 10.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}
