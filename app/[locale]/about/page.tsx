import { getMessages, t } from "@/lib/i18n";
import { ARK_URL } from "@/lib/site";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import CtaBand from "@/components/CtaBand";
import ArchImage from "@/components/ui/ArchImage";
import IconBadge from "@/components/ui/IconBadge";
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
      <Section spacing="md" className="pb-24 sm:pb-28">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-20">
          <div className="max-w-prose">
            <div className="space-y-5 text-lg leading-relaxed" data-reveal="">
              {m.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <SectionHeading title={t(locale, "about.valuesTitle")} size="md" className="mt-14" />
            <ul className="mt-6 space-y-4">
              {m.values.map((v, i) => (
                <li key={v} className="flex items-start gap-4" data-reveal="">
                  <IconBadge icon="check" tone={i % 2 ? "sage" : "blush"} size="sm" />
                  <span className="pt-2">{v}</span>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-base text-muted" data-reveal="">
              {t(locale, "about.arkBefore")}{" "}
              <a href={ARK_URL} rel="noopener" className="link">
                {t(locale, "about.arkName")}
              </a>
              {t(locale, "about.arkAfter")}
            </p>
          </div>
          <ArchImage name="mountainVillage" locale={locale} aspect="4/5" frame="caramel" className="mx-auto w-full max-w-[420px] lg:mx-0 lg:self-start" />
        </div>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
