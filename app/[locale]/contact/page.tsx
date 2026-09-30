import { getMessages, locales, t } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import { CONTACT_EMAIL, FORMSPARK_ID } from "@/lib/site";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import ContactForm from "@/components/ContactForm";
import ContactChannels from "@/components/ContactChannels";
import ImageSlot from "@/components/ImageSlot";

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
      <section className="container-page section grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div id="form">
          <ContactForm
            labels={m.contact.form}
            locale={locale}
            formsparkId={FORMSPARK_ID}
            email={CONTACT_EMAIL}
            privacyHref={localePath(locale, "/privacy/")}
            languages={locales.map((code) => ({ code, name: m.languages[code] }))}
          />
        </div>
        <aside>
          <h2 className="text-2xl">{t(locale, "contact.channelsTitle")}</h2>
          <div className="mt-5">
            <ContactChannels locale={locale} />
          </div>
          <ImageSlot name="cityGeneva" locale={locale} className="mt-10 hidden aspect-[4/3] rounded-card lg:block" />
        </aside>
      </section>
    </>
  );
}
