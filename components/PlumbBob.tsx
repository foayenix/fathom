// The Fathom mark: a thin vertical sounding line with a rotated diamond
// (plumb bob) at the bottom tip. Inherits `color` via currentColor.
export function PlumbBob({
  width = 16,
  height = 28,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 28"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <line
        x1="8"
        y1="0"
        x2="8"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="4.5"
        y="18.5"
        width="7"
        height="7"
        transform="rotate(45 8 22)"
        fill="currentColor"
      />
    </svg>
  );
}
