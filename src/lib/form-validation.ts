/**
 * Pure form validation + feedback helpers (no DOM), shared by the contact and adviser forms.
 * Every rule describes one REQUIRED field; optional fields are never validated.
 */
export type FieldKind = "text" | "email" | "select" | "checkbox";

export type FieldRule = {
  /** Form control name (FormData key). */
  name: string;
  /** DOM id of the control (focus target, error id = `${id}-error`). */
  id: string;
  kind: FieldKind;
  /** Message when the field is empty / unticked. */
  required: string;
  /** Message when the value is present but malformed (email). */
  invalid?: string;
};

export type FieldError = { name: string; id: string; message: string };
export type FormValues = Record<string, string | boolean | null | undefined>;

/**
 * Pragmatic email check: one "@", a non-empty local part, a dotted domain with a 2+ letter TLD,
 * no spaces, no leading/trailing/double dots in the domain. Stricter than `type="email"`
 * (which accepts "a@b"), looser than RFC 5322 on purpose.
 */
export function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (!v || v.length > 254 || /\s/.test(v)) return false;
  const at = v.indexOf("@");
  if (at < 1 || at !== v.lastIndexOf("@")) return false;
  const domain = v.slice(at + 1);
  if (!/^[^.@]+(\.[^.@]+)+$/.test(domain)) return false;
  return /^(\p{L}{2,}|xn--[a-z0-9-]+)$/iu.test(domain.slice(domain.lastIndexOf(".") + 1));
}

/** Error message for one field, or null when it is valid. */
export function validateField(rule: FieldRule, value: string | boolean | null | undefined): string | null {
  if (rule.kind === "checkbox") return value === true || value === "on" ? null : rule.required;
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return rule.required;
  if (rule.kind === "email" && !isValidEmail(text)) return rule.invalid ?? rule.required;
  return null;
}

/** Errors in rule (= visual) order; the first one is the field to focus. */
export function validateForm(rules: readonly FieldRule[], values: FormValues): FieldError[] {
  const errors: FieldError[] = [];
  for (const rule of rules) {
    const message = validateField(rule, values[rule.name]);
    if (message) errors.push({ name: rule.name, id: rule.id, message });
  }
  return errors;
}

/** "1 field needs your attention." / "3 fields need your attention." ({count} placeholder in `many`). */
export function errorSummary(count: number, templates: { one: string; many: string }): string {
  if (count <= 0) return "";
  return (count === 1 ? templates.one : templates.many).replace(/\{count\}/g, String(count));
}

/**
 * Document scroll position that centres an element in the part of the viewport that is actually
 * visible: below the sticky header (`topInset`) and above a fixed bottom overlay such as the
 * cookie banner (`bottomInset`). An element taller than that area is aligned to its top instead.
 */
export function centeredScrollTop(o: {
  /** Element top relative to the viewport (getBoundingClientRect().top). */
  elementTop: number;
  elementHeight: number;
  scrollY: number;
  viewportHeight: number;
  topInset?: number;
  bottomInset?: number;
  /** Largest reachable scroll position (scrollHeight - viewportHeight). */
  maxScroll?: number;
  /** Breathing room when top-aligning a tall element. */
  gap?: number;
}): number {
  const topInset = o.topInset ?? 0;
  const bottomInset = o.bottomInset ?? 0;
  const gap = o.gap ?? 16;
  const available = Math.max(0, o.viewportHeight - topInset - bottomInset);
  const absoluteTop = o.scrollY + o.elementTop;
  const target =
    o.elementHeight + 2 * gap >= available
      ? absoluteTop - topInset - gap
      : absoluteTop - topInset - (available - o.elementHeight) / 2;
  const max = o.maxScroll ?? Number.POSITIVE_INFINITY;
  return Math.round(Math.min(Math.max(0, target), Math.max(0, max)));
}
