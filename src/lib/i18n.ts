import en from "@/i18n/en.json";
import fr from "@/i18n/fr.json";
import de from "@/i18n/de.json";
import { typeset } from "./typography";

export const locales = ["en", "fr", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export type Messages = typeof en;

const dictionaries: Record<Locale, Messages> = { en, fr, de };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Dotted paths to every string leaf in en.json (arrays excluded — use getMessages). */
type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : T[K] extends readonly unknown[]
      ? never
      : T[K] extends object
        ? Leaves<T[K], `${P}${K}.`>
        : never;
}[keyof T & string];

export type TKey = Leaves<Messages>;

/** Deep-copy `value`, passing every string leaf through typeset() for `locale`. */
function typesetDeep<T>(locale: Locale, value: T): T {
  if (typeof value === "string") return typeset(locale, value) as T;
  if (Array.isArray(value)) return value.map((v) => typesetDeep(locale, v)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, typesetDeep(locale, v)]),
    ) as T;
  }
  return value;
}

const typesetCache = new Map<Locale, Messages>();

/** Full message tree for a locale, with French typography applied (memoised per locale). */
export function getMessages(locale: Locale): Messages {
  let messages = typesetCache.get(locale);
  if (!messages) {
    messages = locale === "fr" ? typesetDeep(locale, dictionaries[locale]) : dictionaries[locale];
    typesetCache.set(locale, messages);
  }
  return messages;
}

/** Look up a UI string. Keys are type-checked against en.json; the build validator checks fr/de parity. */
export function t(locale: Locale, key: TKey): string {
  let cur: unknown = dictionaries[locale];
  for (const part of key.split(".")) {
    cur = (cur as Record<string, unknown> | undefined)?.[part];
  }
  return typeof cur === "string" ? typeset(locale, cur) : key;
}

/** Replace {name} placeholders. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

export const htmlLang: Record<Locale, string> = { en: "en", fr: "fr", de: "de" };
