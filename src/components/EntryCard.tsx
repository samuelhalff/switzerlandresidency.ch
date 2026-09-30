import type { Entry } from "@/lib/content";
import { t, type Locale } from "@/lib/i18n";
import { imageForEntry } from "@/lib/images";
import { collectionBase, localePath } from "@/lib/paths";
import Card, { type CardTone } from "./ui/Card";

export function formatDate(iso: string, locale: Locale): string {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(locale === "en" ? "en-GB" : `${locale}-CH`, { year: "numeric", month: "long", day: "numeric" });
}

/** Card for a guide / canton / service / origin page, with a photo on top. */
export default function EntryCard({
  entry,
  locale,
  tone = "plain",
  index,
  as = "div",
}: {
  entry: Entry;
  locale: Locale;
  tone?: CardTone;
  index?: number;
  as?: "div" | "li";
}) {
  const href = localePath(locale, `/${collectionBase[entry.collection]}/${entry.slug}/`);
  return (
    <Card href={href} image={imageForEntry(entry)} tone={tone} as={as} reveal={index ?? true} className="h-full">
      <h3 className="text-[1.35rem] leading-snug transition-colors group-hover:text-accent">{entry.title}</h3>
      {entry.description ? <p className="mt-3 flex-1 text-[0.98rem] text-muted">{entry.description}</p> : null}
      {entry.updated ? (
        <p className="mt-5 text-sm text-muted">
          {t(locale, "common.updated")} {formatDate(entry.updated, locale)}
        </p>
      ) : null}
    </Card>
  );
}
