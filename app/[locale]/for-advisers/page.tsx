import { getPublishedEntries } from "@/lib/content";
import { getMessages, t } from "@/lib/i18n";
import { adviserServiceLd } from "@/lib/jsonld";
import { absoluteUrl, localePath } from "@/lib/paths";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import AdviserForm from "@/components/AdviserForm";
import JsonLd from "@/components/JsonLd";
import { adviserFormProps } from "@/components/form/props";
import Button from "@/components/ui/Button";
import { HairlineList, HairlineRow } from "@/components/ui/HairlineList";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import Timeline from "@/components/ui/Timeline";

export const generateMetadata = staticMetadata("/for-advisers/", "advisers.metaTitle", "advisers.description");

/** Hub for private bankers, lawyers, tax advisers and other introducers: scope, discretion, briefings, form. */
export default async function ForAdvisersPage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  const a = getMessages(locale).advisers;
  const briefings = getPublishedEntries(locale, "advisers");
  const url = absoluteUrl(localePath(locale, "/for-advisers/"));

  return (
    <>
      <PageHeader
        locale={locale}
        title={a.title}
        accent={a.accent}
        intro={a.intro}
        image="lakeGeneva"
        crumbs={[{ label: t(locale, "nav.advisers"), path: "/for-advisers/" }]}
      >
        <div className="mt-8">
          <Button href="#introduce" size="lg">
            {a.ctaIntroduce}
          </Button>
        </div>
      </PageHeader>

      <Section spacing="lg">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
          <SectionHeading title={a.steps.title} accent={a.steps.accent} />
          <Timeline items={a.steps.items} />
        </div>
      </Section>

      <Section spacing="md" hairline>
        <SectionHeading title={a.scope.title} />
        <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-16">
          {[
            { title: a.scope.oursTitle, items: a.scope.ours },
            { title: a.scope.yoursTitle, items: a.scope.yours },
          ].map((col) => (
            <div key={col.title} className="border-t border-ink pt-6" data-reveal="">
              <h3 className="text-[1.5rem] leading-snug sm:text-[1.75rem]">{col.title}</h3>
              <ul className="mt-5 space-y-3">
                {col.items.map((item) => (
                  <li key={item} className="flex gap-3 text-[1.02rem]">
                    <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section spacing="md">
        <SectionHeading title={a.discretion.title} />
        <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-3">
          {a.discretion.items.map((item) => (
            <li key={item.title} className="border-t border-line pt-6" data-reveal="">
              <h3 className="text-[1.35rem] leading-snug">{item.title}</h3>
              <p className="mt-2 text-[0.98rem] text-muted">{item.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      {briefings.length ? (
        <Section spacing="md" hairline>
          <SectionHeading title={a.briefings.title} lead={a.briefings.lead} />
          <HairlineList className="mt-12">
            {briefings.map((e) => (
              <HairlineRow key={e.slug} size="md" title={e.title} text={e.description} href={localePath(locale, `/for-advisers/${e.slug}/`)} />
            ))}
          </HairlineList>
        </Section>
      ) : null}

      <Section id="introduce" spacing="lg" hairline className="scroll-mt-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-16">
          <SectionHeading title={a.form.title} accent={a.form.accent} lead={a.form.lead} className="lg:sticky lg:top-28 lg:self-start" />
          <AdviserForm {...adviserFormProps(locale)} />
        </div>
      </Section>

      <JsonLd data={adviserServiceLd(a.metaTitle, a.description, url, locale)} />
    </>
  );
}
