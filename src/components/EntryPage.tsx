import type { Collection, Entry } from "@/lib/content";
import { getPublishedEntries } from "@/lib/content";
import { t, type Locale } from "@/lib/i18n";
import { imageForEntry } from "@/lib/images";
import { absoluteUrl, collectionBase, localePath } from "@/lib/paths";
import { entryPath, hubLabelKey } from "@/lib/entry-route";
import { articleLd, serviceLd } from "@/lib/jsonld";
import PageHeader from "./PageHeader";
import Markdown from "./Markdown";
import Faq from "./Faq";
import JsonLd from "./JsonLd";
import CtaBand from "./CtaBand";
import EntryCard, { formatDate } from "./EntryCard";
import Button from "./ui/Button";
import Container from "./ui/Container";
import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";

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
        image={imageForEntry(entry)}
        crumbs={[
          { label: t(locale, hubLabelKey[collection]), path: `/${collectionBase[collection]}/` },
          { label: entry.title, path: entryPath(collection, entry.slug) },
        ]}
      >
        {entry.updated ? (
          <p className="mt-6 text-sm text-muted">
            {t(locale, "article.updated")} <time dateTime={entry.updated}>{formatDate(entry.updated, locale)}</time>
          </p>
        ) : null}
      </PageHeader>

      <Container className="grid gap-14 pb-24 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
        <div className="min-w-0">
          {entry.draft ? (
            <p className="mb-8 border-l-2 border-accent pl-4 text-sm">
              <strong className="mr-2 font-semibold">{t(locale, "common.draftBadge")}.</strong>
              {t(locale, "common.draftNotice")}
            </p>
          ) : null}
          <Markdown source={entry.body} />

          {entry.sources.length ? (
            <section className="mt-14 max-w-prose border-t border-line pt-8" aria-labelledby="sources-title">
              <h2 id="sources-title" className="text-[1.6rem]">
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
            <div className="mt-16 max-w-prose">
              <Faq title={t(locale, "common.faqTitle")} items={entry.faq} compact />
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border-t border-ink pt-6">
            <h2 className="text-[1.6rem] leading-snug">{t(locale, "article.ctaTitle")}</h2>
            <p className="mt-3 text-[0.95rem] text-muted">{t(locale, "article.ctaText")}</p>
            <Button href={localePath(locale, "/contact/")} className="mt-6">
              {t(locale, "common.ctaConversation")}
            </Button>
            <div className="mt-5">
              <Button href={localePath(locale, "/eligibility-check/")} variant="link" arrow>
                {t(locale, "common.ctaRoute")}
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted">{t(locale, "common.indicative")}</p>
          </div>
        </aside>
      </Container>

      {related.length ? (
        <Section hairline>
          <SectionHeading title={t(locale, "article.related")} />
          <ul className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-3">
            {related.map((r, i) => (
              <EntryCard key={r.slug} entry={r} locale={locale} index={i} aspect="aspect-[4/3]" compactOnMobile />
            ))}
          </ul>
        </Section>
      ) : null}

      <CtaBand locale={locale} />

      {collection === "services" ? <JsonLd data={serviceLd(entry, url)} /> : null}
      {collection === "guides" ? <JsonLd data={articleLd(entry, url)} /> : null}
    </article>
  );
}
