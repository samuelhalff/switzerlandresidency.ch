import { t, type Locale } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import Button from "./ui/Button";
import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";

/** Deep "evening" green closing band with the two main calls to action. */
export default function CtaBand({
  locale,
  eyebrow,
  title,
  accent,
  text,
}: {
  locale: Locale;
  eyebrow?: string;
  title?: string;
  accent?: string;
  text?: string;
}) {
  return (
    <Section tone="evening" spacing="lg" divider="top" className="overflow-x-clip pb-28 sm:pb-36">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[60rem] max-w-full -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(240_165_126/0.10),transparent)]" />
      <div className="relative">
        <SectionHeading
          align="center"
          eyebrow={eyebrow}
          title={title ?? t(locale, "home.finalCta.title")}
          accent={title ? accent : (accent ?? t(locale, "home.finalCta.accent"))}
          lead={text ?? t(locale, "home.finalCta.text")}
        />
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center" data-reveal="">
          <Button href={localePath(locale, "/eligibility-check/")} size="lg">
            {t(locale, "home.finalCta.primary")}
          </Button>
          <Button href={localePath(locale, "/contact/")} variant="secondary" size="lg">
            {t(locale, "home.finalCta.secondary")}
          </Button>
        </div>
      </div>
    </Section>
  );
}
