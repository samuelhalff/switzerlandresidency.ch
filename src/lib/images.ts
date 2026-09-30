import { t, type Locale, type TKey } from "./i18n";

/**
 * Single place to swap photography. Files live in public/images/ (self-hosted webp, credits in CREDITS.md).
 * Missing files degrade to the gradient defined by each slot, so pages never break.
 */
export const images = {
  hero: { src: "/images/hero.webp", altKey: "imageAlt.hero", captionKey: "imageCaption.hero" },
  lakeGeneva: { src: "/images/lake-geneva.webp", altKey: "imageAlt.lakeGeneva", captionKey: "imageCaption.lakeGeneva" },
  lakeLucerne: { src: "/images/lake-lucerne.webp", altKey: "imageAlt.lakeLucerne", captionKey: "imageCaption.lakeLucerne" },
  lakeLugano: { src: "/images/lake-lugano.webp", altKey: "imageAlt.lakeLugano", captionKey: "imageCaption.lakeLugano" },
  mountainAlps: { src: "/images/mountain-matterhorn.webp", altKey: "imageAlt.mountainAlps", captionKey: "imageCaption.mountainAlps" },
  mountainMatterhorn: { src: "/images/mountain-matterhorn.webp", altKey: "imageAlt.mountainMatterhorn", captionKey: "imageCaption.mountainMatterhorn" },
  mountainEngadin: { src: "/images/mountain-engadin.webp", altKey: "imageAlt.mountainEngadin", captionKey: "imageCaption.mountainEngadin" },
  mountainVillage: { src: "/images/mountain-verbier.webp", altKey: "imageAlt.mountainVillage", captionKey: "imageCaption.mountainVillage" },
  cityGeneva: { src: "/images/city-geneva.webp", altKey: "imageAlt.cityGeneva", captionKey: "imageCaption.cityGeneva" },
  cityZurich: { src: "/images/city-zurich.webp", altKey: "imageAlt.cityZurich", captionKey: "imageCaption.cityZurich" },
  cityZug: { src: "/images/city-zug.webp", altKey: "imageAlt.cityZug", captionKey: "imageCaption.cityZug" },
  cityLausanne: { src: "/images/city-lausanne.webp", altKey: "imageAlt.cityLausanne", captionKey: "imageCaption.cityLausanne" },
  familyLife: { src: "/images/family-life.webp", altKey: "imageAlt.familyLife", captionKey: "imageCaption.familyLife" },
  homeChalet: { src: "/images/home-chalet.webp", altKey: "imageAlt.homeChalet", captionKey: "imageCaption.homeChalet" },
  homeLakeside: { src: "/images/home-lakeside.webp", altKey: "imageAlt.homeLakeside", captionKey: "imageCaption.homeLakeside" },
  school: { src: "/images/school.webp", altKey: "imageAlt.school", captionKey: "imageCaption.school" },
  vineyards: { src: "/images/vineyards-lavaux.webp", altKey: "imageAlt.vineyards", captionKey: "imageCaption.vineyards" },
  terraceLake: { src: "/images/terrace-lake.webp", altKey: "imageAlt.terraceLake", captionKey: "imageCaption.terraceLake" },
  lakesideWalk: { src: "/images/lakeside-walk.webp", altKey: "imageAlt.lakesideWalk", captionKey: "imageCaption.lakesideWalk" },
  villageLane: { src: "/images/village-lane.webp", altKey: "imageAlt.villageLane", captionKey: "imageCaption.villageLane" },
  chaletInterior: { src: "/images/chalet-interior.webp", altKey: "imageAlt.chaletInterior", captionKey: "imageCaption.chaletInterior" },
  homeArrival: { src: "/images/home-arrival.webp", altKey: "imageAlt.homeArrival", captionKey: "imageCaption.homeArrival" },
  heroPeople: { src: "/images/hero-people.webp", altKey: "imageAlt.heroPeople", captionKey: "imageCaption.heroPeople" },
  eveningWindows: { src: "/images/evening-windows.webp", altKey: "imageAlt.eveningWindows", captionKey: "imageCaption.eveningWindows" },
} satisfies Record<string, { src: string; altKey: TKey; captionKey: TKey }>;

export type ImageName = keyof typeof images;

export function imageFor(name: ImageName, locale: Locale) {
  const img = images[name];
  return { src: img.src, alt: t(locale, img.altKey) };
}

/** Plain, informative caption (place, region) for photo breaks. */
export function imageCaption(name: ImageName, locale: Locale): string {
  return t(locale, images[name].captionKey);
}

