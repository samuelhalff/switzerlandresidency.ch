import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import type { ImageName } from "@/lib/images";
import Breadcrumbs, { type BreadcrumbItem } from "./Breadcrumbs";
import ArchImage from "./ui/ArchImage";
import Container from "./ui/Container";
import SectionHeading from "./ui/SectionHeading";
import WaveDivider from "./ui/WaveDivider";
import { cn } from "./ui/cn";

type Props = {
  locale: Locale;
  title: string;
  accent?: string;
  intro?: string;
  crumbs: BreadcrumbItem[];
  /** Arch photo on the right (desktop). */
  image?: ImageName;
  children?: ReactNode;
};

/** Warm sand page header: breadcrumbs, h1 (optional accent word), intro, optional arch photo; ends in a hill line. */
export default function PageHeader({ locale, title, accent, intro, crumbs, image, children }: Props) {
  return (
    <div className="relative overflow-hidden bg-sand">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blush/70 blur-3xl" />
      <Container
        className={cn(
          "relative grid items-center gap-10 pb-20 pt-8 sm:pb-28 sm:pt-12",
          image && "lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]",
        )}
      >
        <div>
          <Breadcrumbs locale={locale} items={crumbs} />
          <SectionHeading as="h1" size="xl" title={title} accent={accent} lead={intro} className="mt-6 max-w-4xl" reveal={false} />
          {children}
        </div>
        {image ? (
          <ArchImage name={image} locale={locale} aspect="5/6" frame="blush" reveal={false} className="hidden w-full max-w-[340px] justify-self-end lg:block" />
        ) : null}
      </Container>
      <WaveDivider className="pointer-events-none absolute inset-x-0 bottom-0 text-bg" />
    </div>
  );
}
