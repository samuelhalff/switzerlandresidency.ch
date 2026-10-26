"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { captureVisit } from "@/lib/attribution";

/** Records each page view for lead-form attribution (see lib/attribution). Renders nothing. */
export default function AttributionCapture() {
  const pathname = usePathname();
  useEffect(() => {
    captureVisit();
  }, [pathname]);
  return null;
}
