import type { Metadata } from "next";
import { getAllEntries, getEntry, getTranslations, type Collection } from "./content";
import { isLocale, locales, type Locale, type TKey } from "./i18n";
import { collectionBase } from "./paths";
import { pageMetadata } from "./seo";

export type EntryParams = Promise<{ locale: string; slug: string }>;

export const hubLabelKey: Record<Collection, TKey> = {
  services: "nav.services",
  cantons: "nav.cantons",
  origins: "nav.movingFrom",
  guides: "nav.guides",
  advisers: "nav.advisers",
};

export function entryPath(collection: Collection, slug: string): string {
  return `/${collectionBase[collection]}/${slug}/`;
}

/** Shared generateStaticParams for app/[locale]/<collection>/[slug]. */
export function entryStaticParams(collection: Collection) {
  return async ({ params }: { params: { locale: string } }) => {
    const locale = isLocale(params.locale) ? params.locale : "en";
    return getAllEntries(locale, collection).map((e) => ({ slug: e.slug }));
  };
}

export async function resolveEntry(collection: Collection, params: EntryParams) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return null;
  const entry = getEntry(locale, collection, slug);
  return entry ? { locale: locale as Locale, entry } : null;
}

export function entryMetadata(collection: Collection) {
  return async ({ params }: { params: EntryParams }): Promise<Metadata> => {
    const r = await resolveEntry(collection, params);
    if (!r) return {};
    const { locale, entry } = r;
    const alternates: Partial<Record<Locale, string>> = {};
    const translations = getTranslations(entry);
    for (const loc of locales) {
      const tr = translations[loc];
      if (tr && (!tr.draft || loc === locale)) alternates[loc] = entryPath(collection, tr.slug);
    }
    return pageMetadata({
      locale,
      path: entryPath(collection, entry.slug),
      title: entry.title,
      description: entry.description,
      noindex: entry.draft,
      alternates,
      type: collection === "guides" || collection === "advisers" ? "article" : "website",
      publishedTime: entry.published || entry.updated,
      modifiedTime: entry.updated,
    });
  };
}
