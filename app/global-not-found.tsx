import type { Metadata } from "next";
import "./globals.css";
import { fraunces, inter } from "@/lib/fonts";
import { getMessages, locales } from "@/lib/i18n";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "404 | Switzerland Residency",
  robots: { index: false, follow: true },
};

/** Served as /404.html by Apache (ErrorDocument). One page, all three languages. */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-line">
          <div className="container-page flex h-[72px] items-center">
            <a href="/en/" aria-label="Switzerland Residency">
              <Logo />
            </a>
          </div>
        </header>
        <main id="main" className="container-page flex-1 py-16">
          <p className="eyebrow">404</p>
          <div className="mt-6 grid gap-10 md:grid-cols-3">
            {locales.map((loc) => {
              const m = getMessages(loc).notFound;
              const Heading = loc === "en" ? "h1" : "h2";
              return (
                <section key={loc} lang={loc} className="card">
                  <Heading className="text-3xl">{m.title}</Heading>
                  <p className="mt-3 text-muted">{m.text}</p>
                  <a href={`/${loc}/`} className="btn btn-primary mt-6">
                    {m.home}
                  </a>
                </section>
              );
            })}
          </div>
        </main>
      </body>
    </html>
  );
}
