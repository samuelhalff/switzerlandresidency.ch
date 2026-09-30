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
              className={`inline-flex min-h-[36px] min-w-[32px] items-center justify-center px-1.5 text-[0.85rem] font-medium uppercase tracking-wide underline-offset-[6px] ${
                l.code === current ? "text-ink underline decoration-1" : "text-ink/60 hover:text-ink"
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
