/**
 * Formspark submission (the only written channel: no email addresses on the site).
 * Every form sends a `form_type` so enquiries can be triaged: "contact" | "adviser".
 */
export type FormType = "contact" | "adviser";

export async function submitToFormspark(formsparkId: string, payload: Record<string, string | boolean>): Promise<void> {
  const res = await fetch(`https://submit-form.com/${encodeURIComponent(formsparkId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(String(res.status));
}

/** Trimmed string value of a form field ("" when absent). */
export function fieldValue(data: FormData, key: string): string {
  return String(data.get(key) ?? "").trim();
}
