import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { locales, type Locale } from "./i18n";
import { typeset } from "./typography";

/**
 * Markdown content lives in content/<locale>/<collection>/<slug>.md.
 * Adding a file is all that is needed: routes, listings, sitemap and hreflang pick it up at build time.
 */
export const collections = ["guides", "services", "cantons", "origins"] as const;
export type Collection = (typeof collections)[number];

export type FaqItem = { q: string; a: string };
export type Source = { label: string; url: string };
/** SEO keywords chosen by keyword research (frontmatter `keywords`); emitted in Article JSON-LD only. */
export type Keywords = { primary: string; secondary: string[] };

export type Entry = {
  collection: Collection;
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  translationKey: string;
  updated: string;
  published?: string;
  /** ISO date; the page is only built on/after this date (see readCollection). */
  publishAt?: string;
  category: string;
  draft: boolean;
  faq: FaqItem[];
  sources: Source[];
  keywords?: Keywords;
  body: string;
};

function toKeywords(value: unknown): Keywords | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as { primary?: unknown; secondary?: unknown };
  if (typeof v.primary !== "string" || !v.primary.trim()) return undefined;
  const secondary = Array.isArray(v.secondary) ? v.secondary.filter((k): k is string => typeof k === "string" && k.trim() !== "") : [];
  return { primary: v.primary.trim(), secondary: secondary.map((k) => k.trim()) };
}

const CONTENT_DIR = path.join(process.cwd(), "content");
const cache = new Map<string, Entry[]>();

function toIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === "string" ? value : "";
}

function readCollection(locale: Locale, collection: Collection): Entry[] {
  const cacheKey = `${locale}/${collection}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const dir = path.join(CONTENT_DIR, locale, collection);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")) : [];
  const entries = files.map((file): Entry => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
    const publishAt = toIsoDate(data.publishAt);
    const slug = typeof data.slug === "string" && data.slug ? data.slug : file.replace(/\.md$/, "");
    return {
      collection,
      locale,
      slug,
      title: typeset(locale, String(data.title ?? slug)),
      description: typeset(locale, String(data.description ?? "")),
      translationKey: String(data.translationKey ?? slug),
      updated: toIsoDate(data.updated),
      published: toIsoDate(data.published) || publishAt || undefined,
      publishAt: publishAt || undefined,
      category: String(data.category ?? ""),
      draft: data.draft === true,
      faq: Array.isArray(data.faq)
        ? (data.faq as FaqItem[]).map((f) => ({ q: typeset(locale, f.q), a: typeset(locale, f.a) }))
        : [],
      sources: Array.isArray(data.sources) ? (data.sources as Source[]) : [],
      keywords: toKeywords(data.keywords),
      body: typeset(locale, content),
    };
  });
  // Scheduled pages (publishAt in the future) are left out of the build entirely until the
  // daily scheduled deploy runs on or after that date — no route, listing or sitemap entry.
  const today = new Date().toISOString().slice(0, 10);
  const live = entries.filter((e) => !e.publishAt || e.publishAt <= today);
  live.sort((a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title));
  cache.set(cacheKey, live);
  return live;
}

/** All entries of a collection (drafts included — they build but are noindex and unlisted). */
export function getAllEntries(locale: Locale, collection: Collection): Entry[] {
  return readCollection(locale, collection);
}

/** Entries shown in listings, sitemap and llms.txt. */
export function getPublishedEntries(locale: Locale, collection: Collection): Entry[] {
  return readCollection(locale, collection).filter((e) => !e.draft);
}

export function getEntry(locale: Locale, collection: Collection, slug: string): Entry | undefined {
  return readCollection(locale, collection).find((e) => e.slug === slug);
}

export function isPublished(locale: Locale, collection: Collection, slug: string): boolean {
  const e = getEntry(locale, collection, slug);
  return !!e && !e.draft;
}

/** Other-language versions sharing the same translationKey (includes the entry itself). */
export function getTranslations(entry: Entry): Partial<Record<Locale, Entry>> {
  const out: Partial<Record<Locale, Entry>> = {};
  for (const loc of locales) {
    const match = readCollection(loc, entry.collection).find((e) => e.translationKey === entry.translationKey);
    if (match) out[loc] = match;
  }
  return out;
}
