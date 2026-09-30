import { t } from "@/lib/i18n";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import GuideIndex from "@/components/GuideIndex";
import CtaBand from "@/components/CtaBand";

export const generateMetadata = staticMetadata("/guides/", "guides.title", "guides.description");

export default async function GuidesPage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  return (
    <>
      <PageHeader
        locale={locale}
        title={t(locale, "guides.title")}
        intro={t(locale, "guides.intro")}
        crumbs={[{ label: t(locale, "nav.guides"), path: "/guides/" }]}
      />
      <section className="container-page section">
        <GuideIndex locale={locale} />
      </section>
      <CtaBand locale={locale} />
    </>
  );
}
