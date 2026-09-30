import { getMessages, t } from "@/lib/i18n";
import { absoluteUrl, localePath } from "@/lib/paths";
import { webApplicationLd } from "@/lib/jsonld";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import EligibilityCheck from "@/components/EligibilityCheck";
import JsonLd from "@/components/JsonLd";
import Section from "@/components/ui/Section";

export const generateMetadata = staticMetadata("/eligibility-check/", "check.title", "check.description");

export default async function EligibilityCheckPage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  const m = getMessages(locale);
  return (
    <>
      <PageHeader
        locale={locale}
        title={t(locale, "check.title")}
        crumbs={[{ label: t(locale, "nav.eligibility"), path: "/eligibility-check/" }]}
      />
      <Section spacing="sm" container="narrow" className="pb-24 sm:pb-28">
        <EligibilityCheck labels={m.check} cantonNames={m.cantonNames} contactHref={localePath(locale, "/contact/")} />
      </Section>
      <JsonLd
        data={webApplicationLd(
          t(locale, "check.title"),
          t(locale, "check.description"),
          absoluteUrl(localePath(locale, "/eligibility-check/")),
        )}
      />
    </>
  );
}
