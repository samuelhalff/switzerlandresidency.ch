import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { ImageName } from "@/lib/images";
import ImageSlot from "../ImageSlot";
import { cn } from "./cn";

const tones = {
  plain: "bg-surface text-ink shadow-soft",
  sand: "bg-sand text-ink",
  sage: "bg-sage text-ink",
  blush: "bg-blush text-ink",
  evening: "on-dark bg-evening",
} as const;

export type CardTone = keyof typeof tones;

const pads = { sm: "p-5", md: "p-6 sm:p-7", lg: "p-6 sm:p-10" } as const;

type Props = {
  tone?: CardTone;
  /** Makes the whole card a link. */
  href?: string;
  /** Decorative photo on top of the card. */
  image?: ImageName;
  imageAspect?: string;
  padding?: keyof typeof pads;
  as?: "div" | "li" | "article" | "section";
  className?: string;
  /** Fade up on scroll; a number staggers the delay (index in a grid). */
  reveal?: boolean | number;
  role?: string;
  children: ReactNode;
} & { [K in `aria-${string}`]?: string };

/** Rounded, softly shadowed surface. Tones vary gently between sections; `href` makes it one big link. */
export default function Card({
  tone = "plain",
  href,
  image,
  imageAspect = "aspect-[16/10]",
  padding = "md",
  as: Tag = "div",
  className,
  reveal = false,
  children,
  ...aria
}: Props) {
  const classes = cn(
    "relative flex flex-col overflow-hidden rounded-card",
    tones[tone],
    href && "group transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-lift",
    className,
  );
  const revealProps =
    reveal === false
      ? {}
      : {
          "data-reveal": "",
          style: typeof reveal === "number" ? ({ "--reveal-delay": `${Math.min(reveal, 5) * 80}ms` } as CSSProperties) : undefined,
        };
  const body = (
    <>
      {image ? (
        <div className={cn("relative overflow-hidden", imageAspect)}>
          <ImageSlot name={image} decorative className="zoom-media absolute inset-0" />
        </div>
      ) : null}
      <div className={cn("flex flex-1 flex-col", pads[padding])}>{children}</div>
    </>
  );

  if (href) {
    const link = (
      <Link href={href} className={cn(classes, Tag === "li" ? "h-full" : "")} {...(Tag === "li" ? {} : revealProps)} {...aria}>
        {body}
      </Link>
    );
    return Tag === "li" ? <li {...revealProps}>{link}</li> : link;
  }
  return (
    <Tag className={classes} {...revealProps} {...aria}>
      {body}
    </Tag>
  );
}
