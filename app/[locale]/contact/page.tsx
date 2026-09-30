import { getMessages, locales, t } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import { CONTACT_EMAIL, FORMSPARK_ID } from "@/lib/site";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import ContactForm from "@/components/ContactForm";
import ContactChannels from "@/components/ContactChannels";
import ArchImage from "@/components/ui/ArchImage";
import Card from "@/components/ui/Card";
import IconBadge from "@/components/ui/IconBadge";
import Section from "@/components/ui/Section";

export const generateMetadata = staticMetadata("/contact/", "contact.title", "contact.description");

export default async function ContactPage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  const m = getMessages(locale);
  return (
    <>
      <PageHeader
        locale={locale}
        title={t(locale, "contact.title")}
        intro={t(locale, "contact.intro")}
        crumbs={[{ label: t(locale, "nav.contact"), path: "/contact/" }]}
      />
      <Section spacing="sm" className="pb-24 sm:pb-28">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14">
          <div id="form" className="scroll-mt-28">
            <ContactForm
              labels={m.contact.form}
              locale={locale}
              formsparkId={FORMSPARK_ID}
              email={CONTACT_EMAIL}
              privacyHref={localePath(locale, "/privacy/")}
              languages={locales.map((code) => ({ code, name: m.languages[code] }))}
            />
          </div>
          <aside className="space-y-10">
            <Card tone="sage">
              <IconBadge icon="chat" tone="surface" />
              <h2 className="mt-5 text-2xl">{t(locale, "contact.channelsTitle")}</h2>
              <div className="mt-5">
                <ContactChannels locale={locale} />
              </div>
            </Card>
            <ArchImage name="cityGeneva" locale={locale} aspect="5/6" frame="blush" className="mx-auto hidden w-full max-w-[360px] lg:block" />
          </aside>
        </div>
      </Section>
    </>
  );
}
