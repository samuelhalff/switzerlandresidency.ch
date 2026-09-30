import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "./Icon";
import { cn } from "./cn";

/** Wealthsimple-style list: big serif word, one line, small round arrow, 1px dividers. */
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
        <span
          aria-hidden="true"
          className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgb(var(--line))] transition-colors duration-300 group-hover:bg-ink group-hover:text-bg sm:mt-0"
        >
          <Icon name="arrow" size={17} className="btn-arrow" />
        </span>
      ) : null}
    </>
  );
  const row = "flex items-start gap-6 py-7 sm:items-center sm:py-9";
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
