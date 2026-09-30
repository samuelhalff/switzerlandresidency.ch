import Link from "next/link";
import type { CSSProperties } from "react";
import type { ImageName } from "@/lib/images";
import Photo from "./Photo";

/** Photo-led tile: tall image, serif title, one line of text. No border, no "learn more". */
export default function Tile({
  href,
  image,
  title,
  text,
  meta,
  aspect = "aspect-[4/5]",
  as: Tag = "li",
  index,
  className,
}: {
  href?: string;
  image: ImageName;
  title: string;
  text?: string;
  meta?: string;
  aspect?: string;
  as?: "li" | "div";
  /** Position in a grid, staggers the fade-up. */
  index?: number;
  className?: string;
}) {
  const body = (
    <>
      <Photo name={image} aspect={aspect} zoom={!!href} />
      <h3 className="mt-5 text-[1.4rem] leading-snug transition-colors group-hover:text-accent sm:text-[1.5rem]">{title}</h3>
      {text ? <p className="mt-2 line-clamp-2 text-[0.98rem] text-muted">{text}</p> : null}
      {meta ? <p className="mt-3 text-sm text-muted">{meta}</p> : null}
    </>
  );
  const style = index !== undefined ? ({ "--reveal-delay": `${Math.min(index, 4) * 80}ms` } as CSSProperties) : undefined;
  return (
    <Tag className={className} data-reveal="" style={style}>
      {href ? (
        <Link href={href} className="group block rounded-soft">
          {body}
        </Link>
      ) : (
        body
      )}
    </Tag>
  );
}
