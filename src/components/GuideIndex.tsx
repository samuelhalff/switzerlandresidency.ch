import Link from "next/link";
import { getPublishedEntries } from "@/lib/content";
import { getMessages, t, type Locale } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import EntryCard from "./EntryCard";

export function guideCategories(locale: Locale): { key: string; label: string }[] {
  return Object.entries(getMessages(locale).guides.categories).map(([key, label]) => ({ key, label }));
}

/** Guide list with category filter as plain static links (/guides/ and /guides/category/<key>/). */
export default function GuideIndex({ locale, category }: { locale: Locale; category?: string }) {
  const guides = getPublishedEntries(locale, "guides").filter((g) => !category || g.category === category);
  const cats = guideCategories(locale);
  const pill = (active: boolean) =>
    `inline-flex min-h-[40px] items-center rounded-full border px-4 text-sm ${
      active ? "border-accent bg-accent text-white" : "border-line bg-surface hover:border-ink"
    }`;

  return (
    <>
      <nav aria-label={t(locale, "guides.filterLabel")}>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link href={localePath(locale, "/guides/")} className={pill(!category)} aria-current={!category ? "page" : undefined}>
              {t(locale, "common.allTopics")}
            </Link>
          </li>
          {cats.map((c) => (
            <li key={c.key}>
              <Link
                href={localePath(locale, `/guides/category/${c.key}/`)}
                className={pill(category === c.key)}
                aria-current={category === c.key ? "page" : undefined}
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {guides.length ? (
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <EntryCard key={g.slug} entry={g} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="lead mt-10 max-w-2xl">{t(locale, "guides.empty")}</p>
      )}
    </>
  );
}
