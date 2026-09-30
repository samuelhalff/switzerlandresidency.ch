import type { ReactNode } from "react";
import { cn } from "./cn";

const sizes = {
  narrow: "max-w-3xl",
  prose: "max-w-4xl",
  default: "max-w-7xl",
  wide: "max-w-[90rem]",
} as const;

export type ContainerSize = keyof typeof sizes;

/** Centred page column with the site's side gutters (16px on phones). */
export default function Container({
  size = "default",
  className,
  children,
}: {
  size?: ContainerSize;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("mx-auto w-full px-4 sm:px-6", sizes[size], className)}>{children}</div>;
}
