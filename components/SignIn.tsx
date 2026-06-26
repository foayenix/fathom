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

  return (
    <div className="mx-auto mt-16 flex max-w-[420px] flex-col items-center text-center">
      <span style={{ color: "var(--accent)" }}>
        <PlumbBob width={28} height={48} />
      </span>
      <h1 className="display mt-5 text-[28px]" style={{ color: "var(--ink)" }}>
        Sign in to Fathom
      </h1>
      <p className="mt-2 text-[15px]" style={{ color: "var(--muted)" }}>
        Your soundings are saved to your account, so they follow you across
        devices. No password — we&rsquo;ll email you a one-click link.
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
          <input
            type="email"
            className="field text-center"
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
