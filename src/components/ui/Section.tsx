import type { ReactNode } from "react";
import Container, { type ContainerSize } from "./Container";
import WaveDivider from "./WaveDivider";
import { cn } from "./cn";

const tones = {
  default: { bg: "bg-bg", fill: "text-bg" },
  surface: { bg: "bg-surface", fill: "text-surface" },
  sand: { bg: "bg-sand", fill: "text-sand" },
  sage: { bg: "bg-sage", fill: "text-sage" },
  blush: { bg: "bg-blush", fill: "text-blush" },
  evening: { bg: "on-dark bg-evening", fill: "text-evening" },
} as const;

export type SectionTone = keyof typeof tones;

const spacings = {
  none: "",
  sm: "py-10 sm:py-12",
  md: "py-16 sm:py-20",
  lg: "py-20 sm:py-28",
} as const;

/**
 * Page band with a tone, vertical rhythm and an optional hill-line divider that rises into the
 * previous section (`divider="top"`) or hangs over the top of the next one (`divider="bottom"`).
 */
export default function Section({
  tone = "default",
  spacing = "md",
  divider,
  container = "default",
  id,
  className,
  containerClassName,
  labelledBy,
  children,
}: {
  tone?: SectionTone;
  spacing?: keyof typeof spacings;
  divider?: "top" | "bottom" | "both";
  /** Container width, or false to render children full-bleed. */
  container?: ContainerSize | false;
  id?: string;
  className?: string;
  containerClassName?: string;
  labelledBy?: string;
  children: ReactNode;
}) {
  const t = tones[tone];
  const top = divider === "top" || divider === "both";
  const bottom = divider === "bottom" || divider === "both";
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("relative", t.bg, spacings[spacing], className)}>
      {top ? <WaveDivider className={cn("pointer-events-none absolute inset-x-0 bottom-full -mb-px", t.fill)} /> : null}
      {container === false ? children : <Container size={container} className={containerClassName}>{children}</Container>}
      {bottom ? (
        <WaveDivider flip className={cn("pointer-events-none absolute inset-x-0 top-full z-[1] -mt-px", t.fill)} />
      ) : null}
    </section>
  );
}
