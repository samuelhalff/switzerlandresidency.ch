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
import { imageForEntry } from "@/lib/images";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Container from "./ui/Container";
import IconBadge from "./ui/IconBadge";
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
            {t(locale, "article.updated")}{" "}
            <time dateTime={entry.updated}>{formatDate(entry.updated, locale)}</time>
          </p>
        ) : null}
      </PageHeader>

      <Container className="grid gap-12 pb-20 pt-4 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {entry.draft ? (
            <p className="mb-8 rounded-tile bg-blush px-5 py-4 text-sm">
              <strong className="mr-2 font-semibold">{t(locale, "common.draftBadge")}.</strong>
              {t(locale, "common.draftNotice")}
            </p>
          ) : null}
          <Markdown source={entry.body} />

          {entry.sources.length ? (
            <section className="mt-12 max-w-prose" aria-labelledby="sources-title">
              <h2 id="sources-title" className="text-[1.75rem]">
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
              <Faq title={t(locale, "common.faqTitle")} items={entry.faq} compact />
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Card tone="blush" padding="md">
            <IconBadge icon="compass" tone="surface" />
            <h2 className="mt-5 text-2xl">{t(locale, "article.ctaTitle")}</h2>
            <p className="mt-3 text-[0.95rem] text-muted">{t(locale, "article.ctaText")}</p>
            <Button href={localePath(locale, "/eligibility-check/")} fullWidth className="mt-6">
              {t(locale, "common.ctaCheck")}
            </Button>
            <Button href={localePath(locale, "/contact/")} variant="secondary" fullWidth className="mt-3">
              {t(locale, "common.ctaTalk")}
            </Button>
            <p className="mt-5 text-xs text-muted">{t(locale, "common.indicative")}</p>
          </Card>
        </aside>
      </Container>

      {related.length ? (
        <Section tone="sage" divider="top" className="pb-24 sm:pb-28">
          <SectionHeading title={t(locale, "article.related")} />
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {related.map((r, i) => (
              <EntryCard key={r.slug} entry={r} locale={locale} as="li" index={i} />
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
