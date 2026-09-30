import { ctaContent, type CtaKind } from "@/lib/cta";
import type { Locale } from "@/lib/i18n";
import Button from "./ui/Button";
import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";

/**
 * Closing call to action: a quiet centred statement on the page ground (no coloured box),
 * one primary button and a secondary text link. `kind` picks the pair (default: private
 * conversation + eligibility check); see src/lib/cta.ts.
 */
export default function CtaBand({
  locale,
  eyebrow,
  title,
  accent,
  text,
  kind = "contact",
}: {
  locale: Locale;
  kind?: CtaKind;
  eyebrow?: string;
  title?: string;
  accent?: string;
  text?: string;
}) {
  const cta = ctaContent(kind, locale);
  return (
    <Section spacing="lg" hairline>
      <SectionHeading
        align="center"
        size="lg"
        eyebrow={eyebrow}
        title={title ?? cta.band.title}
        accent={title ? accent : (accent ?? cta.band.accent)}
        lead={text ?? cta.band.text}
      />
      <div className="mt-10 flex flex-col items-center gap-6" data-reveal="">
        <Button href={cta.primary.href} size="lg">
          {cta.primary.label}
        </Button>
        <Button href={cta.secondary.href} variant="link" arrow>
          {cta.secondary.label}
        </Button>
      </div>
    </Section>
  );
}
