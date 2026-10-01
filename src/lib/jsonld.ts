import type { Entry } from "./content";
import { type Locale } from "./i18n";
import { absoluteUrl, localePath } from "./paths";
import { SITE_NAME, SITE_URL } from "./site";

const ORG_ID = `${SITE_URL}/#org`;
const SITE_ID = `${SITE_URL}/#website`;

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description:
      "Relocation services in Switzerland for private clients and families: residence permits, lump-sum taxation, tax rulings, property search, destination services and settling in.",
    knowsAbout: [
      "Relocation services",
      "Destination services",
      "Relocation to Switzerland",
      "Swiss residence permits",
      "Lump-sum taxation (forfait fiscal, Pauschalbesteuerung)",
      "Swiss tax rulings",
      "Lex Koller",
    ],
    areaServed: "CH",
    knowsLanguage: ["en", "fr", "de"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "French", "German"],
    },
  };
}

export function websiteLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: SITE_NAME,
    url: absoluteUrl(localePath(locale, "/")),
    inLanguage: locale,
    publisher: { "@id": ORG_ID },
  };
}

export type Crumb = { name: string; path: string };

/** Crumbs carry locale-prefixed paths. */
export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

/** `serviceType` is the market term for the service (i18n services.items.<slug>.serviceType). */
export function serviceLd(entry: Entry, url: string, serviceType?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: entry.title,
    description: entry.description,
    url,
    inLanguage: entry.locale,
    serviceType: serviceType || entry.title,
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "Switzerland" },
    audience: {
      "@type": "Audience",
      audienceType: "Private individuals and families relocating to Switzerland",
    },
  };
}

/** The /for-advisers/ hub: the relocation service as offered to introducers. */
export function adviserServiceLd(name: string, description: string, url: string, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url,
    inLanguage: locale,
    serviceType: "Relocation services for private clients introduced by advisers",
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "Switzerland" },
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Private bankers, wealth managers, lawyers, tax advisers, family offices and relocation partners",
    },
  };
}

export function articleLd(entry: Entry, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    description: entry.description,
    inLanguage: entry.locale,
    mainEntityOfPage: url,
    datePublished: entry.published || entry.updated,
    dateModified: entry.updated,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    ...(entry.sources.length ? { citation: entry.sources.map((s) => s.url) } : {}),
    ...(entry.keywords
      ? {
          keywords: [entry.keywords.primary, ...entry.keywords.secondary].join(", "),
          about: { "@type": "Thing", name: entry.keywords.primary },
        }
      : {}),
  };
}

export function faqLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function webApplicationLd(name: string, description: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    provider: { "@id": ORG_ID },
  };
}
