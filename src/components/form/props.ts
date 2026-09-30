import { getMessages, locales, type Locale } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import { FORMSPARK_ID, whatsappUrl } from "@/lib/site";
import type { AdviserFormProps } from "../AdviserForm";
import type { ContactFormProps } from "../ContactForm";

/** Server-side props for the client contact form. */
export function contactFormProps(locale: Locale): ContactFormProps {
  const m = getMessages(locale);
  return {
    labels: m.contact.form,
    extra: m.contactExtra,
    locale,
    formsparkId: FORMSPARK_ID,
    whatsappHref: whatsappUrl,
    privacyHref: localePath(locale, "/privacy/"),
    languages: locales.map((code) => ({ code, name: m.languages[code] })),
  };
}

/** Server-side props for the "Introduce a client" adviser form. */
export function adviserFormProps(locale: Locale): AdviserFormProps {
  const m = getMessages(locale);
  return {
    labels: m.contact.form,
    adviser: m.advisers.form,
    timingOptions: m.contactExtra.timingOptions,
    locale,
    formsparkId: FORMSPARK_ID,
    whatsappHref: whatsappUrl,
    privacyHref: localePath(locale, "/privacy/"),
  };
}
