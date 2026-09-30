import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import { ARK_URL, GA_ID } from "@/lib/site";
import Logo from "./Logo";
import CookieSettingsButton from "./CookieSettingsButton";
import ContactChannels from "./ContactChannels";
import Container from "./ui/Container";

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
    { href: "/for-advisers/", label: t(locale, "nav.advisers") },
    { href: "/about/", label: t(locale, "nav.about") },
    { href: "/contact/", label: t(locale, "nav.contact") },
  ];
  const legal = [
    { href: "/privacy/", label: t(locale, "nav.privacy") },
    { href: "/legal-notice/", label: t(locale, "nav.legalNotice") },
  ];

  const Column = ({ title, items }: { title: string; items: { href: string; label: string }[] }) => (
    <div>
      <h2 className="font-sans text-[0.95rem] font-medium text-muted">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={localePath(locale, i.href)} className="underline-offset-4 transition-colors hover:text-accent hover:underline">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="relative mt-auto">
      <Container>
        <div className="h-px bg-line" />
      </Container>
      <Container className="grid grid-cols-2 gap-x-6 gap-y-10 pb-14 pt-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-5 max-w-sm text-[0.95rem] text-muted">{t(locale, "footer.blurb")}</p>
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
      </Container>
      <div>
        <Container>
          <div className="flex flex-col gap-2 border-t border-line py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
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
        </Container>
      </div>
    </footer>
  );
}
