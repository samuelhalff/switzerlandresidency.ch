import type { Metadata } from "next";
import { locales, t, type Locale } from "./i18n";
import { absoluteUrl, localePath } from "./paths";
import { NOINDEX, SITE_NAME } from "./site";

type PageMetaInput = {
  locale: Locale;
  /** Locale-less path, e.g. "/guides/my-guide/". */
  path: string;
  title: string;
  description: string;
  /** Set true for drafts or thin pages. NEXT_PUBLIC_NOINDEX forces noindex regardless. */
  noindex?: boolean;
  /**
   * Per-locale paths for hreflang when they differ or when a translation is missing.
   * Defaults to the same path in every locale. Missing locales are omitted (never point hreflang at EN).
   */
  alternates?: Partial<Record<Locale, string>>;
  /** Use the title as-is (no "| Switzerland Residency" suffix). */
  absoluteTitle?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export function languageAlternates(paths: Partial<Record<Locale, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const loc of locales) {
    const p = paths[loc];
    if (p) out[loc] = absoluteUrl(localePath(loc, p));
  }
  if (paths.en) out["x-default"] = absoluteUrl(localePath("en", paths.en));
  return out;
}

export function pageMetadata(input: PageMetaInput): Metadata {
  const { locale, path, title, description } = input;
  const url = absoluteUrl(localePath(locale, path));
  const alternatePaths = input.alternates ?? Object.fromEntries(locales.map((l) => [l, path]));
  const noindex = NOINDEX || input.noindex;
  const fullTitle = input.absoluteTitle ? title : `${title} | ${SITE_NAME}`;

  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url, languages: languageAlternates(alternatePaths) },
    robots: noindex ? { index: false, follow: !NOINDEX } : { index: true, follow: true },
    openGraph: {
      type: input.type ?? "website",
      url,
      title: fullTitle,
      description,
      siteName: SITE_NAME,
      locale: t(locale, "meta.ogLocale"),
      ...(input.type === "article"
        ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime }
        : {}),
    },
    twitter: { card: "summary_large_image", title: fullTitle, description },
  };
}
