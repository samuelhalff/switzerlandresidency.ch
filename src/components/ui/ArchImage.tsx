import type { CSSProperties } from "react";
import type { ImageName } from "@/lib/images";
import type { Locale } from "@/lib/i18n";
import ImageSlot from "../ImageSlot";
import { cn } from "./cn";

const ratios = { "1/1": [1, 1], "5/6": [5, 6], "4/5": [4, 5], "3/4": [3, 4], "2/3": [2, 3] } as const;
export type ArchAspect = keyof typeof ratios;

const frames = {
  sand: "bg-sand",
  sage: "bg-sage",
  blush: "bg-blush",
  caramel: "bg-caramel",
} as const;

/**
 * Photo in a doorway-shaped arch (semicircular top, softly rounded base).
 * Optional `frame` draws an offset tinted arch behind it.
 */
export default function ArchImage({
  name,
  locale,
  decorative = false,
  aspect = "4/5",
  frame,
  position,
  className,
  reveal = true,
}: {
  name: ImageName;
  locale: Locale;
  decorative?: boolean;
  aspect?: ArchAspect;
  frame?: keyof typeof frames;
  position?: string;
  className?: string;
  reveal?: boolean;
}) {
  const [w, h] = ratios[aspect];
  const v = ((50 * w) / h).toFixed(2);
  const shape: CSSProperties = {
    borderRadius: `50% 50% 1.5rem 1.5rem / ${v}% ${v}% 1.5rem 1.5rem`,
    aspectRatio: `${w} / ${h}`,
  };
  return (
    <div className={cn("relative", className)} data-reveal={reveal ? "" : undefined}>
      {frame ? (
        <div
          aria-hidden="true"
          className={cn("absolute inset-0 translate-x-3 translate-y-3 sm:translate-x-5 sm:translate-y-5", frames[frame])}
          style={shape}
        />
      ) : null}
      <div className="group relative w-full overflow-hidden shadow-soft" style={shape}>
        {decorative ? (
          <ImageSlot name={name} decorative position={position} className="zoom-media absolute inset-0" />
        ) : (
          <ImageSlot name={name} locale={locale} position={position} className="zoom-media absolute inset-0" />
        )}
      </div>
    </div>
  );
}
