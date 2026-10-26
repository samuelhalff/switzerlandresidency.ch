/** Banner choice. Before 2026-10 a "granted" here covered analytics only (see ADS_CONSENT_KEY). */
export const CONSENT_KEY = "sr-consent";
/** Advertising-signal choice, written with every banner choice since 2026-10. Absent = legacy choice. */
export const ADS_CONSENT_KEY = "sr-ads-consent";
export const CONSENT_EVENT = "sr:open-cookie-settings";
export type ConsentValue = "granted" | "denied";

/** EEA member states (EU + IS, LI, NO) plus the United Kingdom: opt-in regions. */
export const OPT_IN_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IE", "IT", "LV", "LI",
  "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB",
] as const;

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
    window.localStorage.setItem(ADS_CONSENT_KEY, value);
  } catch {
    /* storage unavailable: banner will simply show again next visit */
  }
}

/** The four Consent Mode v2 keys, all set to one value (used for banner updates). */
export function consentState(value: ConsentValue) {
  return { ad_storage: value, ad_user_data: value, ad_personalization: value, analytics_storage: value };
}

/**
 * Inline script for <head>, run before any other gtag call (Consent Mode v2, "advanced"):
 *  1. region defaults: EEA + UK all denied; CH analytics granted (opt-out), ad signals denied;
 *     rest of the world all granted (Google applies the most specific region match);
 *  2. a saved banner choice is applied synchronously as an update (no region), before config.
 *     A legacy "granted" (analytics-only banner, no ADS_CONSENT_KEY) grants analytics_storage
 *     only and leaves the ad keys at their region default; a refusal denies all four;
 *  3. gtag 'js' + 'config', then gtag.js is loaded on every page.
 * window.gtag exists from here on, so events before a choice are sent as cookieless pings
 * where storage is denied.
 */
export function consentBootstrapScript(gaId: string): string {
  const id = JSON.stringify(gaId);
  const regions = JSON.stringify(OPT_IN_REGIONS);
  return (
    "(function(){var w=window,D='denied',G='granted';w.dataLayer=w.dataLayer||[];" +
    "function g(){w.dataLayer.push(arguments);}w.gtag=g;" +
    `g('consent','default',{ad_storage:D,ad_user_data:D,ad_personalization:D,analytics_storage:D,region:${regions}});` +
    "g('consent','default',{ad_storage:D,ad_user_data:D,ad_personalization:D,analytics_storage:G,region:['CH']});" +
    "g('consent','default',{ad_storage:G,ad_user_data:G,ad_personalization:G,analytics_storage:G});" +
    `var c=null,a=null;try{c=w.localStorage.getItem(${JSON.stringify(CONSENT_KEY)});a=w.localStorage.getItem(${JSON.stringify(ADS_CONSENT_KEY)});}catch(e){}` +
    "if(c===G||c===D){var u={analytics_storage:c},d=(a===G||a===D)?a:(c===D?D:null);" +
    "if(d){u.ad_storage=d;u.ad_user_data=d;u.ad_personalization=d;}g('consent','update',u);}" +
    `g('js',new Date());g('config',${id});` +
    "var s=document.createElement('script');s.async=true;" +
    // A refusal made before gtag.js finished loading is processed after the earlier queued
    // config, which may already have set cookies: clean up once the tag has run.
    `s.onload=function(){var r=null;try{r=w.localStorage.getItem(${JSON.stringify(CONSENT_KEY)});}catch(e){}` +
    "if(r===D){try{var h=location.hostname,p=h.split('.'),ds=['',h,'.'+h];for(var i=1;i<p.length-1;i++)ds.push('.'+p.slice(i).join('.'));" +
    "document.cookie.split(';').forEach(function(k){var n=k.split('=')[0].trim();if(!/^(_ga(_|$)|_gid$|_gcl_)/.test(n))return;" +
    "ds.forEach(function(d){document.cookie=n+'=; Max-Age=0; path=/'+(d?'; domain='+d:'');});});}catch(e){}}};" +
    `s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(${id});` +
    "document.head.appendChild(s);})();"
  );
}

/** Best-effort removal of Google's first-party cookies (_ga, _ga_XXXX, _gid, _gcl_*) after a refusal. */
export function clearAnalyticsCookies(): void {
  try {
    const host = window.location.hostname;
    const parts = host.split(".");
    const domains = ["", host, "." + host];
    for (let i = 1; i < parts.length - 1; i++) domains.push("." + parts.slice(i).join("."));
    for (const raw of document.cookie.split(";")) {
      const name = raw.split("=")[0]?.trim();
      if (!name || !/^(_ga(_|$)|_gid$|_gcl_)/.test(name)) continue;
      for (const d of domains) {
        document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`;
      }
    }
  } catch {
    /* nothing to clean up */
  }
}
