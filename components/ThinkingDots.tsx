// Three bouncing dots, bot-side typing indicator.
export function ThinkingDots() {
  return (
    <span
      className="inline-flex items-center gap-1"
      style={{ color: "var(--muted)" }}
      aria-label="Thinking"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{
            background: "currentColor",
            animation: "dot-bounce 1s infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </span>
  );
}
