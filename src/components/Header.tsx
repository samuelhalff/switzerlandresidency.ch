import Link from "next/link";
import { getMessages, locales, t, type Locale } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";
import Button from "./ui/Button";
import Container from "./ui/Container";
import ThemeToggle from "./ui/ThemeToggle";

export function themeLabels(locale: Locale) {
  return {
    label: t(locale, "theme.label"),
    light: t(locale, "theme.light"),
    dark: t(locale, "theme.dark"),
    system: t(locale, "theme.system"),
  };
}

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
  const theme = themeLabels(locale);

  return (
    <header className="sticky top-0 z-40 bg-bg/85 shadow-[0_1px_0_rgb(var(--line)/0.7)] backdrop-blur-md">
      <Container className="flex h-[72px] items-center justify-between gap-4">
        <Link href={localePath(locale)} className="shrink-0 rounded-full" aria-label={`Switzerland Residency — ${t(locale, "nav.home")}`}>
          <Logo />
        </Link>
        <nav aria-label={t(locale, "common.mainNav")} className="hidden lg:block">
          <ul className="flex items-center gap-1 text-[0.95rem] font-medium">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-[40px] items-center rounded-full px-3.5 text-ink/90 transition-colors duration-200 hover:bg-sand hover:text-ink"
                >
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
          <ThemeToggle labels={theme} name="theme-header" className="hidden lg:inline-flex" />
          <Button href={cta.href} size="sm" className="hidden xl:inline-flex">
            {cta.label}
          </Button>
          <MobileMenu
            links={[...links, { href: localePath(locale, "/contact/"), label: t(locale, "nav.contact") }]}
            cta={cta}
            openLabel={t(locale, "common.menuOpen")}
            closeLabel={t(locale, "common.menuClose")}
            navLabel={t(locale, "common.mainNav")}
            themeLabels={theme}
          />
        </div>
      </Container>
      <div className="px-4 pb-2 sm:hidden">
        <LanguageSwitcher current={locale} label={t(locale, "common.language")} languages={languages} />
      </div>
    </header>
  );
}
