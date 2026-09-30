import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedEntries, isPublished } from "@/lib/content";
import { getMessages, t } from "@/lib/i18n";
import { homeImages, type ImageName } from "@/lib/images";
import { localePath } from "@/lib/paths";
import { pageMetadata } from "@/lib/seo";
import { getLocale, type LocaleParams } from "@/lib/page";
import ImageSlot from "@/components/ImageSlot";
import { OriginGrid, ServiceGrid } from "@/components/Cards";
import EntryCard from "@/components/EntryCard";
import Faq from "@/components/Faq";
import CtaBand from "@/components/CtaBand";
import AccentText from "@/components/ui/AccentText";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import FullBleedImage from "@/components/ui/FullBleedImage";
import ImagePair from "@/components/ui/ImagePair";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import Tile from "@/components/ui/Tile";
import Timeline from "@/components/ui/Timeline";

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

/** Canton tiles (canton code, content slug, photo). */
const cantonTiles: { code: "GE" | "VS" | "ZG" | "TI"; slug: string; image: ImageName }[] = [
  { code: "GE", slug: "geneva", image: "lakeGeneva" },
  { code: "VS", slug: "valais", image: "mountainMatterhorn" },
  { code: "ZG", slug: "zug", image: "lakesideWalk" },
  { code: "TI", slug: "ticino", image: "lakeLugano" },
];

/** The four stacked words of the statement link to the matching service. */
const statementLinks = ["residence-permit", "lump-sum-taxation", "property-search-purchase", "settling-in"];

