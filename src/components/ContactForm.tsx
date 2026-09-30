"use client";

import { useEffect, useState, type FormEvent } from "react";
import { trackEvent } from "@/lib/analytics";
import { CHECK_STORAGE_KEY, type StoredCheck } from "@/lib/eligibility";
import { fieldValue, submitToFormspark } from "@/lib/formspark";
import type { Messages } from "@/lib/i18n";
import Button from "./ui/Button";
import Panel from "./ui/Panel";
import { Consent, FallbackPanel, Field, FormAlerts, Honeypot, Select, SuccessPanel, type FormLabels } from "./form/FormParts";

type Status = "idle" | "sending" | "success" | "error";

export type ContactFormProps = {
  labels: FormLabels;
  /** Optional qualification fields (timing, cantons, introducing adviser). */
  extra: Messages["contactExtra"];
  locale: string;
  formsparkId: string;
  /** wa.me link when NEXT_PUBLIC_WHATSAPP is set, else "". */
  whatsappHref: string;
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

export default function ContactForm({ labels, extra, locale, formsparkId, whatsappHref, privacyHref, languages }: ContactFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [check, setCheck] = useState<StoredCheck | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setCheck(readStoredCheck());
  }, []);

  if (!formsparkId) return <FallbackPanel labels={labels} whatsappHref={whatsappHref} />;
  if (status === "success") return <SuccessPanel title={labels.successTitle} text={labels.successText} />;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const value = (k: string) => fieldValue(data, k);

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
      form_type: "contact",
      name: value("name"),
      email: value("email"),
      phone: value("phone"),
      preferred_language: value("language"),
      message: value("message"),
      timing: value("timing"),
      cantons: value("cantons"),
      introduced_by: value("introduced_by"),
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
      await submitToFormspark(formsparkId, payload);
      trackEvent("generate_lead", { method: check ? "check" : "form" });
      clearStoredCheck();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Panel padding="lg">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {check ? (
          <div className="border-l-2 border-accent pl-4 text-sm">
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

        <Field id="cf-name" label={labels.name}>
          <input id="cf-name" name="name" type="text" autoComplete="name" required className="field" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="cf-email" label={labels.email}>
            <input id="cf-email" name="email" type="email" autoComplete="email" required className="field" />
          </Field>
          <Field id="cf-phone" label={labels.phone} optional optionalLabel={labels.optional}>
            <input id="cf-phone" name="phone" type="tel" autoComplete="tel" className="field" />
          </Field>
        </div>
        <Field id="cf-language" label={labels.language}>
          <select id="cf-language" name="language" defaultValue={locale} className="field">
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="cf-message" label={labels.message}>
          <textarea id="cf-message" name="message" rows={5} required placeholder={labels.messagePlaceholder} className="field" />
        </Field>

        {/* Optional qualification, folded away so the form stays light. */}
        <details className="group border-t border-line pt-4">
          <summary className="cursor-pointer list-none text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-45">+</span>
              {extra.details}
            </span>
          </summary>
          <div className="mt-5 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="cf-timing" label={extra.timing}>
                <Select id="cf-timing" name="timing" options={extra.timingOptions} placeholder={extra.timingPlaceholder} />
              </Field>
              <Field id="cf-cantons" label={extra.cantons}>
                <input id="cf-cantons" name="cantons" type="text" placeholder={extra.cantonsPlaceholder} className="field" />
              </Field>
            </div>
            <Field id="cf-introduced" label={extra.introducedBy}>
              <input id="cf-introduced" name="introduced_by" type="text" autoComplete="organization" placeholder={extra.introducedByPlaceholder} className="field" />
            </Field>
          </div>
        </details>

        <Honeypot id="cf-hp" label={labels.honeypot} />
        <Consent id="cf-consent" labels={labels} privacyHref={privacyHref} />
        <FormAlerts labels={labels} missing={missing} error={status === "error"} whatsappHref={whatsappHref} />

        <Button type="submit" size="lg" disabled={status === "sending"}>
          {status === "sending" ? labels.sending : labels.submit}
        </Button>
      </form>
    </Panel>
  );
}
