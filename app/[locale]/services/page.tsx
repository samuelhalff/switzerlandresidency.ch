import { t } from "@/lib/i18n";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import { ServiceGrid } from "@/components/Cards";
import CtaBand from "@/components/CtaBand";

export const generateMetadata = staticMetadata("/services/", "services.title", "services.description");

export default async function ServicesPage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  return (
    <>
      <PageHeader
        locale={locale}
        title={t(locale, "services.title")}
        intro={t(locale, "services.intro")}
        crumbs={[{ label: t(locale, "nav.services"), path: "/services/" }]}
      />
      <section className="container-page section">
        <ServiceGrid locale={locale} />
      </section>
      <CtaBand locale={locale} />
    </>
  );
}
