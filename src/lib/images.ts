import { t, type Locale, type TKey } from "./i18n";

/**
 * Single place to swap photography. Files live in public/images/ (self-hosted webp).
 * Missing files degrade to the gradient defined by each slot, so pages never break.
 */
export const images = {
  hero: { src: "/images/hero.webp", altKey: "imageAlt.hero" },
  lakeGeneva: { src: "/images/lake-geneva.webp", altKey: "imageAlt.lakeGeneva" },
  lakeLucerne: { src: "/images/lake-lucerne.webp", altKey: "imageAlt.lakeLucerne" },
  mountainAlps: { src: "/images/mountain-alps.webp", altKey: "imageAlt.mountainAlps" },
  mountainVillage: { src: "/images/mountain-village.webp", altKey: "imageAlt.mountainVillage" },
  cityGeneva: { src: "/images/city-geneva.webp", altKey: "imageAlt.cityGeneva" },
  cityZurich: { src: "/images/city-zurich.webp", altKey: "imageAlt.cityZurich" },
} satisfies Record<string, { src: string; altKey: TKey }>;

export type ImageName = keyof typeof images;

export function imageFor(name: ImageName, locale: Locale) {
  const img = images[name];
  return { src: img.src, alt: t(locale, img.altKey) };
}
