import { faqLd } from "@/lib/jsonld";
import JsonLd from "./JsonLd";
import Icon from "./ui/Icon";
import SectionHeading from "./ui/SectionHeading";
import { cn } from "./ui/cn";

/** Accessible FAQ using native <details> separated by hairlines; emits FAQPage JSON-LD for the visible Q&As. */
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
      <div className={cn("border-t border-line", compact ? "mt-6" : "mt-10")}>
        {items.map((f) => (
          <details key={f.q} className="faq-item group border-b border-line" data-reveal="">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-serif text-[1.2rem] leading-snug sm:py-6 sm:text-[1.35rem]">
              <span>{f.q}</span>
              <span aria-hidden="true" className="faq-icon h-8 w-8 shrink-0 items-center justify-center rounded-full text-accent">
                <Icon name="plus" size={20} />
              </span>
            </summary>
            <p className="max-w-2xl pb-6 text-muted">{f.a}</p>
          </details>
        ))}
      </div>
      {schema ? <JsonLd data={faqLd(items)} /> : null}
    </section>
  );
}
