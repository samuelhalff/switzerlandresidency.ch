import { faqLd } from "@/lib/jsonld";
import JsonLd from "./JsonLd";

/** Accessible FAQ using native <details>; emits FAQPage JSON-LD for the visible Q&As. */
export default function Faq({ title, items, schema = true }: { title: string; items: { q: string; a: string }[]; schema?: boolean }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="faq-title">
      <h2 id="faq-title" className="h2">
        {title}
      </h2>
      <div className="mt-8 divide-y divide-line rounded-card border border-line bg-surface">
        {items.map((f) => (
          <details key={f.q} className="group px-5 py-4 sm:px-6">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-serif text-lg font-medium [&::-webkit-details-marker]:hidden">
              <span>{f.q}</span>
              <span aria-hidden="true" className="mt-1 text-accent transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-muted">{f.a}</p>
          </details>
        ))}
      </div>
      {schema ? <JsonLd data={faqLd(items)} /> : null}
    </section>
  );
}
