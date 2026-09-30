"use client";

import { useEffect, useRef, useState } from "react";
import Button from "./ui/Button";
import ThemeToggle from "./ui/ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

type Props = {
  links: { href: string; label: string }[];
  cta: { href: string; label: string };
  openLabel: string;
  closeLabel: string;
  navLabel: string;
  themeLabels: { label: string; light: string; dark: string; system: string };
  languageLabel: string;
  languages: { code: string; name: string }[];
  current: string;
};

export default function MobileMenu({ links, cta, openLabel, closeLabel, navLabel, themeLabels, languageLabel, languages, current }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep the header solid while the panel is open (it is transparent over the home hero).
    document.querySelector(".site-header")?.toggleAttribute("data-menu-open", open);
    if (!open) return;
    const main = document.getElementById("main");
    const footer = document.querySelector("footer");
    main?.setAttribute("inert", "");
    footer?.setAttribute("inert", "");
    const getFocusable = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('a[href], button, input, [tabindex]:not([tabindex="-1"])') ?? [],
      );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      // Trap Tab/Shift+Tab inside the panel while the rest of the page is inert.
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    // Focus the panel itself (no visible ring on touch devices); Tab then enters the links.
    panelRef.current?.focus({ preventScroll: true });
    document.body.style.overflow = "hidden";
    document.body.dataset.menuOpen = "true"; // hides the cookie banner while the menu covers the page
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      delete document.body.dataset.menuOpen;
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
    };
  }, [open]);

  useEffect(() => {
    // Panel is mobile/tablet-only: if the viewport crosses to lg while open, close it.
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink shadow-[inset_0_0_0_1px_rgb(var(--line))]"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label={navLabel}
        tabIndex={-1}
        className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto bg-bg px-4 pb-10 pt-2 text-ink outline-none"
      >
        <nav aria-label={navLabel}>
          <ul className="flex flex-col border-t border-line">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="flex items-center justify-between border-b border-line py-3 font-serif text-[1.25rem] font-light text-ink transition-colors active:text-accent focus-visible:text-accent focus-visible:outline-none"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <Button href={cta.href} native size="lg" className="mt-6" onClick={() => setOpen(false)}>
            {cta.label}
          </Button>
        </nav>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <LanguageSwitcher current={current} label={languageLabel} languages={languages} />
          <ThemeToggle labels={themeLabels} variant="full" name="theme-mobile" className="sm:w-auto" />
        </div>
      </div>
    </div>
  );
}
