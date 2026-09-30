import type { ReactNode } from "react";
import AccentText from "./AccentText";
import Eyebrow from "./Eyebrow";
import { cn } from "./cn";

const titleSizes = {
  display: "font-light-display text-[2.6rem] leading-[1.04] sm:text-6xl lg:text-[4.5rem]",
  xl: "font-light-display text-[2.4rem] leading-[1.06] sm:text-5xl lg:text-[3.75rem]",
  lg: "text-[2rem] leading-[1.1] sm:text-[2.75rem]",
  md: "text-[1.6rem] sm:text-[2rem]",
} as const;

export type HeadingSize = keyof typeof titleSizes;

/** Optional eyebrow + light serif headline (one accent word) + quiet lead paragraph. */
export default function SectionHeading({
  eyebrow,
  title,
  accent,
  lead,
  as: Tag = "h2",
  size = "lg",
  align = "left",
  id,
  className,
  children,
  reveal = true,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  lead?: string;
  as?: "h1" | "h2" | "h3";
  size?: HeadingSize;
  align?: "left" | "center";
  id?: string;
  className?: string;
  /** Extra content under the lead (e.g. a text link). */
  children?: ReactNode;
  reveal?: boolean;
}) {
  const center = align === "center";
  return (
    <div className={cn(center && "mx-auto text-center", "max-w-3xl", className)} data-reveal={reveal ? "" : undefined}>
      {eyebrow ? <Eyebrow className="mb-4">{eyebrow}</Eyebrow> : null}
      <Tag id={id} className={titleSizes[size]}>
        <AccentText text={title} accent={accent} />
      </Tag>
      {lead ? (
        <p className={cn("mt-5 text-lg leading-relaxed text-muted", center ? "mx-auto max-w-2xl" : "max-w-2xl")}>{lead}</p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
