"use client";

import { CONSENT_EVENT } from "@/lib/consent";

export default function CookieSettingsButton({
  label,
  className = "text-left underline-offset-4 hover:underline",
}: {
  label: string;
  className?: string;
}) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(CONSENT_EVENT))}>
      {label}
    </button>
  );
}
