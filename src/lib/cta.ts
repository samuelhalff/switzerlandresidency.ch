import type { Collection } from "./content";
import { t, type Locale } from "./i18n";
import { localePath } from "./paths";

/** Per-page call to action (frontmatter `cta`). */
export const ctaKinds = ["check", "contact", "adviser"] as const;
export type CtaKind = (typeof ctaKinds)[number];

/** Default when frontmatter has no `cta`: informational guides → check; commercial pages → contact. */
export const defaultCta: Record<Collection, CtaKind> = {
  guides: "check",
  services: "contact",
  cantons: "contact",
  origins: "contact",
  advisers: "adviser",
};

export function isCtaKind(value: unknown): value is CtaKind {
  return typeof value === "string" && (ctaKinds as readonly string[]).includes(value);
}

type Link = { href: string; label: string };
export type CtaContent = {
  /** Sidebar panel on entry pages. */
  aside: { title: string; text: string };
  /** Closing band (CtaBand). */
  band: { title: string; accent?: string; text: string };
  /** One primary button… */
  primary: Link;
  /** …and a secondary text link. */
  secondary: Link;
};

export function ctaContent(kind: CtaKind, locale: Locale): CtaContent {
  const contact = localePath(locale, "/contact/");
  const check = localePath(locale, "/eligibility-check/");
  switch (kind) {
    case "check":
      return {
        aside: { title: t(locale, "article.ctaTitle"), text: t(locale, "article.ctaText") },
        band: { title: t(locale, "checkBand.title"), accent: t(locale, "checkBand.accent"), text: t(locale, "checkBand.text") },
        primary: { href: check, label: t(locale, "common.ctaCheck") },
        secondary: { href: contact, label: t(locale, "article.ctaWrite") },
      };
    case "adviser":
      return {
        aside: { title: t(locale, "advisers.cta.title"), text: t(locale, "advisers.cta.text") },
        band: { title: t(locale, "advisers.cta.title"), accent: t(locale, "advisers.cta.accent"), text: t(locale, "advisers.cta.text") },
        primary: { href: `${localePath(locale, "/for-advisers/")}#introduce`, label: t(locale, "advisers.ctaIntroduce") },
        secondary: { href: check, label: t(locale, "advisers.cta.secondary") },
      };
    default:
      return {
        aside: { title: t(locale, "article.contactTitle"), text: t(locale, "article.contactText") },
        band: { title: t(locale, "home.finalCta.title"), accent: t(locale, "home.finalCta.accent"), text: t(locale, "home.finalCta.text") },
        primary: { href: contact, label: t(locale, "common.ctaConversation") },
        secondary: { href: check, label: t(locale, "common.ctaRoute") },
      };
  }
}
