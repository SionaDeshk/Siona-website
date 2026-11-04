export function Arrow({ direction = "diagonal", className = "" }: {
  direction?: "diagonal" | "down" | "right";
  className?: string;
}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      <g transform={direction === "down" ? "rotate(135 12 12)" : direction === "right" ? "rotate(45 12 12)" : undefined}>
        <path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.4" />
      </g>
    </svg>
  );
}
