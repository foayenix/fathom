"use client";

import type { ReactNode } from "react";
import type { Domain } from "@/lib/domains";
import { AccentScope } from "./AccentScope";
import { TopBar } from "./TopBar";
import { ThinkingDots } from "./ThinkingDots";
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
          <div className="mt-24 flex justify-center" role="status" aria-label="Loading">
            <ThinkingDots />
          </div>
        ) : !user ? (
          <SignIn />
        ) : (
          children
        )}
      </main>
    </AccentScope>
  );
}
