#!/usr/bin/env node
/**
 * Submit URLs to IndexNow (Bing, Yandex, Seznam, Naver…). Best effort: never exits non-zero
 * unless --strict is passed.
 *
 *   node scripts/indexnow.mjs --slug <guide-slug>        # EN/FR/DE guide + guides index pages
 *   node scripts/indexnow.mjs https://…/en/ https://…/fr/ # explicit URLs
 *
 * Key: INDEXNOW_KEY env, else the committed key file public/<32-hex>.txt (IndexNow keys are
 * public by design; the file must be deployed at the site root for the key to verify).
 * Site: NEXT_PUBLIC_SITE_URL (default https://switzerlandresidency.ch).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function findKey(root = ROOT, env = process.env) {
  if (env.INDEXNOW_KEY) return env.INDEXNOW_KEY.trim();
  const dir = path.join(root, "public");
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    const m = /^([a-f0-9]{8,128})\.txt$/i.exec(f);
    if (m && fs.readFileSync(path.join(dir, f), "utf8").trim() === m[1]) return m[1];
  }
  return null;
}

export function guideUrls(site, slug) {
  return ["en", "fr", "de"].flatMap((l) => [`${site}/${l}/guides/${slug}/`, `${site}/${l}/guides/`]);
}

async function main() {
  const args = process.argv.slice(2);
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://switzerlandresidency.ch").replace(/\/$/, "");
  const i = args.indexOf("--slug");
  const urls = i >= 0 ? guideUrls(site, args[i + 1]) : args.filter((a) => /^https?:\/\//.test(a));
  const strict = args.includes("--strict");
  const key = findKey();
  if (!key || !urls.length) {
    console.log(`IndexNow skipped (${!key ? "no key" : "no URLs"}).`);
    process.exit(strict ? 1 : 0);
  }
  const host = new URL(site).host;
  const body = JSON.stringify({ host, key, keyLocation: `${site}/${key}.txt`, urlList: urls });
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body,
      signal: AbortSignal.timeout(20000),
    });
    console.log(`IndexNow ${res.status} for ${urls.length} URL(s): ${(await res.text()).slice(0, 300)}`);
    if (strict && !(res.status >= 200 && res.status < 300)) process.exit(1);
  } catch (err) {
    console.log(`IndexNow error: ${err.message}`);
    if (strict) process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
