import { getMessages, t } from "@/lib/i18n";
import { imageCaption } from "@/lib/images";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import CtaBand from "@/components/CtaBand";
import Photo from "@/components/ui/Photo";
import Section from "@/components/ui/Section";
import Timeline from "@/components/ui/Timeline";

export const generateMetadata = staticMetadata("/how-it-works/", "howItWorks.title", "howItWorks.description");

export default async function HowItWorksPage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  const steps = getMessages(locale).howItWorks.steps;
  return (
    <>
      <PageHeader
        locale={locale}
        title={t(locale, "howItWorks.title")}
        intro={t(locale, "howItWorks.intro")}
        crumbs={[{ label: t(locale, "nav.howItWorks"), path: "/how-it-works/" }]}
      />
      <Section spacing="sm" className="pb-24">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-20">
          <Timeline items={steps} headingLevel="h2" />
          <div className="space-y-8 lg:sticky lg:top-28 lg:self-start">
            <figure data-reveal="">
              <Photo name="lakesideWalk" locale={locale} aspect="aspect-[4/5]" />
              <figcaption className="mt-3 text-sm text-muted">{imageCaption("lakesideWalk", locale)}</figcaption>
            </figure>
            <p className="border-l-2 border-accent pl-4 text-[0.95rem] text-muted">{t(locale, "howItWorks.note")}</p>
          </div>
        </div>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