/**
 * Home page photography in one place, so new people/interior photos can be swapped in
 * without touching the page. Keys are slots, values are entries of `images`.
 */
export const homeImages = {
  hero: "hero",
  breakOne: "cityLausanne",
  pairWide: "homeLakeside",
  pairTall: "terraceLake",
  breakTwo: "chaletInterior",
} satisfies Record<string, ImageName>;

/** Decorative card/header imagery per content entry (falls back by collection). */
const bySlug: Record<string, ImageName> = {
  // services
  "residence-permit": "cityGeneva",
  "lump-sum-taxation": "homeLakeside",
  "tax-ruling": "lakeLucerne",
  "property-search-purchase": "homeArrival",
  "settling-in": "lakesideWalk",
  "ongoing-tax-wealth": "cityZurich",
  // cantons
  geneva: "cityGeneva",
  vaud: "vineyards",
  valais: "mountainVillage",
  zug: "cityZug",
  ticino: "lakeLugano",
  graubunden: "mountainEngadin",
  lucerne: "lakeLucerne",
  zurich: "cityZurich",
  bern: "mountainMatterhorn",
  fribourg: "homeChalet",
  schwyz: "lakeLucerne",
  // guides: hand-picked so cards in the same category rarely repeat a photo
  "how-lump-sum-tax-is-calculated": "lakeGeneva",
  "lump-sum-or-ordinary-taxation": "mountainEngadin",
  "lump-sum-taxation-by-canton": "homeLakeside",
  "modified-lump-sum-tax-treaties": "cityZug",
  "swiss-lump-sum-taxation": "lakeLugano",
  "tax-ruling-before-moving": "lakeLucerne",
  "moving-from-asia": "cityZug",
  "moving-from-france": "vineyards",
  "moving-from-germany": "cityZurich",
  "moving-from-uae-gulf": "lakeLugano",
  "moving-from-uk-after-non-dom": "cityLausanne",
  "moving-from-usa": "mountainEngadin",
  "uk-non-doms-switzerland-italy-uae-monaco": "lakeGeneva",
  "buying-property-lex-koller": "homeLakeside",
  "holiday-homes-alps": "homeChalet",
  "lex-koller-reform-2026": "mountainVillage",
  "eu-citizens-b-permit-without-work": "cityGeneva",
  "residence-non-eu-financially-independent": "lakeLucerne",
  "retiring-in-switzerland": "vineyards",
  "swiss-permits-explained": "cityLausanne",
  "switzerland-golden-visa": "mountainMatterhorn",
  "first-90-days-checklist": "familyLife",
  "health-insurance-new-residents": "cityZurich",
  "international-schools-switzerland": "school",
  "inheritance-gift-tax": "homeChalet",
  "best-cantons-wealthy-families": "mountainEngadin",
  "geneva-or-vaud": "vineyards",
  // origins
  "united-kingdom": "cityLausanne",
  "european-union": "vineyards",
  gulf: "lakeLugano",
  americas: "mountainEngadin",
  asia: "cityZug",
};

/** Several photos per guide category; the slug picks one so neighbouring cards rarely repeat. */
const byCategory: Record<string, ImageName[]> = {
  "lump-sum-taxation": ["homeLakeside", "lakeGeneva", "mountainEngadin", "cityZug"],
  "residence-permits": ["cityGeneva", "cityLausanne", "lakeLucerne"],
  "moving-from": ["lakeLucerne", "familyLife", "cityZurich", "lakeLugano"],
  property: ["homeChalet", "mountainVillage", "homeLakeside"],
  "where-to-live": ["vineyards", "mountainMatterhorn"],
  "settling-in": ["school", "familyLife", "cityZurich"],
  "tax-and-wealth": ["cityZurich"],
};

function pick(list: ImageName[], key: string): ImageName {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

const byCollection: Record<string, ImageName> = {
  guides: "lakeGeneva",
  services: "homeLakeside",
  cantons: "mountainMatterhorn",
  origins: "familyLife",
  advisers: "terraceLake",
};

export function imageForEntry(entry: { collection: string; slug: string; category?: string }): ImageName {
  if (entry.collection === "guides") {
    if (bySlug[entry.slug]) return bySlug[entry.slug];
    const list = entry.category ? byCategory[entry.category] : undefined;
    return list ? pick(list, entry.slug) : byCollection.guides;
  }
  return bySlug[entry.slug] ?? byCollection[entry.collection] ?? "hero";
}
