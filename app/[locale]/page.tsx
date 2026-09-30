import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { getPublishedEntries, isPublished } from "@/lib/content";
import { getMessages, t } from "@/lib/i18n";
import type { ImageName } from "@/lib/images";
import { localePath } from "@/lib/paths";
import { pageMetadata } from "@/lib/seo";
import { getLocale, type LocaleParams } from "@/lib/page";
import ImageSlot from "@/components/ImageSlot";
import { OriginGrid, ServiceGrid } from "@/components/Cards";
import EntryCard from "@/components/EntryCard";
import Faq from "@/components/Faq";
import CtaBand from "@/components/CtaBand";
import AccentText from "@/components/ui/AccentText";
import ArchImage from "@/components/ui/ArchImage";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import Icon, { type IconName } from "@/components/ui/Icon";
import IconBadge, { type IconBadgeTone } from "@/components/ui/IconBadge";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import WaveDivider from "@/components/ui/WaveDivider";

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

/** Arch photos for the cantons teaser (canton code, content slug, photo). */
const cantonArches: { code: "GE" | "VS" | "ZG" | "TI"; slug: string; image: ImageName }[] = [
  { code: "GE", slug: "geneva", image: "lakeGeneva" },
  { code: "VS", slug: "valais", image: "mountainMatterhorn" },
  { code: "ZG", slug: "zug", image: "cityZug" },
  { code: "TI", slug: "ticino", image: "lakeLugano" },
];

const stepIcons: IconName[] = ["compass", "document", "house"];
const approachIcons: { icon: IconName; tone: IconBadgeTone }[] = [
  { icon: "heart", tone: "blush" },
  { icon: "chat", tone: "sage" },
  { icon: "document", tone: "sand" },
  { icon: "family", tone: "blush" },
];

