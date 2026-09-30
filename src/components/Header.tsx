import Link from "next/link";
import { getMessages, locales, t, type Locale } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";
import HeaderScroll from "./HeaderScroll";
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

/** Sticky header; transparent over a full-bleed hero (pages that render [data-hero-overlay]), ivory once scrolled. */
export default function Header({ locale }: { locale: Locale }) {
  const links = [
    { href: localePath(locale, "/services/"), label: t(locale, "nav.services") },
    { href: localePath(locale, "/cantons/"), label: t(locale, "nav.cantons") },
    { href: localePath(locale, "/moving-from/"), label: t(locale, "nav.movingFrom") },
    { href: localePath(locale, "/guides/"), label: t(locale, "nav.guides") },
    { href: localePath(locale, "/for-advisers/"), label: t(locale, "nav.advisers") },
    { href: localePath(locale, "/about/"), label: t(locale, "nav.about") },
  ];
  const contact = { href: localePath(locale, "/contact/"), label: t(locale, "common.ctaConversation") };
  const check = { href: localePath(locale, "/eligibility-check/"), label: t(locale, "nav.eligibility") };
  const languages = locales.map((code) => ({ code, name: getMessages(locale).languages[code] }));
  const theme = themeLabels(locale);

  return (
    <header className="site-header sticky top-0 z-40 text-ink">
      <HeaderScroll />
      <Container className="flex h-[72px] items-center justify-between gap-4">
        <Link href={localePath(locale)} className="shrink-0 rounded-soft" aria-label={`Switzerland Residency — ${t(locale, "nav.home")}`}>
          <Logo />
        </Link>
        <nav aria-label={t(locale, "common.mainNav")} className="hidden lg:block">
          <ul className="flex items-center gap-7 text-[0.95rem]">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="underline-offset-[6px] transition-colors hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:block">
            <LanguageSwitcher current={locale} label={t(locale, "common.language")} languages={languages} />
          </div>
          <ThemeToggle labels={theme} name="theme-header" className="hidden lg:inline-flex" />
          <Button href={contact.href} size="sm" className="hidden xl:inline-flex">
            {t(locale, "common.ctaTalk")}
          </Button>
          <MobileMenu
            links={[...links, check, { href: localePath(locale, "/contact/"), label: t(locale, "nav.contact") }]}
            cta={contact}
            openLabel={t(locale, "common.menuOpen")}
            closeLabel={t(locale, "common.menuClose")}
            navLabel={t(locale, "common.mainNav")}
            themeLabels={theme}
            languageLabel={t(locale, "common.language")}
            languages={languages}
            current={locale}
          />
        </div>
      </Container>
    </header>
  );
}
