import type { Locale } from "./i18n";
import { SITE_URL } from "./site";

/** Locale-less path like "/guides/foo/" → "/en/guides/foo/". Paths always end with "/". */
export function localePath(locale: Locale, path = "/"): string {
  const clean = ("/" + path.replace(/^\/+/, "")).replace(/\/?$/, "/");
  return `/${locale}${clean === "/" ? "/" : clean}`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Collection name → URL segment. */
export const collectionBase = {
  services: "services",
  cantons: "cantons",
  origins: "moving-from",
  guides: "guides",
  advisers: "for-advisers",
} as const;
