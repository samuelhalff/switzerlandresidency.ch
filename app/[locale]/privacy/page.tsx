import { getMessages, t } from "@/lib/i18n";
import { GA_ID } from "@/lib/site";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import LegalText from "@/components/LegalText";
import CookieSettingsButton from "@/components/CookieSettingsButton";

export const generateMetadata = staticMetadata("/privacy/", "privacy.title", "privacy.description");

/** Bump when the policy text changes. */
const UPDATED = "2026-09-30";

export default async function PrivacyPage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  return (
    <>
      <PageHeader
        locale={locale}
        title={t(locale, "privacy.title")}
        crumbs={[{ label: t(locale, "nav.privacy"), path: "/privacy/" }]}
      >
        <p className="mt-4 text-sm text-muted">
          {t(locale, "privacy.updatedLabel")}: <time dateTime={UPDATED}>{UPDATED}</time>
        </p>
      </PageHeader>
      <section className="container-page section">
        <LegalText sections={getMessages(locale).privacy.sections} />
        {GA_ID ? (
          <div className="mt-8">
            <CookieSettingsButton className="btn btn-secondary" label={t(locale, "footer.cookieSettings")} />
          </div>
        ) : null}
      </section>
    </>
  );
}
