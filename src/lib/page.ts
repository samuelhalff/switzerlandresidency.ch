import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, t, type Locale, type TKey } from "./i18n";
import { pageMetadata } from "./seo";

export type LocaleParams = Promise<{ locale: string }>;

export async function getLocale(params: LocaleParams): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

/** generateMetadata for a fixed page whose title/description live in the i18n JSON. */
export function staticMetadata(path: string, titleKey: TKey, descriptionKey: TKey, opts: { noindex?: boolean } = {}) {
  return async ({ params }: { params: LocaleParams }): Promise<Metadata> => {
    const locale = await getLocale(params);
    return pageMetadata({
      locale,
      path,
      title: t(locale, titleKey),
      description: t(locale, descriptionKey),
      noindex: opts.noindex,
    });
  };
}
