import type { ReactNode } from "react";
import { cn } from "./cn";

/** Quiet framed surface for forms and tools: hairline border, small radius, no shadow. */
export default function Panel({
  children,
  className,
  padding = "md",
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  as?: "div" | "section" | "aside";
  role?: string;
} & { [K in `aria-${string}`]?: string }) {
  const pad = padding === "sm" ? "p-5" : padding === "lg" ? "p-6 sm:p-10" : "p-6 sm:p-8";
  return (
    <Tag className={cn("rounded-soft bg-surface shadow-[inset_0_0_0_1px_rgb(var(--line))]", pad, className)} {...rest}>
      {children}
    </Tag>
  );
}
