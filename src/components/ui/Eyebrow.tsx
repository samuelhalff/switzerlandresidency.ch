import type { ReactNode } from "react";
import { cn } from "./cn";

/** Small, quiet label above a headline (text colour, sentence case). */
export default function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[0.95rem] font-medium text-muted", className)}>{children}</p>;
}
