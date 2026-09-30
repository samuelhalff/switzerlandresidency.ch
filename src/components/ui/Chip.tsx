import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";

/** Small tag / filter with a hairline border and a small radius. Becomes a link with `href`. */
export default function Chip({
  children,
  href,
  active = false,
  className,
}: {
  children: ReactNode;
  href?: string;
  active?: boolean;
  className?: string;
}) {
  const classes = cn(
    "inline-flex min-h-[40px] items-center gap-2 rounded-soft px-3.5 py-1.5 text-[0.95rem] transition-colors duration-200",
    active ? "bg-ink text-bg" : "text-ink shadow-[inset_0_0_0_1px_rgb(var(--line))]",
    href && !active && "hover:shadow-[inset_0_0_0_1px_rgb(var(--ink))]",
    className,
  );
  return href ? (
    <Link href={href} className={classes} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  ) : (
    <span className={classes}>{children}</span>
  );
}
