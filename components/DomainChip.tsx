import type { Domain } from "@/lib/domains";

// Accent dot + short domain name, in a soft-tinted pill.
export function DomainChip({ domain }: { domain: Domain }) {
  return (
    <span className="chip">
      <span className="dot" style={{ background: domain.accent }} />
      {domain.short}
    </span>
  );
}
