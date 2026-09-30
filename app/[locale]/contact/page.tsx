import { getMessages, locales, t } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import { FORMSPARK_ID, whatsappUrl } from "@/lib/site";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import ContactForm from "@/components/ContactForm";
import ContactChannels from "@/components/ContactChannels";
import Photo from "@/components/ui/Photo";
import { imageCaption } from "@/lib/images";
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
      <Section spacing="sm" className="pb-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14">
          <div id="form" className="scroll-mt-28">
            <ContactForm
              labels={m.contact.form}
              locale={locale}
              formsparkId={FORMSPARK_ID}
              whatsappHref={whatsappUrl}
              privacyHref={localePath(locale, "/privacy/")}
              languages={locales.map((code) => ({ code, name: m.languages[code] }))}
            />
          </div>
          <aside className="space-y-10">
            {/* The form is the only written channel; show alternatives only when WhatsApp is configured. */}
            {whatsappUrl ? (
              <div className="border-t border-ink pt-6">
                <h2 className="text-[1.6rem]">{t(locale, "contact.channelsTitle")}</h2>
                <div className="mt-5">
                  <ContactChannels locale={locale} includeForm={false} />
                </div>
              </div>
            ) : null}
            <figure className="hidden lg:block">
              <Photo name="terraceLake" locale={locale} aspect="aspect-[4/5]" />
              <figcaption className="mt-3 text-sm text-muted">{imageCaption("terraceLake", locale)}</figcaption>
            </figure>
          </aside>
        </div>
      </Section>
    </>
  );
}
