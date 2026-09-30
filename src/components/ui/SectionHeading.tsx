import type { ReactNode } from "react";
import AccentText from "./AccentText";
import Eyebrow from "./Eyebrow";
import { cn } from "./cn";

const titleSizes = {
  display: "text-[2.6rem] leading-[1.06] sm:text-6xl lg:text-[4.5rem]",
  xl: "text-[2.35rem] leading-[1.1] sm:text-5xl lg:text-[3.5rem]",
  lg: "text-[2rem] leading-[1.15] sm:text-[2.6rem]",
  md: "text-2xl sm:text-[1.75rem]",
} as const;

export type HeadingSize = keyof typeof titleSizes;

/** Eyebrow + headline (with one accent word) + lead paragraph, left or centred. Optional action slot. */
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
  /** Extra content under the lead (e.g. a link-arrow button). */
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
        <p className={cn("mt-5 text-lg leading-relaxed text-muted sm:text-xl", center ? "mx-auto max-w-2xl" : "max-w-2xl")}>{lead}</p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
