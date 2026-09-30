import type { Metadata } from "next";
import "./globals.css";
import { fraunces, inter } from "@/lib/fonts";
import { getMessages, locales } from "@/lib/i18n";
import { themeInitScript } from "@/lib/theme";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "404 | Switzerland Residency",
  robots: { index: false, follow: true },
};

/** Served as /404.html by Apache (ErrorDocument). One page, all three languages. */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <header className="shadow-[0_1px_0_rgb(var(--line)/0.7)]">
          <Container className="flex h-[72px] items-center">
            <a href="/en/" aria-label="Switzerland Residency" className="rounded-full">
              <Logo />
            </a>
          </Container>
        </header>
        <main id="main" className="flex-1 py-16">
          <Container>
            <Eyebrow>404</Eyebrow>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {locales.map((loc, i) => {
                const m = getMessages(loc).notFound;
                const Heading = loc === "en" ? "h1" : "h2";
                return (
                  <Card key={loc} as="section" tone={(["plain", "sand", "sage"] as const)[i]} padding="lg">
                    <div lang={loc}>
                      <Heading className="text-3xl">{m.title}</Heading>
                      <p className="mt-3 text-muted">{m.text}</p>
                      <Button href={`/${loc}/`} native className="mt-6">
                        {m.home}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Container>
        </main>
      </body>
    </html>
  );
}
