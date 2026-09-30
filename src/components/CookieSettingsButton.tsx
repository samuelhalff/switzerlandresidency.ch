"use client";

import { CONSENT_EVENT } from "@/lib/consent";
import Button from "./ui/Button";

/** Reopens the cookie banner. `link` = inline text style (footer), `button` = secondary button. */
export default function CookieSettingsButton({ label, variant = "link" }: { label: string; variant?: "link" | "button" }) {
  const open = () => window.dispatchEvent(new Event(CONSENT_EVENT));
  return variant === "button" ? (
    <Button variant="secondary" onClick={open}>
      {label}
    </Button>
  ) : (
    <button type="button" className="text-left underline-offset-4 transition-colors hover:text-accent hover:underline" onClick={open}>
      {label}
    </button>
  );
}