export default async function HomePage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  const m = getMessages(locale);
  const guides = getPublishedEntries(locale, "guides").slice(0, 3);
  const words = t(locale, "home.hero.eyebrow")
    .split("·")
    .map((w) => w.trim())
    .filter(Boolean);

  return (
    <>
      {/* Hero: full-bleed photograph, light serif headline bottom-left, one primary action */}
      <section
        data-hero-overlay=""
        className="on-dark relative isolate -mt-[72px] flex min-h-[640px] items-end overflow-hidden bg-[#3a2e25] sm:min-h-[720px] lg:h-[100svh] lg:max-h-[960px]"
      >
        <ImageSlot name={homeImages.hero} locale={locale} position="center 58%" className="img-graded absolute inset-0 -z-20" />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(30_22_16/0.4)_0%,rgb(30_22_16/0.05)_20%,rgb(30_22_16/0.55)_55%,rgb(30_22_16/0.85)_100%)] sm:bg-[linear-gradient(180deg,rgb(30_22_16/0.35)_0%,rgb(30_22_16/0)_22%,rgb(30_22_16/0)_45%,rgb(30_22_16/0.72)_100%)]"
        />
        <Container className="pb-14 pt-40 sm:pb-20">
          <div className="max-w-3xl" data-reveal="">
            <h1 className="font-light-display text-[2.6rem] leading-[1.04] sm:text-6xl lg:text-[4.5rem]">
              <AccentText text={t(locale, "home.hero.headline")} accent={t(locale, "home.hero.headlineAccent")} />
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{t(locale, "home.hero.lead")}</p>
            <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8">
              <Button href={localePath(locale, "/contact/")} size="lg">
                {t(locale, "common.ctaConversation")}
              </Button>
              <Button href={localePath(locale, "/eligibility-check/")} variant="link" arrow>
                {t(locale, "common.ctaRoute")}
              </Button>
            </div>
            <p className="mt-10 text-sm text-muted">{t(locale, "home.hero.credibility")}</p>
          </div>
        </Container>
      </section>

      {/* Statement: large light serif words against a quiet paragraph */}
      <Section spacing="lg">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-20">
          <ul aria-label={t(locale, "home.services.title")} className="font-serif">
            {words.map((w, i) => {
              const slug = statementLinks[i];
              const href = slug && isPublished(locale, "services", slug) ? localePath(locale, `/services/${slug}/`) : undefined;
              const cls =
                "font-light-display block text-[3.4rem] leading-[1.02] tracking-[-0.03em] sm:text-[5.5rem] lg:text-[7rem]";
              return (
                <li key={w} data-reveal="">
                  {href ? (
                    <Link href={href} className={`${cls} transition-colors hover:italic hover:text-accent`}>
                      {w}
                    </Link>
                  ) : (
                    <span className={cls}>{w}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="max-w-md" data-reveal="">
            <p className="text-lg leading-relaxed">{t(locale, "home.hero.subtitle")}</p>
            <p className="mt-5 text-muted">{t(locale, "home.approach.intro")}</p>
          </div>
        </div>
      </Section>

      <FullBleedImage name={homeImages.breakOne} locale={locale} position="center 55%" />

      {/* Services as hairline rows */}
      <Section spacing="lg">
        <SectionHeading title={t(locale, "home.services.title")} accent={t(locale, "home.services.accent")} lead={t(locale, "home.services.intro")} />
        <div className="mt-14">
          <ServiceGrid locale={locale} />
        </div>
      </Section>

      {/* Approach: principles as quiet text + asymmetric image pair */}
      <Section spacing="md">
        <SectionHeading title={t(locale, "home.approach.title")} accent={t(locale, "home.approach.accent")} />
        <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {m.home.approach.items.map((item) => (
            <li key={item.title} className="border-t border-line pt-6" data-reveal="">
              <h3 className="text-[1.35rem] leading-snug">{item.title}</h3>
              <p className="mt-2 text-[0.98rem] text-muted">{item.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-20">
          <ImagePair wide={homeImages.pairWide} tall={homeImages.pairTall} locale={locale} />
        </div>
      </Section>

      {/* How it works: quiet timeline */}
      <Section spacing="lg">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
          <SectionHeading title={t(locale, "home.steps.title")} accent={t(locale, "home.steps.accent")} lead={t(locale, "home.steps.intro")}>
            <Button href={localePath(locale, "/how-it-works/")} variant="link" arrow>
              {t(locale, "home.steps.cta")}
            </Button>
          </SectionHeading>
          <Timeline items={m.home.steps.items} />
        </div>
      </Section>

      {/* Moving from: hairline rows */}
      <Section spacing="md">
        <SectionHeading title={t(locale, "home.origins.title")} lead={t(locale, "home.origins.intro")} />
        <div className="mt-14">
          <OriginGrid locale={locale} size="md" />
        </div>
      </Section>

      {/* Cantons: photo-led tiles */}
      <Section spacing="lg">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading title={t(locale, "home.cantons.title")} accent={t(locale, "home.cantons.accent")} lead={t(locale, "home.cantons.intro")} />
          <Button href={localePath(locale, "/cantons/")} variant="link" arrow className="mb-1">
            {t(locale, "home.cantons.cta")}
          </Button>
        </div>
        <ul className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-8">
          {cantonTiles.map((c, i) => (
            <Tile
              key={c.code}
              index={i}
              image={c.image}
              aspect="aspect-[3/4]"
              title={m.cantonNames[c.code]}
              href={isPublished(locale, "cantons", c.slug) ? localePath(locale, `/cantons/${c.slug}/`) : undefined}
            />
          ))}
        </ul>
      </Section>

      <FullBleedImage name={homeImages.breakTwo} locale={locale} position="center 45%" />

      {/* Latest guides: photo-led tiles */}
      {guides.length ? (
        <Section spacing="lg">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading title={t(locale, "home.guides.title")} accent={t(locale, "home.guides.accent")} lead={t(locale, "home.guides.intro")} />
            <Button href={localePath(locale, "/guides/")} variant="link" arrow className="mb-1">
              {t(locale, "home.guides.cta")}
            </Button>
          </div>
          <ul className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-3">
            {guides.map((g, i) => (
              <EntryCard key={g.slug} entry={g} locale={locale} index={i} aspect="aspect-[4/3] sm:aspect-[4/5]" />
            ))}
          </ul>
        </Section>
      ) : null}

      {/* FAQ */}
      <Section spacing="md" container="narrow">
        <Faq title={t(locale, "home.faq.title")} accent={t(locale, "home.faq.accent")} items={m.home.faq.items} />
      </Section>

      {/* Closing: a person, not a form */}
      <CtaBand
        locale={locale}
        title={t(locale, "home.evening.title")}
        accent={t(locale, "home.evening.accent")}
        text={t(locale, "home.evening.text")}
      />
    </>
  );
}
