import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import { ARK_URL, GA_ID } from "@/lib/site";
import Logo from "./Logo";
import CookieSettingsButton from "./CookieSettingsButton";
import ContactChannels from "./ContactChannels";

export default function Footer({ locale }: { locale: Locale }) {
  const year = new Date().getFullYear();
  const explore = [
    { href: "/how-it-works/", label: t(locale, "nav.howItWorks") },
    { href: "/services/", label: t(locale, "nav.services") },
    { href: "/cantons/", label: t(locale, "nav.cantons") },
    { href: "/moving-from/", label: t(locale, "nav.movingFrom") },
    { href: "/guides/", label: t(locale, "nav.guides") },
  ];
  const company = [
    { href: "/eligibility-check/", label: t(locale, "nav.eligibility") },
    { href: "/about/", label: t(locale, "nav.about") },
    { href: "/contact/", label: t(locale, "nav.contact") },
  ];
  const legal = [
    { href: "/privacy/", label: t(locale, "nav.privacy") },
    { href: "/legal-notice/", label: t(locale, "nav.legalNotice") },
  ];

  const Column = ({ title, items }: { title: string; items: { href: string; label: string }[] }) => (
    <div>
      <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.12em] text-muted">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={localePath(locale, i.href)} className="underline-offset-4 hover:underline">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="mt-auto border-t border-line bg-sand/60">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted">{t(locale, "footer.blurb")}</p>
          <div className="mt-5">
            <ContactChannels locale={locale} compact />
          </div>
        </div>
        <Column title={t(locale, "footer.explore")} items={explore} />
        <Column title={t(locale, "footer.company")} items={company} />
        <div>
          <Column title={t(locale, "footer.legal")} items={legal} />
          {GA_ID ? (
            <div className="mt-2">
              <CookieSettingsButton label={t(locale, "footer.cookieSettings")} />
            </div>
          ) : null}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t(locale, "footer.arkBefore")}{" "}
            <a href={ARK_URL} rel="noopener" className="underline underline-offset-4 hover:text-ink">
              {t(locale, "footer.arkName")}
            </a>
          </p>
          <p>
            © {year} Switzerland Residency. {t(locale, "footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
