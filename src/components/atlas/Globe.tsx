// Decorative animated globe / network background — pure SVG, no deps.
export function Globe({ className = "" }: { className?: string }) {
  const dots = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const r = 180 + Math.sin(i * 1.7) * 30;
    return { x: 250 + Math.cos(a) * r, y: 250 + Math.sin(a) * r * 0.55, d: i * 0.08 };
  });

  return (
    <svg viewBox="0 0 500 500" className={className} aria-hidden>
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.82 0.15 85)" stopOpacity="0.35" />
          <stop offset="60%" stopColor="oklch(0.82 0.15 85)" stopOpacity="0.05" />
          <stop offset="100%" stopColor="oklch(0.82 0.15 85)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.82 0.15 85)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="oklch(0.82 0.15 85)" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <circle cx="250" cy="250" r="240" fill="url(#glow)" />

      <g className="animate-orbit" style={{ transformOrigin: "250px 250px" }}>
        <ellipse cx="250" cy="250" rx="220" ry="80" fill="none" stroke="url(#ring)" strokeWidth="1" />
        <ellipse cx="250" cy="250" rx="220" ry="120" fill="none" stroke="url(#ring)" strokeWidth="1" opacity="0.6" />
        <ellipse cx="250" cy="250" rx="220" ry="160" fill="none" stroke="url(#ring)" strokeWidth="1" opacity="0.4" />
        <ellipse cx="250" cy="250" rx="220" ry="200" fill="none" stroke="url(#ring)" strokeWidth="1" opacity="0.25" />
      </g>

      <g>
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={1.6}
            fill="oklch(0.92 0.08 88)"
            className="animate-pulse-glow"
            style={{ animationDelay: `${d.d}s` }}
          />
        ))}
      </g>

      <circle cx="250" cy="250" r="3" fill="oklch(0.82 0.15 85)" className="animate-pulse-glow" />
    </svg>
  );
}
