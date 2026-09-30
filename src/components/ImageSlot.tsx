import type { CSSProperties } from "react";
import { imageFor, images, type ImageName } from "@/lib/images";
import type { Locale } from "@/lib/i18n";

type Props = {
  name: ImageName;
  className?: string;
  /** CSS background-position, e.g. "center 30%". */
  position?: string;
} & ({ decorative: true; locale?: Locale } | { decorative?: false; locale: Locale });

/**
 * Photo slot rendered as a CSS background over a warm gradient: if the file in
 * public/images/ is missing, the gradient shows and nothing breaks. Alt text via role="img".
 */
export default function ImageSlot(props: Props) {
  const { name, className = "", position } = props;
  const style = { "--img": `url("${images[name].src}")`, ...(position ? { "--img-pos": position } : {}) } as CSSProperties;
  if (props.decorative || !props.locale) {
    return <div className={`img-slot ${className}`} style={style} aria-hidden="true" />;
  }
  return <div className={`img-slot ${className}`} style={style} role="img" aria-label={imageFor(name, props.locale).alt} />;
}
