"use client";

import { useState, type FormEvent } from "react";
import { trackEvent } from "@/lib/analytics";
import { fieldValue, submitToFormspark } from "@/lib/formspark";
import type { Messages } from "@/lib/i18n";
import Button from "./ui/Button";
import Panel from "./ui/Panel";
import { Checkbox, Consent, FallbackPanel, Field, FormAlerts, Honeypot, Select, SuccessPanel, type FormLabels } from "./form/FormParts";

type Status = "idle" | "sending" | "success" | "error";

export type AdviserFormProps = {
  /** Shared form strings (consent, errors, sending…). */
  labels: FormLabels;
  adviser: Messages["advisers"]["form"];
  timingOptions: Messages["contactExtra"]["timingOptions"];
  locale: string;
  formsparkId: string;
  whatsappHref: string;
  privacyHref: string;
};

/**
 * "Introduce a client" form for private bankers, lawyers, tax advisers and other introducers.
 * Anonymous by design: no client name field. Sent to Formspark with form_type=adviser.
 */
export default function AdviserForm({ labels, adviser, timingOptions, locale, formsparkId, whatsappHref, privacyHref }: AdviserFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [missing, setMissing] = useState(false);

  if (!formsparkId) return <FallbackPanel labels={labels} whatsappHref={whatsappHref} />;
  if (status === "success") return <SuccessPanel title={adviser.successTitle} text={adviser.successText} />;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const value = (k: string) => fieldValue(data, k);

    if (data.get("consent") !== "on" || !form.checkValidity()) {
      setMissing(true);
      form.reportValidity();
      return;
    }
    setMissing(false);

    if (value("_honeypot")) {
      setStatus("success");
      return;
    }

    setStatus("sending");
    const payload: Record<string, string | boolean> = {
      form_type: value("form_type") || "adviser",
      adviser_name: value("adviser_name"),
      firm: value("firm"),
      role: value("role"),
      email: value("email"),
      phone: value("phone"),
      client_origin: value("client_origin"),
      client_timing: value("client_timing"),
      cantons: value("cantons"),
      scope: data.getAll("scope").map(String).join(", "),
      anonymous_prescreen: data.get("anonymous") === "on",
      message: value("message"),
      consent: true,
      site_locale: locale,
      page: window.location.pathname,
    };

    try {
      await submitToFormspark(formsparkId, payload);
      trackEvent("generate_lead", { method: "adviser_form" });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const opt = { optional: true, optionalLabel: labels.optional };
  return (
    <Panel padding="lg">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <input type="hidden" name="form_type" value="adviser" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="af-name" label={adviser.adviserName}>
            <input id="af-name" name="adviser_name" type="text" autoComplete="name" required className="field" />
          </Field>
          <Field id="af-firm" label={adviser.firm}>
            <input id="af-firm" name="firm" type="text" autoComplete="organization" required className="field" />
          </Field>
          <Field id="af-role" label={adviser.role}>
            <Select id="af-role" name="role" options={adviser.roles} placeholder={adviser.rolePlaceholder} required />
          </Field>
          <Field id="af-email" label={adviser.email}>
            <input id="af-email" name="email" type="email" autoComplete="email" required className="field" />
          </Field>
          <Field id="af-phone" label={adviser.phone} {...opt}>
            <input id="af-phone" name="phone" type="tel" autoComplete="tel" className="field" />
          </Field>
          <Field id="af-origin" label={adviser.clientOrigin}>
            <input id="af-origin" name="client_origin" type="text" required placeholder={adviser.clientOriginPlaceholder} className="field" />
          </Field>
          <Field id="af-timing" label={adviser.timing} {...opt}>
            <Select id="af-timing" name="client_timing" options={timingOptions} placeholder={adviser.rolePlaceholder} />
          </Field>
          <Field id="af-cantons" label={adviser.cantons} {...opt}>
            <input id="af-cantons" name="cantons" type="text" placeholder={adviser.cantonsPlaceholder} className="field" />
          </Field>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">
            {adviser.scope} <span className="font-normal text-muted">({labels.optional})</span>
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {Object.entries(adviser.scopes).map(([value, label]) => (
              <Checkbox key={value} id={`af-scope-${value}`} name="scope" value={value} label={label} />
            ))}
          </div>
        </fieldset>

        <Checkbox id="af-anonymous" name="anonymous" label={adviser.anonymous} />

        <Field id="af-message" label={adviser.message} {...opt}>
          <textarea id="af-message" name="message" rows={4} placeholder={adviser.messagePlaceholder} className="field" />
        </Field>

        <Honeypot id="af-hp" label={labels.honeypot} />
        <Consent id="af-consent" labels={labels} privacyHref={privacyHref} />
        <FormAlerts labels={labels} missing={missing} error={status === "error"} whatsappHref={whatsappHref} />

        <Button type="submit" size="lg" disabled={status === "sending"}>
          {status === "sending" ? labels.sending : adviser.submit}
        </Button>
      </form>
    </Panel>
  );
}
