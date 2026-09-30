/**
 * Logo: a thin ridge-over-lake line mark with the name in spaced small capitals on two lines.
 * Strokes and text use currentColor, so it works on ivory, espresso and over photos.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="28"
      viewBox="0 0 44 30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* Warm accent on the ridge (umber in light, clay in dark); lake line stays neutral. */}
      <path d="M2 20 L12 9 L18 15 L25 6 L42 20" stroke="rgb(var(--logo-accent, var(--accent)))" />
      <path d="M2 25 H42" opacity="0.55" />
    </svg>
  );
}

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark className="h-7 w-10 shrink-0" />
      <span className="font-sans text-[11px] font-medium uppercase leading-[1.35] tracking-[0.26em] sm:text-xs">
        <span className="block">Switzerland</span>
        <span className="block">Residency</span>
      </span>
    </span>
  );
}
