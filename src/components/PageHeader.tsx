import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import Breadcrumbs, { type BreadcrumbItem } from "./Breadcrumbs";

type Props = {
  locale: Locale;
  title: string;
  intro?: string;
  crumbs: BreadcrumbItem[];
  children?: ReactNode;
};

export default function PageHeader({ locale, title, intro, crumbs, children }: Props) {
  return (
    <div className="border-b border-line bg-sand/50">
      <div className="container-page py-10 sm:py-14">
        <Breadcrumbs locale={locale} items={crumbs} />
        <h1 className="h1 mt-5 max-w-4xl">{title}</h1>
        {intro ? <p className="lead mt-5 max-w-3xl">{intro}</p> : null}
        {children}
      </div>
    </div>
  );
}
