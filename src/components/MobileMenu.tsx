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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

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
        className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto bg-bg px-4 pb-10 pt-4 text-ink"
      >
        <nav aria-label={navLabel}>
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="block border-b border-line py-4 font-serif text-[1.7rem] font-light text-ink"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <Button href={cta.href} native size="lg" className="mt-8" onClick={() => setOpen(false)}>
            {cta.label}
          </Button>
        </nav>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <LanguageSwitcher current={current} label={languageLabel} languages={languages} />
          <ThemeToggle labels={themeLabels} variant="full" name="theme-mobile" className="sm:w-auto" />
        </div>
      </div>
    </div>
  );
}
