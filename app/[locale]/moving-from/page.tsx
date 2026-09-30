import { t } from "@/lib/i18n";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import { OriginGrid } from "@/components/Cards";
import CtaBand from "@/components/CtaBand";

export const generateMetadata = staticMetadata("/moving-from/", "origins.title", "origins.description");

export default async function MovingFromPage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  return (
    <>
      <PageHeader
        locale={locale}
        title={t(locale, "origins.title")}
        intro={t(locale, "origins.intro")}
        crumbs={[{ label: t(locale, "nav.movingFrom"), path: "/moving-from/" }]}
      />
      <section className="container-page section">
        <OriginGrid locale={locale} />
      </section>
      <CtaBand locale={locale} />
    </>
  );
}
