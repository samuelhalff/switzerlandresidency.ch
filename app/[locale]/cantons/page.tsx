import Link from "next/link";
import { getPublishedEntries, isPublished } from "@/lib/content";
import { getMessages, t } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import { cantonSlugs } from "@/lib/cantons";
import type { CantonCode } from "@/lib/eligibility";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import EntryCard from "@/components/EntryCard";
import CtaBand from "@/components/CtaBand";
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
      <Section spacing="sm">
        <SectionHeading title={t(locale, "cantons.guidesTitle")} />
        {guides.length ? (
          <ul className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g, i) => (
              <EntryCard key={g.slug} entry={g} locale={locale} index={i % 3} aspect="aspect-[4/3]" compactOnMobile />
            ))}
          </ul>
        ) : (
          <p className="mt-4 max-w-2xl text-lg text-muted">{t(locale, "common.comingSoon")}</p>
        )}
      </Section>
      <Section hairline spacing="md">
        <SectionHeading title={t(locale, "cantons.allTitle")} lead={t(locale, "cantons.allIntro")} />
        <ul className="mt-10 grid border-t border-line sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3" data-reveal="">
          {all.map(([code, name]) => {
            const slug = cantonSlugs[code as CantonCode];
            const linked = slug && isPublished(locale, "cantons", slug);
            return (
              <li key={code} className="flex items-baseline gap-4 border-b border-line py-3.5">
                <span className="w-7 shrink-0 text-xs font-medium tracking-wider text-muted">{code}</span>
                {linked ? (
                  <Link href={localePath(locale, `/cantons/${slug}/`)} className="link">
                    {name}
                  </Link>
                ) : (
                  <span>{name}</span>
                )}
              </li>
            );
          })}
        </ul>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
