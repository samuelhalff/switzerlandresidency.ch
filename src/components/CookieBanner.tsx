"use client";

import { useEffect, useState } from "react";
import { CONSENT_EVENT, readConsent, writeConsent, type ConsentValue } from "@/lib/consent";

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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 px-4 py-4 shadow-[0_-8px_30px_-20px_rgba(0,0,0,0.5)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink">
          {text}{" "}
          <a className="link" href={privacyHref}>
            {more}
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="btn btn-secondary py-2" onClick={() => choose("denied")}>
            {decline}
          </button>
          <button type="button" className="btn btn-primary py-2" onClick={() => choose("granted")}>
            {accept}
          </button>
        </div>
      </div>
    </div>
  );
}
