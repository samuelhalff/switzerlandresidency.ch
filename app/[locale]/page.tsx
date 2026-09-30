import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedEntries } from "@/lib/content";
import { getMessages, t } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import { pageMetadata } from "@/lib/seo";
import { getLocale, type LocaleParams } from "@/lib/page";
import ImageSlot from "@/components/ImageSlot";
import { OriginGrid, ServiceGrid } from "@/components/Cards";
import EntryCard from "@/components/EntryCard";
import Faq from "@/components/Faq";
import CtaBand from "@/components/CtaBand";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await getLocale(params);
  return pageMetadata({
    locale,
    path: "/",
    title: t(locale, "meta.homeTitle"),
    description: t(locale, "meta.homeDescription"),
    absoluteTitle: true,
  });
}

const teaserCantons = ["GE", "VD", "VS", "ZG", "GR", "TI"] as const;

export default async function HomePage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  const m = getMessages(locale);
  const guides = getPublishedEntries(locale, "guides").slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div>
          <p className="eyebrow">{t(locale, "home.hero.eyebrow")}</p>
          <h1 className="h1 mt-4">{t(locale, "home.hero.title")}</h1>
          <p className="lead mt-6 max-w-xl">{t(locale, "home.hero.subtitle")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={localePath(locale, "/eligibility-check/")} className="btn btn-primary">
              {t(locale, "home.hero.primary")}
            </Link>
            <Link href={localePath(locale, "/contact/")} className="btn btn-secondary">
              {t(locale, "home.hero.secondary")}
            </Link>
          </div>
        </div>
        <ImageSlot name="hero" locale={locale} className="aspect-[16/11] w-full rounded-[28px] shadow-xl lg:aspect-[4/5]" />
      </section>

      {/* How it works */}
      <section className="section bg-sand/60">
        <div className="container-page">
          <h2 className="h2">{t(locale, "home.steps.title")}</h2>
          <p className="lead mt-3 max-w-2xl">{t(locale, "home.steps.intro")}</p>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {m.home.steps.items.map((s, i) => (
              <li key={s.title} className="card">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-serif text-lg text-white" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-xl">{s.title}</h3>
                <p className="mt-2 text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
          <Link href={localePath(locale, "/how-it-works/")} className="link mt-8 inline-block font-medium">
            {t(locale, "home.steps.cta")}
          </Link>
        </div>
      </section>

      {/* Services */}
      <section className="container-page section">
        <h2 className="h2">{t(locale, "home.services.title")}</h2>
        <p className="lead mt-3 max-w-2xl">{t(locale, "home.services.intro")}</p>
        <div className="mt-10">
          <ServiceGrid locale={locale} />
        </div>
      </section>

      {/* Moving from */}
      <section className="section border-y border-line bg-lake-soft/60">
        <div className="container-page">
          <h2 className="h2">{t(locale, "home.origins.title")}</h2>
          <p className="lead mt-3 max-w-2xl">{t(locale, "home.origins.intro")}</p>
          <div className="mt-10">
            <OriginGrid locale={locale} compact />
          </div>
        </div>
      </section>

      {/* Cantons teaser */}
      <section className="container-page section grid items-center gap-10 lg:grid-cols-2">
        <ImageSlot name="lakeGeneva" locale={locale} className="aspect-[4/3] w-full rounded-card" />
        <div>
          <h2 className="h2">{t(locale, "home.cantons.title")}</h2>
          <p className="lead mt-4">{t(locale, "home.cantons.intro")}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {teaserCantons.map((c) => (
              <li key={c} className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm">
                {m.cantonNames[c]}
              </li>
            ))}
          </ul>
          <Link href={localePath(locale, "/cantons/")} className="btn btn-secondary mt-8">
            {t(locale, "home.cantons.cta")}
          </Link>
        </div>
      </section>

      {/* Approach */}
      <section className="section bg-sand/60">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="h2">{t(locale, "home.approach.title")}</h2>
            <p className="lead mt-4">{t(locale, "home.approach.intro")}</p>
            <ImageSlot name="mountainAlps" locale={locale} className="mt-8 hidden aspect-[4/3] rounded-card lg:block" />
          </div>
          <ul className="grid gap-5 sm:grid-cols-2">
            {m.home.approach.items.map((item) => (
              <li key={item.title} className="card">
                <h3 className="text-xl">{item.title}</h3>
                <p className="mt-2 text-muted">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Latest guides */}
      {guides.length ? (
        <section className="container-page section">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="h2">{t(locale, "home.guides.title")}</h2>
              <p className="lead mt-3 max-w-2xl">{t(locale, "home.guides.intro")}</p>
            </div>
            <Link href={localePath(locale, "/guides/")} className="link font-medium">
              {t(locale, "home.guides.cta")}
            </Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {guides.map((g) => (
              <EntryCard key={g.slug} entry={g} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      <section className="container-page section max-w-4xl">
        <Faq title={t(locale, "home.faq.title")} items={m.home.faq.items} />
      </section>

      <CtaBand locale={locale} />
    </>
  );
}
