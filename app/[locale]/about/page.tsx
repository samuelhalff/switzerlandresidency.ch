import { getMessages, t } from "@/lib/i18n";
import { imageCaption } from "@/lib/images";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import CtaBand from "@/components/CtaBand";
import Photo from "@/components/ui/Photo";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";

export const generateMetadata = staticMetadata("/about/", "about.title", "about.description");

export default async function AboutPage({ params }: { params: LocaleParams }) {
  const locale = await getLocale(params);
  const m = getMessages(locale).about;
  return (
    <>
      <PageHeader
        locale={locale}
        title={t(locale, "about.title")}
        intro={t(locale, "about.intro")}
        crumbs={[{ label: t(locale, "nav.about"), path: "/about/" }]}
      />
      <Section spacing="sm" className="pb-24">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-20">
          <div className="max-w-prose">
            <div className="space-y-5 text-lg leading-relaxed" data-reveal="">
              {m.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <SectionHeading title={t(locale, "about.valuesTitle")} size="md" className="mt-16" />
            <ul className="mt-6 border-t border-line">
              {m.values.map((v) => (
                <li key={v} className="border-b border-line py-4" data-reveal="">
                  {v}
                </li>
              ))}
            </ul>
            <p className="mt-10 text-base text-muted" data-reveal="">
              {t(locale, "about.partner")}
            </p>
          </div>
          <figure className="lg:self-start" data-reveal="">
            <Photo name="villageLane" locale={locale} aspect="aspect-[4/5]" position="center 40%" />
            <figcaption className="mt-3 text-sm text-muted">{imageCaption("villageLane", locale)}</figcaption>
          </figure>
        </div>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
