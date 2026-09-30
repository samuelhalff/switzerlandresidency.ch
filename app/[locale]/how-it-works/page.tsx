import { getMessages, t } from "@/lib/i18n";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import ImageSlot from "@/components/ImageSlot";
import CtaBand from "@/components/CtaBand";

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
      <section className="container-page section grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <ol className="relative space-y-8 border-l-2 border-line pl-8">
          {steps.map((s, i) => (
            <li key={s.title} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[3.05rem] top-0 flex h-10 w-10 items-center justify-center rounded-full bg-accent font-serif text-white"
              >
                {i + 1}
              </span>
              <h2 className="text-2xl">{s.title}</h2>
              <p className="mt-2 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
        <div>
          <ImageSlot name="lakeLucerne" locale={locale} className="aspect-[4/5] w-full rounded-card" />
          <p className="mt-6 rounded-card bg-sand p-5 text-sm text-muted">{t(locale, "howItWorks.note")}</p>
        </div>
      </section>
      <CtaBand locale={locale} />
    </>
  );
}
