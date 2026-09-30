import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";
import { localePath } from "@/lib/paths";

export default function CtaBand({ locale, title, text }: { locale: Locale; title?: string; text?: string }) {
  return (
    <section className="container-page section">
      <div className="rounded-card bg-band px-6 py-12 text-center text-white sm:px-12">
        <h2 className="h2 mx-auto max-w-2xl">{title ?? t(locale, "home.finalCta.title")}</h2>
        <p className="mx-auto mt-4 max-w-xl text-white/85">{text ?? t(locale, "home.finalCta.text")}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={localePath(locale, "/eligibility-check/")} className="btn btn-primary">
            {t(locale, "home.finalCta.primary")}
          </Link>
          <Link href={localePath(locale, "/contact/")} className="btn btn-on-image">
            {t(locale, "home.finalCta.secondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
