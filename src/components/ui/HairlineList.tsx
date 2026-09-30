import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";

/** Editorial list: big serif word, one line, long thin arrow, 1px dividers. */
export function HairlineList({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn("border-t border-line", className)}>{children}</ul>;
}

export function HairlineRow({
  title,
  text,
  href,
  size = "lg",
}: {
  title: string;
  text?: string;
  href?: string;
  /** lg = large serif word (home, hubs); md = compact. */
  size?: "md" | "lg";
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1 sm:grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:items-baseline sm:gap-10">
        <h3
          className={cn(
            "transition-colors group-hover:text-accent",
            size === "lg" ? "text-[1.9rem] leading-tight sm:text-[2.6rem]" : "text-[1.45rem] leading-snug sm:text-[1.75rem]",
          )}
        >
          {title}
        </h3>
        {text ? <p className="mt-2 max-w-xl text-[0.98rem] text-muted sm:mt-0">{text}</p> : null}
      </div>
      {href ? (
        // Long thin editorial arrow (echoes the logo's line mark); slides right and warms on hover.
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 56 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mt-3 h-3.5 w-10 shrink-0 text-ink/70 transition-[transform,color] duration-500 ease-out group-hover:translate-x-2 group-hover:text-accent motion-reduce:transition-none sm:mt-0 sm:w-14"
        >
          <path d="M1 7 H54" />
          <path d="M47 1 L54 7 L47 13" />
        </svg>
      ) : null}
    </>
  );
  const row =
    "flex items-start gap-6 py-7 transition-colors duration-500 sm:items-center sm:py-9 hover:bg-[linear-gradient(90deg,rgb(var(--accent)/0.06),transparent_70%)]";
  return (
    <li className="border-b border-line" data-reveal="">
      {href ? (
        <Link href={href} className={cn("group", row)}>
          {inner}
        </Link>
      ) : (
        <div className={row}>{inner}</div>
      )}
    </li>
  );
}
