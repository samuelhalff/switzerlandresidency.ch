"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { errorSummary } from "@/lib/form-validation";
import type { Messages } from "@/lib/i18n";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import Panel from "../ui/Panel";
import { cn } from "../ui/cn";
import { focusAndReveal, type FormStatus } from "./useLeadForm";

export type FormLabels = Messages["contact"]["form"];

/** aria attributes for a control that may carry a validation error (message id = `${id}-error`). */
export function invalidProps(id: string, error?: string) {
  return error ? ({ "aria-invalid": true, "aria-describedby": `${id}-error` } as const) : {};
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="font-semibold text-danger">
      {" "}
      *
    </span>
  );
}

/** The specific message under an invalid field. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="field-error">
      <Icon name="alert" size={18} className="mt-[0.2em] shrink-0" />
      <span>{message}</span>
    </p>
  );
}

/** Label + control wrapper; `required` adds the "*", `optional` the quiet "(optional)" suffix. */
export function Field({
  id,
  label,
  required,
  optional,
  optionalLabel,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  optionalLabel?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className} data-field="">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required ? <RequiredMark /> : null}
        {optional ? <span className="font-normal text-muted"> ({optionalLabel})</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
      <FieldError id={id} message={error} />
    </div>
  );
}

/** "* required field" legend shown once at the top of a form. */
export function RequiredNote({ labels }: { labels: FormLabels }) {
  return (
    <p className="text-sm text-muted">
      <span aria-hidden="true" className="font-semibold text-danger">
        *
      </span>{" "}
      {labels.requiredNote}
    </p>
  );
}

/** Select with a disabled placeholder option; values are the object keys. */
export function Select({
  id,
  name,
  options,
  placeholder,
  required,
  error,
}: {
  id: string;
  name: string;
  options: Record<string, string>;
  placeholder: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <select id={id} name={name} required={required} defaultValue="" className="field" {...invalidProps(id, error)}>
      <option value="" disabled={required}>
        {placeholder}
      </option>
      {Object.entries(options).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({ id, name, value, label }: { id: string; name: string; value?: string; label: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <input id={id} name={name} value={value} type="checkbox" className="checkbox" />
      <label htmlFor={id} className="text-[0.95rem]">
        {label}
      </label>
    </div>
  );
}

/** Hidden from people and assistive tech; bots fill it. */
export function Honeypot({ id, label }: { id: string; label: string }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor={id}>{label}</label>
      <input id={id} name="_honeypot" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

export function Consent({ id, labels, privacyHref, error }: { id: string; labels: FormLabels; privacyHref: string; error?: string }) {
  return (
    <div data-field="" className={cn("consent", error && "consent-invalid")}>
      <div className="flex items-start gap-3">
        <input id={id} name="consent" type="checkbox" required className="checkbox" {...invalidProps(id, error)} />
        <label htmlFor={id} className="text-[0.95rem] leading-relaxed">
          {labels.consentBefore}{" "}
          <a href={privacyHref} className="link" target="_blank" rel="noopener">
            {labels.consentLink}
          </a>
          {labels.consentAfter}
          <RequiredMark />
        </label>
      </div>
      <FieldError id={id} message={error} />
    </div>
  );
}

/** Shown right above the submit button after a failed validation: how many fields need attention. */
export function ErrorSummary({ count, labels }: { count: number; labels: FormLabels }) {
  if (count <= 0) return null;
  return (
    <div role="alert" className="form-alert">
      <Icon name="alert" size={22} className="mt-[0.15em] shrink-0" />
      <p>{errorSummary(count, { one: labels.errorSummaryOne, many: labels.errorSummaryMany })}</p>
    </div>
  );
}

/** Send failure (network, HTTP error, spam protection): what happened + a retry button. Values stay in the form. */
function SendError({ labels, whatsappHref }: { labels: FormLabels; whatsappHref: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => focusAndReveal(ref.current), []);
  return (
    <div ref={ref} role="alert" tabIndex={-1} className="form-alert focus:outline-none" data-send-error="">
      <Icon name="alert" size={22} className="mt-[0.15em] shrink-0" />
      <div>
        <p className="font-semibold">{labels.errorTitle}</p>
        <p className="mt-1">
          {labels.error}
          {whatsappHref ? (
            <>
              {" "}
              {labels.errorWhatsappBefore}{" "}
              <a href={whatsappHref} className="link" target="_blank" rel="noopener noreferrer">
                {labels.whatsappLink}
              </a>
              {labels.errorWhatsappAfter}
            </>
          ) : null}
        </p>
        <Button type="submit" className="mt-4">
          {labels.retry}
        </Button>
      </div>
    </div>
  );
}

/**
 * Bottom of a form: validation summary, then either the submit button (with its loading state)
 * or, after a failed send, the error panel with a retry button.
 */
export function FormFooter({
  labels,
  status,
  errorCount,
  submitLabel,
  whatsappHref,
}: {
  labels: FormLabels;
  status: FormStatus;
  errorCount: number;
  submitLabel: string;
  whatsappHref: string;
}) {
  if (status === "error") return <SendError labels={labels} whatsappHref={whatsappHref} />;
  const sending = status === "sending";
  return (
    <div data-form-footer="" className="space-y-5">
      <ErrorSummary count={errorCount} labels={labels} />
      <Button type="submit" size="lg" fullWidth="mobile" disabled={sending} aria-busy={sending}>
        {sending ? labels.sending : submitLabel}
      </Button>
    </div>
  );
}

export function SuccessPanel({ title, text }: { title: string; text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => focusAndReveal(ref.current), []);
  return (
    <div ref={ref} role="status" tabIndex={-1} className="form-success rounded-soft focus:outline-none" data-form-success="">
      <Panel padding="lg">
        <span className="form-success-icon" aria-hidden="true">
          <Icon name="check" size={26} />
        </span>
        <h2 className="mt-5 text-[1.75rem]">{title}</h2>
        <p className="mt-3 text-muted">{text}</p>
      </Panel>
    </div>
  );
}

/** Shown when no Formspark id is configured. */
export function FallbackPanel({ labels, whatsappHref }: { labels: FormLabels; whatsappHref: string }) {
  return (
    <Panel padding="lg">
      <p>{labels.fallbackText}</p>
      {whatsappHref ? (
        <Button href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-6">
          {labels.whatsappLink}
        </Button>
      ) : null}
    </Panel>
  );
}
