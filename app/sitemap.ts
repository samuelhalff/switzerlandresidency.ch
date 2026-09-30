import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { absoluteUrl, localePath } from "@/lib/paths";
import { indexablePages } from "@/lib/routes";
import { languageAlternates } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = [];
  for (const page of indexablePages()) {
    const languages = languageAlternates(page.paths);
    for (const locale of locales) {
      const path = page.paths[locale];
      if (!path) continue;
      out.push({
        url: absoluteUrl(localePath(locale, path)),
        ...(page.lastModified ? { lastModified: page.lastModified } : {}),
        alternates: { languages },
      });
    }
  }
  return out;
}
