import type { Collection, Entry } from "@/lib/content";
import { getPublishedEntries } from "@/lib/content";
import { getMessages, t, type Locale } from "@/lib/i18n";
import { imageForEntry } from "@/lib/images";
import { absoluteUrl, collectionBase, localePath } from "@/lib/paths";
import { entryPath, hubLabelKey } from "@/lib/entry-route";
import { articleLd, serviceLd } from "@/lib/jsonld";
import { ctaContent } from "@/lib/cta";
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

function serviceTypeFor(locale: Locale, slug: string): string | undefined {
  const items = getMessages(locale).services.items as Record<string, { serviceType?: string }>;
  return items[slug]?.serviceType;
}

export default function EntryPage({ locale, entry, collection }: { locale: Locale; entry: Entry; collection: Collection }) {
  const cta = ctaContent(entry.cta, locale);
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
        {/* Guides show when they were last checked against official sources; evergreen pages
            (services, cantons, origins) show no date. JSON-LD keeps the real publication date. */}
        {(collection === "guides" || collection === "advisers") && entry.updated ? (
          <p className="mt-6 text-sm text-muted">
            {t(locale, "article.reviewed")} <time dateTime={entry.updated}>{formatDate(entry.updated, locale)}</time>
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
            <h2 className="text-[1.6rem] leading-snug">{cta.aside.title}</h2>
            <p className="mt-3 text-[0.95rem] text-muted">{cta.aside.text}</p>
            <Button href={cta.primary.href} className="mt-6">
              {cta.primary.label}
            </Button>
            <div className="mt-5">
              <Button href={cta.secondary.href} variant="link" arrow>
                {cta.secondary.label}
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

      <CtaBand locale={locale} kind={entry.cta} />

      {collection === "services" ? <JsonLd data={serviceLd(entry, url, serviceTypeFor(locale, entry.slug))} /> : null}
      {collection === "guides" || collection === "advisers" ? <JsonLd data={articleLd(entry, url)} /> : null}
    </article>
  );
}
