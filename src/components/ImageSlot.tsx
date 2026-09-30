import type { CSSProperties } from "react";
import { imageFor, type ImageName } from "@/lib/images";
import type { Locale } from "@/lib/i18n";

/**
 * Photo slot rendered as a CSS background over a warm gradient: if the file in
 * public/images/ is missing, the gradient shows and nothing breaks. Alt text via role="img".
 */
export default function ImageSlot({
  name,
  locale,
  className = "",
  decorative = false,
}: {
  name: ImageName;
  locale: Locale;
  className?: string;
  decorative?: boolean;
}) {
  const img = imageFor(name, locale);
  const style = { "--img": `url("${img.src}")` } as CSSProperties;
  return decorative ? (
    <div className={`img-slot ${className}`} style={style} aria-hidden="true" />
  ) : (
    <div className={`img-slot ${className}`} style={style} role="img" aria-label={img.alt} />
  );
}
