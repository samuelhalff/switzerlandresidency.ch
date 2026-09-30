import type { ReactNode } from "react";
import type { Messages } from "@/lib/i18n";
import Button from "../ui/Button";
import Panel from "../ui/Panel";

export type FormLabels = Messages["contact"]["form"];

/** Label + control wrapper; `optional` adds the quiet "(optional)" suffix. */
export function Field({
  id,
  label,
  optional,
  optionalLabel,
  children,
  className,
}: {
  id: string;
  label: string;
  optional?: boolean;
  optionalLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {optional ? <span className="font-normal text-muted"> ({optionalLabel})</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/** Select with a disabled placeholder option; values are the object keys. */
export function Select({
  id,
  name,
  options,
  placeholder,
  required,
}: {
  id: string;
  name: string;
  options: Record<string, string>;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <select id={id} name={name} required={required} defaultValue="" className="field">
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
      <input id={id} name={name} value={value} type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--accent))]" />
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

export function Consent({ id, labels, privacyHref }: { id: string; labels: FormLabels; privacyHref: string }) {
  return (
    <div className="flex items-start gap-3">
      <input id={id} name="consent" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--accent))]" />
      <label htmlFor={id} className="text-sm">
        {labels.consentBefore}{" "}
        <a href={privacyHref} className="link" target="_blank" rel="noopener">
          {labels.consentLink}
        </a>
        {labels.consentAfter}
      </label>
    </div>
  );
}

/** "Please fill in…" and send-error messages. */
export function FormAlerts({
  labels,
  missing,
  error,
  whatsappHref,
}: {
  labels: FormLabels;
  missing: boolean;
  error: boolean;
  whatsappHref: string;
}) {
  return (
    <>
      {missing ? (
        <p role="alert" className="text-sm font-medium text-accent">
          {labels.required}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-medium text-accent">
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
      ) : null}
    </>
  );
}

export function SuccessPanel({ title, text }: { title: string; text: string }) {
  return (
    <Panel padding="lg" role="status" aria-live="polite">
      <h2 className="text-[1.75rem]">{title}</h2>
      <p className="mt-3 text-muted">{text}</p>
    </Panel>
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
