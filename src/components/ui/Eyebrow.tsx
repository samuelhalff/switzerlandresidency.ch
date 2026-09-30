import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Small, quiet label above a headline (text colour, sentence case). Render it `as="h1"` when the
 * page's H1 should be this short descriptive line while the big headline stays a styled <p>
 * (home hero): heading typography is reset so it looks identical to the plain eyebrow.
 */
export default function Eyebrow({
  children,
  className,
  as: Tag = "p",
}: {
  children: ReactNode;
  className?: string;
  as?: "p" | "h1" | "h2";
}) {
  return (
    <Tag
      className={cn(
        "text-[0.95rem] font-medium text-muted",
        Tag !== "p" && "font-sans leading-normal tracking-normal [font-variation-settings:normal] [text-wrap:pretty]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
