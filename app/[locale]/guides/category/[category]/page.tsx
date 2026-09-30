import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedEntries } from "@/lib/content";
import { isLocale, t, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import GuideIndex, { guideCategories } from "@/components/GuideIndex";
import CtaBand from "@/components/CtaBand";
import Section from "@/components/ui/Section";

type Params = Promise<{ locale: string; category: string }>;

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en";
  return guideCategories(locale).map((c) => ({ category: c.key }));
}

async function resolve(params: Params) {
  const { locale, category } = await params;
  if (!isLocale(locale)) notFound();
  const cat = guideCategories(locale).find((c) => c.key === category);
  if (!cat) notFound();
  return { locale, cat };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, cat } = await resolve(params);
  const empty = getPublishedEntries(locale, "guides").every((g) => g.category !== cat.key);
  return pageMetadata({
    locale,
    path: `/guides/category/${cat.key}/`,
    title: `${cat.label} · ${t(locale, "guides.title")}`,
    description: `${cat.label}: ${t(locale, "guides.description")}`,
    noindex: empty,
  });
}

export default async function GuideCategoryPage({ params }: { params: Params }) {
  const { locale, cat } = await resolve(params);
  return (
    <>
      <PageHeader
        locale={locale}
        title={cat.label}
        intro={t(locale, "guides.categoryIntro")}
        image="vineyards"
        crumbs={[
          { label: t(locale, "nav.guides"), path: "/guides/" },
          { label: cat.label, path: `/guides/category/${cat.key}/` },
        ]}
      />
      <Section spacing="sm" className="pb-24">
        <GuideIndex locale={locale} category={cat.key} />
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
