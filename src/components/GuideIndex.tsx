import { getPublishedEntries } from "@/lib/content";
import { getMessages, t, type Locale } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import EntryCard from "./EntryCard";
import Chip from "./ui/Chip";

export function guideCategories(locale: Locale): { key: string; label: string }[] {
  return Object.entries(getMessages(locale).guides.categories).map(([key, label]) => ({ key, label }));
}

/** Guide list with category filter as plain static links (/guides/ and /guides/category/<key>/). */
export default function GuideIndex({ locale, category }: { locale: Locale; category?: string }) {
  const guides = getPublishedEntries(locale, "guides").filter((g) => !category || g.category === category);
  const cats = guideCategories(locale);

  return (
    <>
      <nav aria-label={t(locale, "guides.filterLabel")}>
        <ul className="flex flex-wrap gap-2.5">
          <li>
            <Chip href={localePath(locale, "/guides/")} active={!category}>
              {t(locale, "common.allTopics")}
            </Chip>
          </li>
          {cats.map((c) => (
            <li key={c.key}>
              <Chip href={localePath(locale, `/guides/category/${c.key}/`)} active={category === c.key}>
                {c.label}
              </Chip>
            </li>
          ))}
        </ul>
      </nav>
      {guides.length ? (
        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((g, i) => (
            <EntryCard key={g.slug} entry={g} locale={locale} as="li" index={i % 3} />
          ))}
        </ul>
      ) : (
        <p className="mt-10 max-w-2xl text-lg text-muted">{t(locale, "guides.empty")}</p>
      )}
    </>
  );
}
