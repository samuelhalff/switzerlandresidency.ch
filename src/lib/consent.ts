export const CONSENT_KEY = "sr-consent";
export const CONSENT_EVENT = "sr:open-cookie-settings";
export type ConsentValue = "granted" | "denied";

export function readConsent(): ConsentValue | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(value: ConsentValue): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* storage unavailable: banner will simply show again next visit */
  }
}
