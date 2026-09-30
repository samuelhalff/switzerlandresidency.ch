import { getMessages, t } from "@/lib/i18n";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import CtaBand from "@/components/CtaBand";
import ArchImage from "@/components/ui/ArchImage";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";

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
      <Section spacing="md" className="pb-24 sm:pb-28">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-20">
          <ol className="relative space-y-5 before:absolute before:bottom-8 before:left-[1.6rem] before:top-8 before:w-px before:bg-line sm:before:left-[2.1rem]">
            {steps.map((s, i) => (
              <Card as="li" key={s.title} tone={i % 2 ? "sand" : "plain"} reveal className="pl-14 sm:pl-[4.5rem]">
                <span
                  aria-hidden="true"
                  className="absolute left-4 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-blush font-serif text-xl italic text-accent sm:left-5 sm:top-7 sm:h-12 sm:w-12 sm:text-2xl"
                >
                  {i + 1}
                </span>
                <h2 className="text-2xl">{s.title}</h2>
                <p className="mt-2 text-muted">{s.text}</p>
              </Card>
            ))}
          </ol>
          <div className="space-y-10 lg:sticky lg:top-28 lg:self-start">
            <ArchImage name="lakeLucerne" locale={locale} aspect="4/5" frame="sage" className="mx-auto w-full max-w-[400px]" />
            <Card tone="blush" padding="sm">
              <p className="text-[0.95rem] text-muted">{t(locale, "howItWorks.note")}</p>
            </Card>
          </div>
        </div>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
