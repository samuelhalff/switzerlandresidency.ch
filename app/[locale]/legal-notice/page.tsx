import { getMessages, t } from "@/lib/i18n";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/ui/Section";
import LegalText from "@/components/LegalText";

export const generateMetadata = staticMetadata("/legal-notice/", "legal.title", "legal.description");

export default async function LegalNoticePage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  return (
    <>
      <PageHeader
        locale={locale}
        title={t(locale, "legal.title")}
        crumbs={[{ label: t(locale, "nav.legalNotice"), path: "/legal-notice/" }]}
      />
      <Section spacing="sm" container="narrow" className="pb-24 sm:pb-28">
        <LegalText sections={getMessages(locale).legal.sections} />
      </Section>
    </>
  );
}
