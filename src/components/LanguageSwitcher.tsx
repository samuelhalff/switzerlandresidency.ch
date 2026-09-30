"use client";

import { usePathname } from "next/navigation";

type Props = {
  current: string;
  label: string;
  languages: { code: string; name: string }[];
};

/** Swaps the locale prefix and keeps the rest of the path (slugs are shared across locales). */
export default function LanguageSwitcher({ current, label, languages }: Props) {
  const pathname = usePathname() || `/${current}/`;
  const rest = pathname.replace(/^\/(en|fr|de)(?=\/|$)/, "");
  return (
    <nav aria-label={label}>
      <ul className="flex items-center gap-1 text-sm">
        {languages.map((l) => (
          <li key={l.code}>
            <a
              href={`/${l.code}${rest || "/"}`}
              hrefLang={l.code}
              lang={l.code}
              aria-current={l.code === current ? "true" : undefined}
              title={l.name}
              className={`inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full px-2 font-medium uppercase ${
                l.code === current ? "bg-sand text-ink" : "text-muted hover:text-ink"
              }`}
            >
              <span aria-hidden="true">{l.code}</span>
              <span className="sr-only">{l.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
