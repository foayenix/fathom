"use client";

import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "./AuthProvider";
import { PlumbBob } from "./PlumbBob";

export function TopBar() {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <header
      className="sticky top-0 z-20 border-b"
      style={{
        background: "color-mix(in srgb, var(--paper) 88%, transparent)",
        backdropFilter: "saturate(1.2) blur(8px)",
        borderColor: "var(--line)",
      }}
    >
      <div className="mx-auto flex max-w-[1080px] items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <span style={{ color: "var(--accent)" }}>
            <PlumbBob />
          </span>
          <span className="leading-none">
            <span
              className="display block text-[20px]"
              style={{ color: "var(--ink)" }}
            >
              Fathom
            </span>
            <span className="eyebrow mt-0.5 block">depth gauge for research</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden items-center gap-2 sm:flex">
              <span
                className="chip-mono max-w-[160px] truncate text-[11px]"
                style={{ color: "var(--muted)" }}
                title={user.email ?? undefined}
              >
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="chip-mono rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-wide transition-colors"
                style={{ borderColor: "var(--line)", color: "var(--muted)" }}
              >
                Sign out
              </button>
            </div>
          )}

          <button
            onClick={toggle}
            className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors"
            style={{ borderColor: "var(--line)", color: "var(--muted)" }}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          >
            <span
              className="dot"
              style={{
                width: 10,
                height: 10,
                background: theme === "light" ? "var(--accent)" : "transparent",
                border: theme === "light" ? "none" : "1.5px solid var(--muted)",
              }}
            />
            <span className="chip-mono uppercase tracking-wide">
              {theme === "light" ? "Light" : "Dark"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
