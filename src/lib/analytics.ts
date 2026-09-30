/**
 * GA4 event helper. No-ops when gtag is absent (no GA ID, consent not given, or server render).
 * Events (docs/PLAN.md resolutions): eligibility_start, eligibility_step_{n}, eligibility_result,
 * generate_lead (method=form|check), contact_channel_click (channel=whatsapp|email).
 * Never pass personal data here.
 */
type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

export type AnalyticsEvent =
  | "eligibility_start"
  | `eligibility_step_${number}`
  | "eligibility_result"
  | "generate_lead"
  | "contact_channel_click";

export function trackEvent(name: AnalyticsEvent, params: Record<string, string | number | boolean> = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
