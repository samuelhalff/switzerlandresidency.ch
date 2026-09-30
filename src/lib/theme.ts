/** Light/dark preference, persisted in localStorage; no key = follow the system. */
export type ThemePref = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "sr-theme";

/** Matches the `--bg` tokens in globals.css for each theme. */
export const THEME_COLORS: Record<"light" | "dark", string> = { light: "#f7f1e8", dark: "#1c1916" };

/**
 * Inline <head> script: applies the saved theme and the matching `theme-color` meta before
 * first paint (no flash). A manual choice wins over the OS preference; "system" (no saved
 * choice) follows prefers-color-scheme. Kept tiny and dependency-free; the CSP allows
 * 'unsafe-inline' scripts.
 */
export const themeInitScript =
  `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");` +
  `var dark=t==="dark"||(t!=="light"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);` +
  `if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);` +
  `var m=document.querySelector('meta[name="theme-color"]');` +
  `if(m)m.setAttribute("content",dark?"${THEME_COLORS.dark}":"${THEME_COLORS.light}");` +
  `}catch(e){}})();`;