export default async function HomePage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  const m = getMessages(locale);
  const guides = getPublishedEntries(locale, "guides").slice(0, 3);

  return (
    <>
      {/* Hero: full-bleed photo, warm overlay, headline over it */}
      <section className="on-dark relative isolate flex min-h-[640px] items-end overflow-hidden bg-evening sm:min-h-[700px] lg:min-h-[min(86vh,820px)] lg:items-center">
        <ImageSlot name="hero" locale={locale} position="center 62%" className="absolute inset-0 -z-20" />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(34_24_17/0.25)_0%,rgb(34_24_17/0.35)_40%,rgb(34_24_17/0.86)_100%)] lg:bg-[linear-gradient(95deg,rgb(34_24_17/0.84)_0%,rgb(34_24_17/0.6)_42%,rgb(34_24_17/0.08)_78%)]"
        />
        <Container className="pb-24 pt-32 sm:pb-32 lg:py-32">
          <div className="max-w-2xl" data-reveal="">
            <Eyebrow>{t(locale, "home.hero.eyebrow")}</Eyebrow>
            <h1 className="mt-5 text-[2.7rem] leading-[1.06] sm:text-6xl lg:text-[4.6rem]">
              <AccentText text={t(locale, "home.hero.title")} accent={t(locale, "home.hero.accent")} />
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">{t(locale, "home.hero.subtitle")}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href={localePath(locale, "/eligibility-check/")} size="lg">
                {t(locale, "home.hero.primary")}
              </Button>
              <Button href={localePath(locale, "/contact/")} variant="secondary" size="lg">
                {t(locale, "home.hero.secondary")}
              </Button>
            </div>
            <p className="mt-7 flex items-start gap-2.5 text-[0.95rem] text-muted">
              <Icon name="check" size={20} className="mt-0.5 shrink-0 text-[rgb(var(--em))]" />
              {t(locale, "home.hero.reassurance")}
            </p>
          </div>
        </Container>
        <WaveDivider className="pointer-events-none absolute inset-x-0 bottom-0 text-bg" />
      </section>

      {/* Friendly intro: our approach */}
      <Section spacing="lg">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <ArchImage name="familyLife" locale={locale} aspect="4/5" frame="sage" className="mx-auto w-full max-w-[420px] lg:mx-0" />
          <div>
            <SectionHeading
              eyebrow={t(locale, "home.approach.eyebrow")}
              title={t(locale, "home.approach.title")}
              accent={t(locale, "home.approach.accent")}
              lead={t(locale, "home.approach.intro")}
            />
            <ul className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {m.home.approach.items.map((item, i) => (
                <li key={item.title} className="flex gap-4" data-reveal="">
                  <IconBadge icon={approachIcons[i % approachIcons.length].icon} tone={approachIcons[i % approachIcons.length].tone} />
                  <div>
                    <h3 className="text-xl">{item.title}</h3>
                    <p className="mt-1.5 text-[0.98rem] text-muted">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Three steps */}
      <Section tone="sand" divider="top" spacing="lg">
        <SectionHeading
          eyebrow={t(locale, "home.steps.eyebrow")}
          title={t(locale, "home.steps.title")}
          accent={t(locale, "home.steps.accent")}
          lead={t(locale, "home.steps.intro")}
        />
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {m.home.steps.items.map((s, i) => (
            <Card as="li" key={s.title} tone="plain" padding="lg" reveal={i}>
              <div className="flex items-center justify-between">
                <span aria-hidden="true" className="accent-em font-serif text-6xl leading-none">
                  {i + 1}
                </span>
                <IconBadge icon={stepIcons[i % stepIcons.length]} tone={i === 1 ? "sage" : "blush"} />
              </div>
              <h3 className="mt-6 text-2xl">{s.title}</h3>
              <p className="mt-2.5 text-muted">{s.text}</p>
            </Card>
          ))}
        </ol>
        <div className="mt-10" data-reveal="">
          <Button href={localePath(locale, "/how-it-works/")} variant="link-arrow">
            {t(locale, "home.steps.cta")}
          </Button>
        </div>
      </Section>

      {/* Services */}
      <Section divider="top" spacing="lg">
        <SectionHeading
          eyebrow={t(locale, "home.services.eyebrow")}
          title={t(locale, "home.services.title")}
          accent={t(locale, "home.services.accent")}
          lead={t(locale, "home.services.intro")}
        />
        <div className="mt-12">
          <ServiceGrid locale={locale} />
        </div>
      </Section>

      {/* Moving from */}
      <Section tone="sage" divider="top" spacing="lg">
        <SectionHeading eyebrow={t(locale, "home.origins.eyebrow")} title={t(locale, "home.origins.title")} lead={t(locale, "home.origins.intro")} />
        <div className="mt-12">
          <OriginGrid locale={locale} compact />
        </div>
      </Section>

      {/* Cantons teaser */}
      <Section divider="top" spacing="lg">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow={t(locale, "home.cantons.eyebrow")}
              title={t(locale, "home.cantons.title")}
              accent={t(locale, "home.cantons.accent")}
              lead={t(locale, "home.cantons.intro")}
            />
            <ul className="mt-8 flex flex-wrap gap-2.5" data-reveal="">
              {teaserCantons.map((c) => (
                <li key={c}>
                  <Chip icon="pin">{m.cantonNames[c]}</Chip>
                </li>
              ))}
            </ul>
            <div className="mt-9" data-reveal="">
              <Button href={localePath(locale, "/cantons/")} variant="secondary">
                {t(locale, "home.cantons.cta")}
              </Button>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-x-5">
            {cantonArches.map((c, i) => {
              const linked = isPublished(locale, "cantons", c.slug);
              const inner = (
                <>
                  <ArchImage name={c.image} locale={locale} decorative aspect="2/3" reveal={false} />
                  <span className="mt-3 flex items-center justify-center gap-1.5 text-center font-serif text-lg transition-colors group-hover:text-accent">
                    {m.cantonNames[c.code]}
                  </span>
                </>
              );
              return (
                <li key={c.code} data-reveal="" style={{ "--reveal-delay": `${i * 80}ms` } as CSSProperties} className={i % 2 ? "sm:mt-10" : ""}>
                  {linked ? (
                    <Link href={localePath(locale, `/cantons/${c.slug}/`)} className="group block rounded-[1.5rem]">
                      {inner}
                    </Link>
                  ) : (
                    <div className="group">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Section>

      {/* Latest guides */}
      {guides.length ? (
        <Section tone="blush" divider="top" spacing="lg">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow={t(locale, "home.guides.eyebrow")}
              title={t(locale, "home.guides.title")}
              accent={t(locale, "home.guides.accent")}
              lead={t(locale, "home.guides.intro")}
            />
            <Button href={localePath(locale, "/guides/")} variant="link-arrow" className="mb-1">
              {t(locale, "home.guides.cta")}
            </Button>
          </div>
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {guides.map((g, i) => (
              <EntryCard key={g.slug} entry={g} locale={locale} as="li" index={i} />
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Evening band: a person, not a form */}
      <CtaBand
        locale={locale}
        eyebrow={t(locale, "home.evening.eyebrow")}
        title={t(locale, "home.evening.title")}
        accent={t(locale, "home.evening.accent")}
        text={t(locale, "home.evening.text")}
      />

      {/* FAQ */}
      <Section divider="top" spacing="lg" container="narrow">
        <Faq
          eyebrow={t(locale, "home.faq.eyebrow")}
          title={t(locale, "home.faq.title")}
          accent={t(locale, "home.faq.accent")}
          items={m.home.faq.items}
        />
      </Section>
    </>
  );
}
