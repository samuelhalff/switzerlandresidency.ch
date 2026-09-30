import { collections, getPublishedEntries, getTranslations } from "./content";
import { getMessages, locales, type Locale } from "./i18n";
import { collectionBase } from "./paths";

/** Fixed pages that exist in every locale (locale-less paths). */
export const STATIC_PATHS = [
  "/",
  "/how-it-works/",
  "/services/",
  "/cantons/",
  "/moving-from/",
  "/guides/",
  "/eligibility-check/",
  "/about/",
  "/contact/",
  "/privacy/",
  "/legal-notice/",
] as const;

export type IndexablePage = {
  /** Per-locale path for this page (hreflang group). */
  paths: Partial<Record<Locale, string>>;
  lastModified?: string;
};

/** Every indexable page, grouped across languages. Drafts and empty categories are excluded. */
export function indexablePages(): IndexablePage[] {
  const pages: IndexablePage[] = STATIC_PATHS.map((p) => ({
    paths: Object.fromEntries(locales.map((l) => [l, p])),
  }));

  for (const collection of collections) {
    const seen = new Set<string>();
    for (const locale of locales) {
      for (const entry of getPublishedEntries(locale, collection)) {
        if (seen.has(entry.translationKey)) continue;
        seen.add(entry.translationKey);
        const paths: Partial<Record<Locale, string>> = {};
        let lastModified = entry.updated;
        for (const [loc, tr] of Object.entries(getTranslations(entry)) as [Locale, typeof entry][]) {
          if (tr.draft) continue;
          paths[loc] = `/${collectionBase[collection]}/${tr.slug}/`;
          if (tr.updated > lastModified) lastModified = tr.updated;
        }
        pages.push({ paths, lastModified });
      }
    }
  }

  for (const key of Object.keys(getMessages("en").guides.categories)) {
    const paths: Partial<Record<Locale, string>> = {};
    for (const locale of locales) {
      if (getPublishedEntries(locale, "guides").some((g) => g.category === key)) {
        paths[locale] = `/guides/category/${key}/`;
      }
    }
    if (Object.keys(paths).length) pages.push({ paths });
  }
  return pages;
}
