import Link from "next/link";
import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";
import { cn } from "./cn";

/** Rounded pill for tags, filters and short lists. Becomes a link with `href`. */
export default function Chip({
  children,
  href,
  active = false,
  icon,
  className,
}: {
  children: ReactNode;
  href?: string;
  active?: boolean;
  icon?: IconName;
  className?: string;
}) {
  const classes = cn(
    "inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 py-1.5 text-[0.95rem] transition-colors duration-200",
    active ? "bg-ink text-bg" : "bg-surface text-ink shadow-soft",
    href && !active && "hover:bg-blush",
    className,
  );
  const inner = (
    <>
      {icon ? <Icon name={icon} size={17} className={active ? "" : "text-accent"} /> : null}
      <span>{children}</span>
    </>
  );
  return href ? (
    <Link href={href} className={classes} aria-current={active ? "page" : undefined}>
      {inner}
    </Link>
  ) : (
    <span className={classes}>{inner}</span>
  );
}
