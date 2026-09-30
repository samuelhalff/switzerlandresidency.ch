import { getPublishedEntries, isPublished } from "@/lib/content";
import { getMessages, type Locale } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import { HairlineList, HairlineRow } from "./ui/HairlineList";

/** The six services from i18n as hairline rows; each links to its page once published content exists. */
export function ServiceGrid({ locale, size = "lg" }: { locale: Locale; size?: "md" | "lg" }) {
  const items = Object.entries(getMessages(locale).services.items).map(([slug, v]) => ({ slug, ...v }));
  const extra = getPublishedEntries(locale, "services").filter((e) => !items.some((i) => i.slug === e.slug));
  return (
    <HairlineList>
      {items.map((item) => (
        <HairlineRow
          key={item.slug}
          size={size}
          title={item.title}
          text={item.summary}
          href={isPublished(locale, "services", item.slug) ? localePath(locale, `/services/${item.slug}/`) : undefined}
        />
      ))}
      {extra.map((e) => (
        <HairlineRow key={e.slug} size={size} title={e.title} text={e.description} href={localePath(locale, `/services/${e.slug}/`)} />
      ))}
    </HairlineList>
  );
}

/** Origin regions from i18n as hairline rows; each links to its page once published content exists. */
export function OriginGrid({ locale, size = "lg" }: { locale: Locale; size?: "md" | "lg" }) {
  const items = Object.entries(getMessages(locale).origins.items).map(([slug, v]) => ({ slug, ...v }));
  const extra = getPublishedEntries(locale, "origins").filter((e) => !items.some((i) => i.slug === e.slug));
  return (
    <HairlineList>
      {items.map((item) => (
        <HairlineRow
          key={item.slug}
          size={size}
          title={item.title}
          text={item.summary}
          href={isPublished(locale, "origins", item.slug) ? localePath(locale, `/moving-from/${item.slug}/`) : undefined}
        />
      ))}
      {extra.map((e) => (
        <HairlineRow key={e.slug} size={size} title={e.title} text={e.description} href={localePath(locale, `/moving-from/${e.slug}/`)} />
      ))}
    </HairlineList>
  );
}
