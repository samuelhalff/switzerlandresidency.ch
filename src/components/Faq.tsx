import { faqLd } from "@/lib/jsonld";
import JsonLd from "./JsonLd";
import Icon from "./ui/Icon";
import SectionHeading from "./ui/SectionHeading";
import { cn } from "./ui/cn";

/** Accessible FAQ using native <details> as soft accordions; emits FAQPage JSON-LD for the visible Q&As. */
export default function Faq({
  title,
  accent,
  eyebrow,
  items,
  schema = true,
  compact = false,
}: {
  title: string;
  accent?: string;
  eyebrow?: string;
  items: { q: string; a: string }[];
  schema?: boolean;
  /** Smaller heading, for use inside an article column. */
  compact?: boolean;
}) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="faq-title">
      <SectionHeading id="faq-title" eyebrow={eyebrow} title={title} accent={accent} size={compact ? "md" : "lg"} />
      <div className={cn("space-y-3", compact ? "mt-6" : "mt-10")}>
        {items.map((f) => (
          <details key={f.q} className="faq-item group rounded-tile bg-surface shadow-soft" data-reveal="">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-tile px-5 py-4 font-serif text-lg sm:px-6 sm:py-5 sm:text-xl">
              <span>{f.q}</span>
              <span
                aria-hidden="true"
                className="faq-icon inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush text-accent"
              >
                <Icon name="plus" size={18} />
              </span>
            </summary>
            <p className="px-5 pb-5 text-muted sm:px-6 sm:pb-6">{f.a}</p>
          </details>
        ))}
      </div>
      {schema ? <JsonLd data={faqLd(items)} /> : null}
    </section>
  );
}
