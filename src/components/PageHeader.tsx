import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { imageCaption, type ImageName } from "@/lib/images";
import Breadcrumbs, { type BreadcrumbItem } from "./Breadcrumbs";
import Container from "./ui/Container";
import Photo from "./ui/Photo";
import SectionHeading from "./ui/SectionHeading";

type Props = {
  locale: Locale;
  title: string;
  accent?: string;
  intro?: string;
  crumbs: BreadcrumbItem[];
  /** Wide photo under the title, with a plain caption. */
  image?: ImageName;
  children?: ReactNode;
};

/** Editorial page header: breadcrumbs, light serif h1, quiet intro, optional wide photo. */
export default function PageHeader({ locale, title, accent, intro, crumbs, image, children }: Props) {
  return (
    <div className="pb-6 pt-10 sm:pt-16">
      <Container>
        <Breadcrumbs locale={locale} items={crumbs} />
        <SectionHeading as="h1" size="xl" title={title} accent={accent} lead={intro} className="mt-8 max-w-4xl" reveal={false} />
        {children}
      </Container>
      {image ? (
        <Container className="mt-12 sm:mt-16">
          <figure>
            <Photo name={image} locale={locale} aspect="aspect-[4/3] sm:aspect-[21/9]" priority />
            <figcaption className="mt-3 text-sm text-muted">{imageCaption(image, locale)}</figcaption>
          </figure>
        </Container>
      ) : null}
    </div>
  );
}
