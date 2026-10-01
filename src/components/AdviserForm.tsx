"use client";

import { trackEvent } from "@/lib/analytics";
import type { FieldRule } from "@/lib/form-validation";
import { fieldValue, submitToFormspark } from "@/lib/formspark";
import type { Messages } from "@/lib/i18n";
import Panel from "./ui/Panel";
import {
  Checkbox,
  Consent,
  FallbackPanel,
  Field,
  FormFooter,
  Honeypot,
  RequiredNote,
  Select,
  SuccessPanel,
  invalidProps,
  type FormLabels,
} from "./form/FormParts";
import { useLeadForm } from "./form/useLeadForm";

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
  const e = labels.errors;
  const rules: FieldRule[] = [
    { name: "adviser_name", id: "af-name", kind: "text", required: e.name },
    { name: "firm", id: "af-firm", kind: "text", required: e.firm },
    { name: "role", id: "af-role", kind: "select", required: e.role },
    { name: "email", id: "af-email", kind: "email", required: e.email, invalid: e.emailFormat },
    { name: "client_origin", id: "af-origin", kind: "text", required: e.clientOrigin },
    { name: "consent", id: "af-consent", kind: "checkbox", required: e.consent },
  ];

  const { status, errors, errorCount, onSubmit, onChange } = useLeadForm(rules, async (data) => {
    const value = (k: string) => fieldValue(data, k);
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
    await submitToFormspark(formsparkId, payload);
    trackEvent("generate_lead", { method: "adviser_form" });
  });

  if (!formsparkId) return <FallbackPanel labels={labels} whatsappHref={whatsappHref} />;
  if (status === "success") return <SuccessPanel title={adviser.successTitle} text={adviser.successText} />;

  const opt = { optional: true, optionalLabel: labels.optional };
  return (
    <Panel padding="lg">
      <form onSubmit={onSubmit} onChange={onChange} noValidate className="space-y-5">
        <input type="hidden" name="form_type" value="adviser" />
        <RequiredNote labels={labels} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="af-name" label={adviser.adviserName} required error={errors.adviser_name}>
            <input id="af-name" name="adviser_name" type="text" autoComplete="name" required className="field" {...invalidProps("af-name", errors.adviser_name)} />
          </Field>
          <Field id="af-firm" label={adviser.firm} required error={errors.firm}>
            <input id="af-firm" name="firm" type="text" autoComplete="organization" required className="field" {...invalidProps("af-firm", errors.firm)} />
          </Field>
          <Field id="af-role" label={adviser.role} required error={errors.role}>
            <Select id="af-role" name="role" options={adviser.roles} placeholder={adviser.rolePlaceholder} required error={errors.role} />
          </Field>
          <Field id="af-email" label={adviser.email} required error={errors.email}>
            <input id="af-email" name="email" type="email" inputMode="email" autoComplete="email" required className="field" {...invalidProps("af-email", errors.email)} />
          </Field>
          <Field id="af-phone" label={adviser.phone} {...opt}>
            <input id="af-phone" name="phone" type="tel" autoComplete="tel" className="field" />
          </Field>
          <Field id="af-origin" label={adviser.clientOrigin} required error={errors.client_origin}>
            <input
              id="af-origin"
              name="client_origin"
              type="text"
              required
              placeholder={adviser.clientOriginPlaceholder}
              className="field"
              {...invalidProps("af-origin", errors.client_origin)}
            />
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
        <Consent id="af-consent" labels={labels} privacyHref={privacyHref} error={errors.consent} />
        <FormFooter labels={labels} status={status} errorCount={errorCount} submitLabel={adviser.submit} whatsappHref={whatsappHref} />
      </form>
    </Panel>
  );
}
