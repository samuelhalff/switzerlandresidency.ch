import type { ReactNode } from "react";
import { cn } from "./cn";

/** Small label above a headline: a warm dot and letter-spaced text in the accent colour. */
export default function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2.5 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--em))]",
        className,
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </p>
  );
}
