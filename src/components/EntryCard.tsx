import Link from "next/link";
import type { Entry } from "@/lib/content";
import { t, type Locale } from "@/lib/i18n";
import { collectionBase, localePath } from "@/lib/paths";

export function formatDate(iso: string, locale: Locale): string {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(locale === "en" ? "en-GB" : `${locale}-CH`, { year: "numeric", month: "long", day: "numeric" });
}

export default function EntryCard({ entry, locale }: { entry: Entry; locale: Locale }) {
  const href = localePath(locale, `/${collectionBase[entry.collection]}/${entry.slug}/`);
  return (
    <Link href={href} className="card group flex h-full flex-col">
      <h3 className="text-xl group-hover:text-accent">{entry.title}</h3>
      {entry.description ? <p className="mt-3 flex-1 text-muted">{entry.description}</p> : null}
      <p className="mt-4 text-sm text-muted">
        {entry.updated ? `${t(locale, "common.updated")} ${formatDate(entry.updated, locale)}` : null}
      </p>
    </Link>
  );
}
