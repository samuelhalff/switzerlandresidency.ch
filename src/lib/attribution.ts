/**
 * First-party attribution for lead forms: how the visitor arrived and which pages they read.
 *
 * Held in memory for every visitor (survives Next client-side navigation, gone when the tab
 * closes) and sent only with a form the visitor chooses to submit. Copied to sessionStorage
 * only after analytics consent ("granted"), so it survives full reloads too. Never stores full
 * URLs or query strings: pathnames, the referrer's origin and allowlisted campaign tags only.
 */
import { readConsent } from "./consent";

export const ATTRIBUTION_KEY = "sr-attribution";
const MAX_VALUE = 150;
const MAX_PATH = 200;
const MAX_PAGES = 20;
const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid"] as const;
type Param = (typeof PARAMS)[number];

export type Attribution = {
  landing?: string;
  referrer?: string;
  pages: string[];
} & Partial<Record<Param, string>>;

let state: Attribution = { pages: [] };

function clean(value: string | null | undefined, max = MAX_VALUE): string | undefined {
  const v = (value ?? "").trim();
  return v ? v.slice(0, max) : undefined;
}

/** Referrer origin only, and only when it is another site. */
export function referrerOrigin(referrer: string, ownOrigin: string): string | undefined {
  try {
    const origin = new URL(referrer).origin;
    return origin && origin !== "null" && origin !== ownOrigin ? clean(origin) : undefined;
  } catch {
    return undefined;
  }
}

/** Pure merge step: first touch wins for landing, referrer and campaign tags; page trail deduped and capped. */
export function mergeVisit(prev: Attribution, visit: { pathname: string; search: string; referrer?: string }): Attribution {
  const next: Attribution = { ...prev, pages: [...prev.pages] };
  const path = clean(visit.pathname, MAX_PATH);
  if (!next.landing && path) next.landing = path;
  if (!next.referrer && visit.referrer) next.referrer = visit.referrer;
  const params = new URLSearchParams(visit.search);
  for (const key of PARAMS) {
    const value = clean(params.get(key));
    if (value && !next[key]) next[key] = value;
  }
  if (path && !next.pages.includes(path) && next.pages.length < MAX_PAGES) next.pages.push(path);
  return next;
}

function readStored(): Attribution | null {
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Attribution>;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.pages)) return null;
    const out: Attribution = { pages: parsed.pages.filter((p): p is string => typeof p === "string").slice(0, MAX_PAGES) };
    for (const key of ["landing", "referrer", ...PARAMS] as const) {
      const v = parsed[key];
      if (typeof v === "string") out[key] = v.slice(0, key === "landing" ? MAX_PATH : MAX_VALUE);
    }
    return out;
  } catch {
    return null;
  }
}

/** Copy the in-memory record to sessionStorage, only with analytics consent. */
export function persistAttribution(): void {
  if (typeof window === "undefined" || readConsent() !== "granted") return;
  try {
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(state));
  } catch {
    /* memory still holds it */
  }
}

/** Remove the stored copy (after a refusal); the in-memory record stays for this tab. */
export function forgetStoredAttribution(): void {
  try {
    window.sessionStorage.removeItem(ATTRIBUTION_KEY);
  } catch {
    /* nothing stored */
  }
}

let started = false;

/** Record the current page. Call on first load and on every client-side navigation. */
export function captureVisit(): void {
  if (typeof window === "undefined") return;
  let referrer: string | undefined;
  if (!started) {
    started = true;
    if (readConsent() === "granted") {
      const stored = readStored();
      if (stored) state = stored;
    }
    referrer = referrerOrigin(document.referrer, window.location.origin);
  }
  state = mergeVisit(state, { pathname: window.location.pathname, search: window.location.search, referrer });
  persistAttribution();
}

/** Flat string fields for the Formspark payload (empty values omitted). */
export function attributionFields(a: Attribution = state): Record<string, string> {
  const out: Record<string, string> = {};
  if (a.landing) out.attr_landing_page = a.landing;
  if (a.referrer) out.attr_referrer = a.referrer;
  for (const key of PARAMS) {
    const v = a[key];
    if (v) out[`attr_${key}`] = v;
  }
  if (a.pages.length) out.attr_pages = a.pages.join(" > ");
  return out;
}

/** Test seam. */
export function resetAttributionForTests(): void {
  state = { pages: [] };
  started = false;
}
