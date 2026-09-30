import Link from "next/link";
import { getMessages, locales, t, type Locale } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";

export default function Header({ locale }: { locale: Locale }) {
  const links = [
    { href: localePath(locale, "/services/"), label: t(locale, "nav.services") },
    { href: localePath(locale, "/cantons/"), label: t(locale, "nav.cantons") },
    { href: localePath(locale, "/moving-from/"), label: t(locale, "nav.movingFrom") },
    { href: localePath(locale, "/guides/"), label: t(locale, "nav.guides") },
    { href: localePath(locale, "/about/"), label: t(locale, "nav.about") },
  ];
  const cta = { href: localePath(locale, "/eligibility-check/"), label: t(locale, "common.ctaCheck") };
  const languages = locales.map((code) => ({ code, name: getMessages(locale).languages[code] }));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Link href={localePath(locale)} className="shrink-0 rounded-md" aria-label={`Switzerland Residency — ${t(locale, "nav.home")}`}>
          <Logo />
        </Link>
        <nav aria-label={t(locale, "common.mainNav")} className="hidden lg:block">
          <ul className="flex items-center gap-6 text-[0.95rem] font-medium">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink/90 underline-offset-8 hover:text-accent hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher current={locale} label={t(locale, "common.language")} languages={languages} />
          </div>
          <Link href={cta.href} className="btn btn-primary hidden px-5 py-2 text-sm lg:inline-flex">
            {cta.label}
          </Link>
          <MobileMenu
            links={[...links, { href: localePath(locale, "/contact/"), label: t(locale, "nav.contact") }]}
            cta={cta}
            openLabel={t(locale, "common.menuOpen")}
            closeLabel={t(locale, "common.menuClose")}
            navLabel={t(locale, "common.mainNav")}
          />
        </div>
      </div>
      <div className="border-t border-line px-4 py-1 sm:hidden">
        <LanguageSwitcher current={locale} label={t(locale, "common.language")} languages={languages} />
      </div>
    </header>
  );
}
