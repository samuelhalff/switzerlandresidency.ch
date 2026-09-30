import type { Entry } from "./content";
import { type Locale } from "./i18n";
import { absoluteUrl, localePath } from "./paths";
import { ARK_URL, SITE_NAME, SITE_URL } from "./site";

const ORG_ID = `${SITE_URL}/#org`;
const SITE_ID = `${SITE_URL}/#website`;

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    areaServed: "CH",
    knowsLanguage: ["en", "fr", "de"],
    parentOrganization: {
      "@type": "Organization",
      name: "Ark Fiduciaire SA",
      url: ARK_URL,
      address: { "@type": "PostalAddress", addressLocality: "Geneva", addressCountry: "CH" },
    },
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

export function serviceLd(entry: Entry, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: entry.title,
    description: entry.description,
    url,
    serviceType: entry.category || entry.title,
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "Switzerland" },
    audience: {
      "@type": "Audience",
      audienceType: "Private individuals and families relocating to Switzerland",
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
