import type { CSSProperties } from "react";
import { imageFor, images, type ImageName } from "@/lib/images";
import type { Locale } from "@/lib/i18n";

type Props = {
  name: ImageName;
  className?: string;
  /** CSS object-position, e.g. "center 30%". */
  position?: string;
  /** Above-the-fold images: eager-load with a high fetch priority instead of lazy. */
  priority?: boolean;
} & ({ decorative: true; locale?: Locale } | { decorative?: false; locale: Locale });

/**
 * Photo slot rendered as a real <img> filling its box (object-fit: cover) over a warm gradient:
 * if the file in public/images/ is missing, the gradient shows through and nothing breaks.
 */
export default function ImageSlot(props: Props) {
  const { name, className = "", position, priority } = props;
  const style = (position ? { "--img-pos": position } : undefined) as CSSProperties | undefined;
  const img = (alt: string) => (
    <img src={images[name].src} alt={alt} decoding="async" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} />
  );
  if (props.decorative || !props.locale) {
    return (
      <div className={`img-slot ${className}`} style={style} aria-hidden="true">
        {img("")}
      </div>
    );
  }
  return (
    <div className={`img-slot ${className}`} style={style}>
      {img(imageFor(name, props.locale).alt)}
    </div>
  );
}
