import type { CSSProperties } from "react";
import type { ImageName } from "@/lib/images";
import { imageCaption } from "@/lib/images";
import type { Locale } from "@/lib/i18n";
import Photo from "./Photo";

/** Asymmetric pair: a wide image (2/3) and a tall one (1/3), each with a plain caption. */
export default function ImagePair({ wide, tall, locale }: { wide: ImageName; tall: ImageName; locale: Locale }) {
  return (
    <div className="grid gap-5 sm:grid-cols-3 sm:items-end sm:gap-6">
      <figure className="sm:col-span-2" data-reveal="">
        <Photo name={wide} locale={locale} aspect="aspect-[4/3] sm:aspect-[3/2]" />
        <figcaption className="mt-3 text-sm text-muted">{imageCaption(wide, locale)}</figcaption>
      </figure>
      <figure data-reveal="" style={{ "--reveal-delay": "120ms" } as CSSProperties}>
        <Photo name={tall} locale={locale} aspect="aspect-[4/5] sm:aspect-[3/4]" />
        <figcaption className="mt-3 text-sm text-muted">{imageCaption(tall, locale)}</figcaption>
      </figure>
    </div>
  );
}
