import Link from "next/link";
import type { Collection, Entry } from "@/lib/content";
import { getPublishedEntries } from "@/lib/content";
import { t, type Locale } from "@/lib/i18n";
import { absoluteUrl, collectionBase, localePath } from "@/lib/paths";
import { entryPath, hubLabelKey } from "@/lib/entry-route";
import { articleLd, serviceLd } from "@/lib/jsonld";
import PageHeader from "./PageHeader";
import Markdown from "./Markdown";
import Faq from "./Faq";
import JsonLd from "./JsonLd";
import CtaBand from "./CtaBand";
import EntryCard, { formatDate } from "./EntryCard";

export default function EntryPage({ locale, entry, collection }: { locale: Locale; entry: Entry; collection: Collection }) {
  const url = absoluteUrl(localePath(locale, entryPath(collection, entry.slug)));
  const related =
    collection === "guides"
      ? getPublishedEntries(locale, "guides")
          .filter((g) => g.slug !== entry.slug && g.category === entry.category)
          .slice(0, 3)
      : [];

  return (
    <article>
      <PageHeader
        locale={locale}
        title={entry.title}
        intro={entry.description}
        crumbs={[
          { label: t(locale, hubLabelKey[collection]), path: `/${collectionBase[collection]}/` },
          { label: entry.title, path: entryPath(collection, entry.slug) },
        ]}
      >
        {entry.updated ? (
          <p className="mt-5 text-sm text-muted">
            {t(locale, "article.updated")}{" "}
            <time dateTime={entry.updated}>{formatDate(entry.updated, locale)}</time>
          </p>
        ) : null}
      </PageHeader>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {entry.draft ? (
            <p className="mb-8 rounded-card border border-accent-soft bg-sand px-5 py-4 text-sm">
              <strong className="mr-2 font-semibold">{t(locale, "common.draftBadge")}.</strong>
              {t(locale, "common.draftNotice")}
            </p>
          ) : null}
          <Markdown source={entry.body} />

          {entry.sources.length ? (
            <section className="mt-12 max-w-prose" aria-labelledby="sources-title">
              <h2 id="sources-title" className="text-2xl">
                {t(locale, "article.sources")}
              </h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted">
                {entry.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} className="link break-words" target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {entry.faq.length ? (
            <div className="mt-14 max-w-prose">
              <Faq title={t(locale, "common.faqTitle")} items={entry.faq} />
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card bg-sand">
            <h2 className="text-xl">{t(locale, "article.ctaTitle")}</h2>
            <p className="mt-3 text-sm text-muted">{t(locale, "article.ctaText")}</p>
            <Link href={localePath(locale, "/eligibility-check/")} className="btn btn-primary mt-5 w-full">
              {t(locale, "common.ctaCheck")}
            </Link>
            <Link href={localePath(locale, "/contact/")} className="btn btn-secondary mt-3 w-full">
              {t(locale, "common.ctaTalk")}
            </Link>
            <p className="mt-4 text-xs text-muted">{t(locale, "common.indicative")}</p>
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="container-page pb-6">
          <h2 className="h2">{t(locale, "article.related")}</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {related.map((r) => (
              <EntryCard key={r.slug} entry={r} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      <CtaBand locale={locale} />

      {collection === "services" ? <JsonLd data={serviceLd(entry, url)} /> : null}
      {collection === "guides" ? <JsonLd data={articleLd(entry, url)} /> : null}
    </article>
  );
}
