"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  event: AnalyticsEvent;
  params?: Record<string, string>;
  children: ReactNode;
};

export default function TrackedLink({ event, params, onClick, children, ...rest }: Props) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        trackEvent(event, params);
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
