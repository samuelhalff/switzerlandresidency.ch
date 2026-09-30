import { getPublishedEntries, isPublished } from "@/lib/content";
import { getMessages, t } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import { cantonSlugs } from "@/lib/cantons";
import type { CantonCode } from "@/lib/eligibility";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import EntryCard from "@/components/EntryCard";
import CtaBand from "@/components/CtaBand";
import Chip from "@/components/ui/Chip";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";

export const generateMetadata = staticMetadata("/cantons/", "cantons.title", "cantons.description");

export default async function CantonsPage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  const names = getMessages(locale).cantonNames;
  const guides = getPublishedEntries(locale, "cantons");
  const all = Object.entries(names).sort((a, b) => a[1].localeCompare(b[1], locale));

  return (
    <>
      <PageHeader
        locale={locale}
        title={t(locale, "cantons.title")}
        intro={t(locale, "cantons.intro")}
        image="lakeGeneva"
        crumbs={[{ label: t(locale, "nav.cantons"), path: "/cantons/" }]}
      />
      <Section spacing="md" className="pb-24 sm:pb-28">
        <SectionHeading title={t(locale, "cantons.guidesTitle")} />
        {guides.length ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g, i) => (
              <EntryCard key={g.slug} entry={g} locale={locale} as="li" index={i % 3} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 max-w-2xl text-lg text-muted">{t(locale, "common.comingSoon")}</p>
        )}
      </Section>
      <Section tone="sand" divider="top" spacing="md" className="pb-24 sm:pb-28">
        <SectionHeading title={t(locale, "cantons.allTitle")} lead={t(locale, "cantons.allIntro")} />
        <ul className="mt-10 flex flex-wrap gap-2.5" data-reveal="">
          {all.map(([code, name]) => {
            const slug = cantonSlugs[code as CantonCode];
            const linked = slug && isPublished(locale, "cantons", slug);
            return (
              <li key={code}>
                <Chip href={linked ? localePath(locale, `/cantons/${slug}/`) : undefined} icon={linked ? "pin" : undefined}>
                  <span className="mr-1.5 text-xs font-semibold tracking-wider text-muted">{code}</span>
                  {name}
                </Chip>
              </li>
            );
          })}
        </ul>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
