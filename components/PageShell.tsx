"use client";

import type { ReactNode } from "react";
import type { Domain } from "@/lib/domains";
import { AccentScope } from "./AccentScope";
import { TopBar } from "./TopBar";
import { useAuth } from "./AuthProvider";
import { SignIn } from "./SignIn";

// Standard chrome: per-screen accent scope, sticky top bar, centred content.
// Gates content behind auth — logged-out visitors see the sign-in form.
export function PageShell({
  domain,
  children,
  maxWidth = 1080,
}: {
  domain?: Domain | null;
  children: ReactNode;
  maxWidth?: number;
}) {
  const { user, loading } = useAuth();

  return (
    <AccentScope domain={domain} style={{ minHeight: "100vh" }}>
      <TopBar />
      <main className="mx-auto px-5 pb-20 pt-8" style={{ maxWidth }}>
        {loading ? (
          <p className="chip-mono mt-16 text-center text-[12px]" style={{ color: "var(--muted)" }}>
            Loading…
          </p>
        ) : !user ? (
          <SignIn />
        ) : (
          children
        )}
      </main>
    </AccentScope>
  );
}
