/** Wordmark with a small sun-over-peak mark. Uses CSS variables so it works in both themes. */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" focusable="false">
        <circle cx="21" cy="11" r="5.5" fill="rgb(var(--accent))" />
        <path d="M2 29 L12.5 13 L18 21 L22 16 L32 29 Z" fill="currentColor" />
        <path d="M12.5 13 L15.4 17.4 L13.6 16.6 L11.6 18.2 Z" fill="rgb(var(--bg))" opacity="0.9" />
      </svg>
      <span className="font-serif text-lg font-normal leading-none tracking-tight sm:text-xl">
        Switzerland Residency
      </span>
    </span>
  );
}
