import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import "../globals.css";
import { fraunces, inter } from "@/lib/fonts";
import { htmlLang, isLocale, locales, t } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import { GA_ID, NOINDEX, SITE_NAME, SITE_URL } from "@/lib/site";
import { organizationLd, websiteLd } from "@/lib/jsonld";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import AnalyticsBootstrap from "@/components/Analytics";
import CookieBanner from "@/components/CookieBanner";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  robots: NOINDEX ? { index: false, follow: false } : undefined,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f1e8" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1916" },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={htmlLang[locale]} className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        <AnalyticsBootstrap />
        <JsonLd data={[organizationLd(), websiteLd(locale)]} />
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {t(locale, "common.skipToContent")}
        </a>
        <Header locale={locale} />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer locale={locale} />
        {GA_ID ? (
          <CookieBanner
            gaId={GA_ID}
            text={t(locale, "cookies.text")}
            accept={t(locale, "cookies.accept")}
            decline={t(locale, "cookies.decline")}
            more={t(locale, "cookies.more")}
            label={t(locale, "cookies.label")}
            privacyHref={localePath(locale, "/privacy/")}
          />
        ) : null}
      </body>
    </html>
  );
}
