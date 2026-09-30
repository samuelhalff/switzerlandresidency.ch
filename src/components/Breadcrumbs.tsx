import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";
import { localePath } from "@/lib/paths";
import { breadcrumbLd } from "@/lib/jsonld";
import JsonLd from "./JsonLd";

export type BreadcrumbItem = { label: string; path: string };

/** Visible breadcrumb + BreadcrumbList JSON-LD. Items use locale-less paths; Home is added automatically. */
export default function Breadcrumbs({ locale, items }: { locale: Locale; items: BreadcrumbItem[] }) {
  const all = [{ label: t(locale, "common.home"), path: "/" }, ...items];
  return (
    <>
      <nav aria-label={t(locale, "common.breadcrumb")} className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.path} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="text-ink">
                    {c.label}
                  </span>
                ) : (
                  <>
                    <Link href={localePath(locale, c.path)} className="underline-offset-4 hover:underline">
                      {c.label}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbLd(all.map((c) => ({ name: c.label, path: localePath(locale, c.path) })))} />
    </>
  );
}
