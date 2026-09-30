import { getMessages, t } from "@/lib/i18n";
import { ARK_URL } from "@/lib/site";
import { getLocale, staticMetadata, type LocaleParams } from "@/lib/page";
import PageHeader from "@/components/PageHeader";
import ImageSlot from "@/components/ImageSlot";
import CtaBand from "@/components/CtaBand";

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
      <section className="container-page section grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div className="max-w-prose space-y-5 text-lg">
          {m.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <h2 className="h2 pt-6">{t(locale, "about.valuesTitle")}</h2>
          <ul className="space-y-3">
            {m.values.map((v) => (
              <li key={v} className="flex gap-3">
                <span aria-hidden="true" className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-accent-soft" />
                <span>{v}</span>
              </li>
            ))}
          </ul>
          <p className="pt-6 text-base text-muted">
            {t(locale, "about.arkBefore")}{" "}
            <a href={ARK_URL} rel="noopener" className="link">
              {t(locale, "about.arkName")}
            </a>
            {t(locale, "about.arkAfter")}
          </p>
        </div>
        <ImageSlot name="mountainVillage" locale={locale} className="aspect-[4/5] w-full rounded-card" />
      </section>
      <CtaBand locale={locale} />
    </>
  );
}
