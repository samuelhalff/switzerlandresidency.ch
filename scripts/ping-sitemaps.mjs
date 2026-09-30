#!/usr/bin/env node
/**
 * Ping search engines with the sitemap URL (port of ark-fid.ch's scripts/ping-sitemaps.js).
 * Best effort, never fails: Google retired its ping endpoint in 2023 and Bing prefers IndexNow
 * (scripts/indexnow.mjs), so a 404/410 here is expected and only logged.
 *
 *   node scripts/ping-sitemaps.mjs [--url https://switzerlandresidency.ch] [--path /sitemap.xml]
 */
const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

const site = arg("--url", process.env.NEXT_PUBLIC_SITE_URL || "https://switzerlandresidency.ch").replace(/\/$/, "");
const sitemap = `${site}${arg("--path", "/sitemap.xml")}`;
const endpoints = [
  `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`,
  `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}`,
];

console.log(`Pinging sitemap ${sitemap}`);
for (const url of endpoints) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    console.log(`${res.ok ? "OK  " : "INFO"} ${new URL(url).host} → ${res.status}`);
  } catch (err) {
    console.log(`INFO ${new URL(url).host} → ${err.message}`);
  }
}
