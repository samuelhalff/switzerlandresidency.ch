/**
 * Formspark submission (the only written channel: no email addresses on the site).
 * Every form sends a `form_type` so enquiries can be triaged: "contact" | "adviser".
 */
export type FormType = "contact" | "adviser";

/** Give up after this long so the form never stays on "Sending…" on a dead connection. */
const TIMEOUT_MS = 20000;

export async function submitToFormspark(formsparkId: string, payload: Record<string, string | boolean>): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`https://submit-form.com/${encodeURIComponent(formsparkId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    // Includes 403 from Formspark's spam protection: the caller shows a retry panel.
    if (!res.ok) throw new Error(String(res.status));
  } finally {
    clearTimeout(timer);
  }
}

/** Trimmed string value of a form field ("" when absent). */
export function fieldValue(data: FormData, key: string): string {
  return String(data.get(key) ?? "").trim();
}
