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
  compactOnMobile = false,
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
  /** Phones: small square thumbnail beside the text (editorial list); 4:3 photo from sm up. */
  compactOnMobile?: boolean;
  className?: string;
}) {
  const body = compactOnMobile ? (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-4 sm:block">
      <Photo name={image} aspect="aspect-square sm:aspect-[4/3]" zoom={!!href} />
      <div>
        <h3 className="text-[1.15rem] leading-snug transition-colors group-hover:text-accent sm:mt-5 sm:text-[1.5rem]">{title}</h3>
        {text ? <p className="mt-2 line-clamp-2 hidden text-[0.98rem] text-muted sm:block">{text}</p> : null}
        {meta ? <p className="mt-2 text-sm text-muted sm:mt-3">{meta}</p> : null}
      </div>
    </div>
  ) : (
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
