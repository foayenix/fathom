import type { SoundingStatus } from "@/lib/types";

const LABELS: Record<SoundingStatus, string> = {
  in_progress: "In progress",
  sounded: "Sounded",
  stale: "Stale",
};

export function StateBadge({ status }: { status: SoundingStatus }) {
  const styles: Record<SoundingStatus, React.CSSProperties> = {
    in_progress: {
      background: "var(--soft)",
      color: "var(--accent)",
    },
    sounded: {
      background: "var(--accent)",
      color: "#fff",
    },
    stale: {
      background: "transparent",
      color: "var(--muted)",
      border: "1px dashed var(--line)",
    },
  };

  return (
    <span
      className="chip-mono inline-flex items-center rounded-full px-2 py-0.5 uppercase"
      style={{
        fontSize: "9.5px",
        letterSpacing: "0.1em",
        fontWeight: 600,
        ...styles[status],
      }}
    >
      {LABELS[status]}
    </span>
  );
}
