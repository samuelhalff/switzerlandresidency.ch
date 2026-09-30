import type { Entry } from "@/lib/content";
import { t, type Locale } from "@/lib/i18n";
import { imageForEntry } from "@/lib/images";
import { collectionBase, localePath } from "@/lib/paths";
import Tile from "./ui/Tile";

export function formatDate(iso: string, locale: Locale): string {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(locale === "en" ? "en-GB" : `${locale}-CH`, { year: "numeric", month: "long", day: "numeric" });
}

/** Photo-led tile for a guide / canton / service / origin page. */
export default function EntryCard({
  entry,
  locale,
  index,
  aspect,
  showDate = false,
  compactOnMobile = false,
}: {
  entry: Entry;
  locale: Locale;
  index?: number;
  aspect?: string;
  showDate?: boolean;
  compactOnMobile?: boolean;
}) {
  return (
    <Tile
      href={localePath(locale, `/${collectionBase[entry.collection]}/${entry.slug}/`)}
      image={imageForEntry(entry)}
      title={entry.title}
      text={entry.description}
      meta={showDate && entry.updated ? `${t(locale, "common.updated")} ${formatDate(entry.updated, locale)}` : undefined}
      aspect={aspect}
      index={index}
      compactOnMobile={compactOnMobile}
    />
  );
}
