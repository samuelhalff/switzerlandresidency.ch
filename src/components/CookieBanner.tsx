"use client";

import { useEffect, useState } from "react";
import { CONSENT_EVENT, readConsent, writeConsent, type ConsentValue } from "@/lib/consent";
import Button from "./ui/Button";

type Props = {
  gaId: string;
  text: string;
  accept: string;
  decline: string;
  more: string;
  label: string;
  privacyHref: string;
};

declare global {
  interface Window {
    __srGtag?: (...args: unknown[]) => void;
  }
}

function enableAnalytics(gaId: string) {
  const g = window.__srGtag;
  if (!g || window.gtag) return;
  window.gtag = g;
  g("consent", "update", { analytics_storage: "granted" });
  g("js", new Date());
  g("config", gaId, { anonymize_ip: true });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  document.head.appendChild(s);
}

export default function CookieBanner({ gaId, text, accept, decline, more, label, privacyHref }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    if (stored === "granted") enableAnalytics(gaId);
    if (stored === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_EVENT, reopen);
  }, [gaId]);

  const choose = (value: ConsentValue) => {
    writeConsent(value);
    if (value === "granted") {
      enableAnalytics(gaId);
    } else if (window.gtag) {
      // Previously granted in this page view: revoke and reload so gtag.js is gone.
      window.gtag("consent", "update", { analytics_storage: "denied" });
      window.location.reload();
    }
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div
      role="region"
      aria-label={label}
      className="cookie-banner fixed inset-x-3 bottom-3 z-50 rounded-soft bg-surface px-5 py-4 shadow-[inset_0_0_0_1px_rgb(var(--line)),0_10px_30px_-12px_rgb(var(--shadow)/0.25)] sm:inset-x-6 sm:bottom-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink">
          {text}{" "}
          <a className="link" href={privacyHref}>
            {more}
          </a>
        </p>
        <div className="flex shrink-0 items-center gap-6">
          <Button variant="link" onClick={() => choose("denied")}>
            {decline}
          </Button>
          <Button size="sm" onClick={() => choose("granted")}>
            {accept}
          </Button>
        </div>
      </div>
    </div>
  );
}
