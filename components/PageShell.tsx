"use client";

import type { ReactNode } from "react";
import type { Domain } from "@/lib/domains";
import { AccentScope } from "./AccentScope";
import { TopBar } from "./TopBar";

// Standard chrome: per-screen accent scope, sticky top bar, centred content.
export function PageShell({
  domain,
  children,
  maxWidth = 1080,
}: {
  domain?: Domain | null;
  children: ReactNode;
  maxWidth?: number;
}) {
  return (
    <AccentScope domain={domain} style={{ minHeight: "100vh" }}>
      <TopBar />
      <main
        className="mx-auto px-5 pb-20 pt-8"
        style={{ maxWidth }}
      >
        {children}
      </main>
    </AccentScope>
  );
}
