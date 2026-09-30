/** Light/dark preference, persisted in localStorage; no key = follow the system. */
export type ThemePref = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "sr-theme";

/**
 * Inline <head> script: applies the saved theme before first paint (no flash).
 * Kept tiny and dependency-free; the CSP allows 'unsafe-inline' scripts.
 */
export const themeInitScript =
  `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");` +
  `if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;
