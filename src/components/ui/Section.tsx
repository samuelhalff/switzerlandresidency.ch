import type { ReactNode } from "react";
import Container, { type ContainerSize } from "./Container";
import { cn } from "./cn";

const spacings = {
  none: "",
  sm: "py-12 sm:py-16",
  md: "py-20 sm:py-24",
  lg: "py-24 sm:py-32",
} as const;

/** Page band: vertical rhythm, optional hairline on top. Sections are separated by whitespace and photos, not colour. */
export default function Section({
  spacing = "md",
  hairline = false,
  container = "default",
  id,
  className,
  containerClassName,
  labelledBy,
  children,
}: {
  spacing?: keyof typeof spacings;
  hairline?: boolean;
  /** Container width, or false to render children full-bleed. */
  container?: ContainerSize | false;
  id?: string;
  className?: string;
  containerClassName?: string;
  labelledBy?: string;
  children: ReactNode;
}) {
  const inner = container === false ? children : <Container size={container} className={containerClassName}>{children}</Container>;
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("relative", spacings[spacing], className)}>
      {hairline ? (
        <Container size={container === false ? "default" : container} className="absolute inset-x-0 top-0">
          <div className="h-px bg-line" />
        </Container>
      ) : null}
      {inner}
    </section>
  );
}
