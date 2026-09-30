import type { ImageName } from "@/lib/images";
import { imageCaption } from "@/lib/images";
import type { Locale } from "@/lib/i18n";
import ImageSlot from "../ImageSlot";
import Container from "./Container";
import { cn } from "./cn";

/** Edge-to-edge photo break with a small, plain caption (place, region) underneath. */
export default function FullBleedImage({
  name,
  locale,
  position,
  className,
  caption = true,
}: {
  name: ImageName;
  locale: Locale;
  position?: string;
  className?: string;
  caption?: boolean;
}) {
  const text = caption ? imageCaption(name, locale) : undefined;
  return (
    <figure className={cn("my-4", className)} data-reveal="">
      <div className="relative h-[62vh] min-h-[360px] max-h-[760px] overflow-hidden">
        <ImageSlot name={name} locale={locale} position={position} className="img-graded absolute inset-0" />
      </div>
      {text ? (
        <Container>
          <figcaption className="mt-3 text-sm text-muted">{text}</figcaption>
        </Container>
      ) : null}
    </figure>
  );
}
