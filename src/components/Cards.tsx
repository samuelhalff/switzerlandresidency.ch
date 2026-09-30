import { getPublishedEntries, isPublished } from "@/lib/content";
import { getMessages, t, type Locale } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import EntryCard from "./EntryCard";
import Card, { type CardTone } from "./ui/Card";
import IconBadge, { type IconBadgeTone } from "./ui/IconBadge";
import type { IconName } from "./ui/Icon";
import Icon from "./ui/Icon";
import { cn } from "./ui/cn";

type Item = { slug: string; title: string; summary: string };

const serviceIcons: Record<string, IconName> = {
  "residence-permit": "key",
  "lump-sum-taxation": "scale",
  "tax-ruling": "document",
  "property-search-purchase": "house",
  "settling-in": "family",
  "ongoing-tax-wealth": "sprout",
};

const originIcons: Record<string, IconName> = {
  "united-kingdom": "compass",
  "european-union": "stars",
  gulf: "sun",
  americas: "globe",
  asia: "lantern",
};

/** Gentle tonal rhythm so a grid never reads as identical boxes. */
const serviceTones: { card: CardTone; badge: IconBadgeTone }[] = [
  { card: "blush", badge: "surface" },
  { card: "sage", badge: "surface" },
  { card: "sand", badge: "surface" },
  { card: "sand", badge: "surface" },
  { card: "blush", badge: "surface" },
  { card: "sage", badge: "surface" },
];

function ItemCard({
  item,
  href,
  cta,
  icon,
  tone,
  badge,
  index,
  compact = false,
}: {
  item: Item;
  href?: string;
  cta: string;
  icon: IconName;
  tone: CardTone;
  badge: IconBadgeTone;
  index: number;
  compact?: boolean;
}) {
  return (
    <Card as="li" href={href} tone={tone} reveal={index} padding={compact ? "sm" : "md"} className="h-full">
      <IconBadge icon={icon} tone={badge} size={compact ? "sm" : "md"} />
      <h3 className={cn("transition-colors group-hover:text-accent", compact ? "mt-4 text-xl" : "mt-5 text-2xl")}>{item.title}</h3>
      <p className={cn("mt-2.5 flex-1 text-muted", compact ? "text-[0.95rem]" : "")}>{item.summary}</p>
      {href ? (
        <span className="mt-5 inline-flex items-center gap-2 text-[0.95rem] font-semibold text-[rgb(var(--em))]">
          {cta}
          <Icon name="arrow" size={18} className="btn-arrow" />
        </span>
      ) : null}
    </Card>
  );
}

/** The six services from i18n as tinted cards; each links to its page once published content exists. */
export function ServiceGrid({ locale }: { locale: Locale }) {
  const items = Object.entries(getMessages(locale).services.items).map(([slug, v]) => ({ slug, ...v }));
  const extra = getPublishedEntries(locale, "services").filter((e) => !items.some((i) => i.slug === e.slug));
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <ItemCard
          key={item.slug}
          item={item}
          index={i % 3}
          icon={serviceIcons[item.slug] ?? "sparkle"}
          tone={serviceTones[i % serviceTones.length].card}
          badge={serviceTones[i % serviceTones.length].badge}
          cta={t(locale, "common.learnMore")}
          href={isPublished(locale, "services", item.slug) ? localePath(locale, `/services/${item.slug}/`) : undefined}
        />
      ))}
      {extra.map((e, i) => (
        <EntryCard key={e.slug} entry={e} locale={locale} as="li" index={i % 3} />
      ))}
    </ul>
  );
}

/** Origin regions from i18n; each links to its page once published content exists. */
export function OriginGrid({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const items = Object.entries(getMessages(locale).origins.items).map(([slug, v]) => ({ slug, ...v }));
  const extra = getPublishedEntries(locale, "origins").filter((e) => !items.some((i) => i.slug === e.slug));
  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2", compact ? "lg:grid-cols-5" : "gap-5 lg:grid-cols-3")}>
      {items.map((item, i) => (
        <ItemCard
          key={item.slug}
          item={item}
          index={i}
          compact={compact}
          icon={originIcons[item.slug] ?? "plane"}
          tone="plain"
          badge={i % 2 ? "sage" : "blush"}
          cta={t(locale, "common.learnMore")}
          href={isPublished(locale, "origins", item.slug) ? localePath(locale, `/moving-from/${item.slug}/`) : undefined}
        />
      ))}
      {extra.map((e, i) => (
        <EntryCard key={e.slug} entry={e} locale={locale} as="li" index={i} />
      ))}
    </ul>
  );
}
