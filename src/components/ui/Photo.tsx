import type { ImageName } from "@/lib/images";
import type { Locale } from "@/lib/i18n";
import ImageSlot from "../ImageSlot";
import { cn } from "./cn";

/** Graded photo in a fixed aspect box with a small radius (or none). Decorative unless `locale` is given. */
export default function Photo({
  name,
  locale,
  aspect = "aspect-[4/5]",
  position,
  rounded = true,
  zoom = false,
  className,
}: {
  name: ImageName;
  locale?: Locale;
  aspect?: string;
  position?: string;
  rounded?: boolean;
  zoom?: boolean;
  className?: string;
}) {
  const cls = cn("img-graded absolute inset-0", zoom && "zoom-media");
  return (
    <div className={cn("relative overflow-hidden", aspect, rounded && "rounded-soft", className)}>
      {locale ? (
        <ImageSlot name={name} locale={locale} position={position} className={cls} />
      ) : (
        <ImageSlot name={name} decorative position={position} className={cls} />
      )}
    </div>
  );
}
