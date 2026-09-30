import Link from "next/link";
import { getPublishedEntries, isPublished } from "@/lib/content";
import { getMessages, t, type Locale } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import EntryCard from "./EntryCard";

type Item = { slug: string; title: string; summary: string };

function Card({ item, href, cta }: { item: Item; href?: string; cta: string }) {
  const inner = (
    <>
      <h3 className="text-xl group-hover:text-accent">{item.title}</h3>
      <p className="mt-3 flex-1 text-muted">{item.summary}</p>
      {href ? (
        <span className="mt-4 text-sm font-semibold text-accent">
          {cta} <span aria-hidden="true">→</span>
        </span>
      ) : null}
    </>
  );
  return href ? (
    <Link href={href} className="card group flex h-full flex-col">
      {inner}
    </Link>
  ) : (
    <div className="card flex h-full flex-col">{inner}</div>
  );
}

/** The six services from i18n; each links to its page once published content exists. */
export function ServiceGrid({ locale }: { locale: Locale }) {
  const items = Object.entries(getMessages(locale).services.items).map(([slug, v]) => ({ slug, ...v }));
  const extra = getPublishedEntries(locale, "services").filter((e) => !items.some((i) => i.slug === e.slug));
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card
          key={item.slug}
          item={item}
          cta={t(locale, "common.learnMore")}
          href={isPublished(locale, "services", item.slug) ? localePath(locale, `/services/${item.slug}/`) : undefined}
        />
      ))}
      {extra.map((e) => (
        <EntryCard key={e.slug} entry={e} locale={locale} />
      ))}
    </div>
  );
}

/** Origin regions from i18n; each links to its page once published content exists. */
export function OriginGrid({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const items = Object.entries(getMessages(locale).origins.items).map(([slug, v]) => ({ slug, ...v }));
  const extra = getPublishedEntries(locale, "origins").filter((e) => !items.some((i) => i.slug === e.slug));
  return (
    <div className={`grid gap-5 sm:grid-cols-2 ${compact ? "lg:grid-cols-5" : "lg:grid-cols-3"}`}>
      {items.map((item) => (
        <Card
          key={item.slug}
          item={item}
          cta={t(locale, "common.learnMore")}
          href={isPublished(locale, "origins", item.slug) ? localePath(locale, `/moving-from/${item.slug}/`) : undefined}
        />
      ))}
      {extra.map((e) => (
        <EntryCard key={e.slug} entry={e} locale={locale} />
      ))}
    </div>
  );
}
