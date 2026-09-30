"use client";

import { useEffect, useState, type FormEvent } from "react";
import { trackEvent } from "@/lib/analytics";
import { CHECK_STORAGE_KEY, type StoredCheck } from "@/lib/eligibility";
import type { Messages } from "@/lib/i18n";

type Labels = Messages["contact"]["form"];
type Status = "idle" | "sending" | "success" | "error";

type Props = {
  labels: Labels;
  locale: string;
  formsparkId: string;
  email: string;
  privacyHref: string;
  languages: { code: string; name: string }[];
};

function readStoredCheck(): StoredCheck | null {
  try {
    const raw = window.sessionStorage.getItem(CHECK_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredCheck) : null;
  } catch {
    return null;
  }
}

function clearStoredCheck() {
  try {
    window.sessionStorage.removeItem(CHECK_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export default function ContactForm({ labels, locale, formsparkId, email, privacyHref, languages }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [check, setCheck] = useState<StoredCheck | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setCheck(readStoredCheck());
  }, []);

  if (!formsparkId) {
    return (
      <div className="card">
        <p>{labels.fallbackText}</p>
        <a href={`mailto:${email}`} className="btn btn-primary mt-5">
          {email}
        </a>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="card" role="status" aria-live="polite">
        <h2 className="text-2xl">{labels.successTitle}</h2>
        <p className="mt-3 text-muted">{labels.successText}</p>
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const value = (k: string) => String(data.get(k) ?? "").trim();

    if (!value("name") || !value("email") || !value("message") || data.get("consent") !== "on" || !form.checkValidity()) {
      setMissing(true);
      form.reportValidity();
      return;
    }
    setMissing(false);

    // Bots fill hidden fields: pretend success, send nothing.
    if (value("_honeypot")) {
      setStatus("success");
      return;
    }

    setStatus("sending");
    const payload: Record<string, string | boolean> = {
      name: value("name"),
      email: value("email"),
      phone: value("phone"),
      preferred_language: value("language"),
      message: value("message"),
      consent: true,
      site_locale: locale,
      page: window.location.pathname,
    };
    if (check) {
      payload.check_result = check.summary.join("\n");
      payload.check_codes = `routes=${check.routes.join("+")}; lump_sum=${check.lumpSum}; cantons=${check.cantons.join("+")}; flags=${check.flags.join("+")}`;
      payload.check_answers = check.answers;
    }

    try {
      const res = await fetch(`https://submit-form.com/${encodeURIComponent(formsparkId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(String(res.status));
      trackEvent("generate_lead", { method: check ? "check" : "form" });
      clearStoredCheck();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const label = "block text-sm font-medium";
  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5">
      {check ? (
        <div className="rounded-xl border border-line bg-sand p-4 text-sm">
          <p className="font-medium">{labels.checkAttached}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {check.summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button
            type="button"
            className="link mt-3 text-sm"
            onClick={() => {
              clearStoredCheck();
              setCheck(null);
            }}
          >
            {labels.checkRemove}
          </button>
        </div>
      ) : null}

      <div>
        <label htmlFor="cf-name" className={label}>
          {labels.name}
        </label>
        <input id="cf-name" name="name" type="text" autoComplete="name" required className="field mt-1.5" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-email" className={label}>
            {labels.email}
          </label>
          <input id="cf-email" name="email" type="email" autoComplete="email" required className="field mt-1.5" />
        </div>
        <div>
          <label htmlFor="cf-phone" className={label}>
            {labels.phone} <span className="font-normal text-muted">({labels.optional})</span>
          </label>
          <input id="cf-phone" name="phone" type="tel" autoComplete="tel" className="field mt-1.5" />
        </div>
      </div>
      <div>
        <label htmlFor="cf-language" className={label}>
          {labels.language}
        </label>
        <select id="cf-language" name="language" defaultValue={locale} className="field mt-1.5">
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="cf-message" className={label}>
          {labels.message}
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          required
          placeholder={labels.messagePlaceholder}
          className="field mt-1.5"
        />
      </div>

      {/* Honeypot: hidden from people and assistive tech */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="cf-hp">{labels.honeypot}</label>
        <input id="cf-hp" name="_honeypot" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex items-start gap-3">
        <input id="cf-consent" name="consent" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--accent))]" />
        <label htmlFor="cf-consent" className="text-sm">
          {labels.consentBefore}{" "}
          <a href={privacyHref} className="link" target="_blank" rel="noopener">
            {labels.consentLink}
          </a>
          {labels.consentAfter}
        </label>
      </div>

      {missing ? (
        <p role="alert" className="text-sm font-medium text-accent">
          {labels.required}
        </p>
      ) : null}
      {status === "error" ? (
        <p role="alert" className="text-sm font-medium text-accent">
          {labels.error}{" "}
          <a href={`mailto:${email}`} className="link">
            {email}
          </a>
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={status === "sending"}>
        {status === "sending" ? labels.sending : labels.submit}
      </button>
    </form>
  );
}
