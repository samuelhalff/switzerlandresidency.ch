import en from "@/i18n/en.json";
import fr from "@/i18n/fr.json";
import de from "@/i18n/de.json";

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

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

/** Look up a UI string. Keys are type-checked against en.json; the build validator checks fr/de parity. */
export function t(locale: Locale, key: TKey): string {
  let cur: unknown = dictionaries[locale];
  for (const part of key.split(".")) {
    cur = (cur as Record<string, unknown> | undefined)?.[part];
  }
  return typeof cur === "string" ? cur : key;
}

/** Replace {name} placeholders. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

export const htmlLang: Record<Locale, string> = { en: "en", fr: "fr", de: "de" };
