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
        crumbs={[{ label: t(locale, "nav.cantons"), path: "/cantons/" }]}
      />
      <section className="container-page section">
        <h2 className="h2">{t(locale, "cantons.guidesTitle")}</h2>
        {guides.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g) => (
              <EntryCard key={g.slug} entry={g} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="lead mt-4 max-w-2xl">{t(locale, "common.comingSoon")}</p>
        )}

        <h2 className="h2 mt-16">{t(locale, "cantons.allTitle")}</h2>
        <p className="mt-3 max-w-2xl text-muted">{t(locale, "cantons.allIntro")}</p>
        <ul className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {all.map(([code, name]) => {
            const slug = cantonSlugs[code as CantonCode];
            const linked = slug && isPublished(locale, "cantons", slug);
            return (
              <li key={code} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                <span className="w-8 text-xs font-semibold tracking-wider text-muted">{code}</span>
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
      </section>
      <CtaBand locale={locale} />
    </>
  );
}
