"use client";

import type { CSSProperties, ReactNode } from "react";
import { NEUTRAL_ACCENT, NEUTRAL_SOFT, type Domain } from "@/lib/domains";

// Injects --accent / --soft for a domain (or the neutral chrome accent when
// none is given), recolouring everything inside. Used to wrap whole screens.
export function AccentScope({
  domain,
  children,
  className,
  style,
}: {
  domain?: Domain | null;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const vars = {
    "--accent": domain?.accent ?? NEUTRAL_ACCENT,
    "--soft": domain?.soft ?? NEUTRAL_SOFT,
  } as CSSProperties;

  return (
    <div className={className} style={{ ...vars, ...style }}>
      {children}
    </div>
  );
}
