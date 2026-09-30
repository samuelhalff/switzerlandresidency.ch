import { t, type Locale } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import Button from "./ui/Button";
import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";

/**
 * Closing call to action: a quiet centred statement on the page ground (no coloured box),
 * one primary button (private conversation) and the eligibility check as a text link.
 */
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
    <Section spacing="lg" hairline>
      <SectionHeading
        align="center"
        size="lg"
        eyebrow={eyebrow}
        title={title ?? t(locale, "home.finalCta.title")}
        accent={title ? accent : (accent ?? t(locale, "home.finalCta.accent"))}
        lead={text ?? t(locale, "home.finalCta.text")}
      />
      <div className="mt-10 flex flex-col items-center gap-6" data-reveal="">
        <Button href={localePath(locale, "/contact/")} size="lg">
          {t(locale, "common.ctaConversation")}
        </Button>
        <Button href={localePath(locale, "/eligibility-check/")} variant="link" arrow>
          {t(locale, "common.ctaRoute")}
        </Button>
      </div>
    </Section>
  );
}
