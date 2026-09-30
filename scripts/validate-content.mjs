#!/usr/bin/env node
/**
 * Build-time content & i18n validator (runs in `prebuild`).
 *
 * FAIL:
 *  - UI key parity: every key in en/fr/de JSON exists in the others (arrays compared by index), no empty strings
 *  - every t(locale, "key") literal in app/ and src/ resolves to a string in all locales
 *  - content frontmatter: required fields present and well-formed; guides use a known category
 *  - internal markdown links point to existing routes
 *  - no "TODO" / "lorem" in non-draft content
 * WARN:
 *  - a non-draft item is missing in a locale (matched by translationKey)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["en", "fr", "de"];
const COLLECTIONS = ["guides", "services", "cantons", "origins"];
/** app/[locale]/<dir>/[slug] → content collection */
const DIR_TO_COLLECTION = { guides: "guides", services: "services", cantons: "cantons", "moving-from": "origins" };

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for future non-fatal checks
const warn = (msg) => warnings.push(msg);

// ---------- 1. i18n key parity ----------
const dicts = Object.fromEntries(
  LOCALES.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, "src/i18n", `${l}.json`), "utf8"))]),
);

function flatten(obj, prefix = "", out = new Map()) {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  } else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out.set(prefix, obj);
  }
  return out;
}

const flat = Object.fromEntries(LOCALES.map((l) => [l, flatten(dicts[l])]));
for (const l of LOCALES) {
  for (const other of LOCALES) {
    if (other === l) continue;
    for (const key of flat[l].keys()) {
      if (!flat[other].has(key)) fail(`i18n: "${key}" exists in ${l}.json but is missing in ${other}.json`);
    }
  }
  for (const [key, value] of flat[l]) {
    if (typeof value !== "string" || value.trim() === "") fail(`i18n: "${key}" in ${l}.json is empty or not a string`);
  }
}

// ---------- 2. t() literal keys used in code ----------
function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!/node_modules|\.next/.test(p)) walk(p, acc);
    } else if (/\.(tsx?|jsx?|mjs)$/.test(e.name) && !/\.test\./.test(e.name)) {
      acc.push(p);
    }
  }
  return acc;
}

const lookup = (obj, key) => key.split(".").reduce((cur, k) => (cur && typeof cur === "object" ? cur[k] : undefined), obj);
// t(locale, "a.b") / t(en, 'a.b') / t(r.locale, `a.b`) — the first argument can be any identifier path.
const tCall = /\bt\(\s*[A-Za-z_$][\w$.]*\s*,\s*["'`]([A-Za-z0-9_.-]+)["'`]\s*\)/g;
// Keys passed to staticMetadata(path, titleKey, descriptionKey) and image altKey values are checked too.
let tCount = 0;
for (const file of [...walk(path.join(ROOT, "app")), ...walk(path.join(ROOT, "src"))]) {
  const src = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);
  const keys = new Set();
  for (const m of src.matchAll(tCall)) keys.add(m[1]);
  for (const m of src.matchAll(/staticMetadata\(\s*["'`][^"'`]*["'`]\s*,\s*["'`]([^"'`]+)["'`]\s*,\s*["'`]([^"'`]+)["'`]/g)) {
    keys.add(m[1]);
    keys.add(m[2]);
  }
  for (const m of src.matchAll(/altKey:\s*["'`]([^"'`]+)["'`]/g)) keys.add(m[1]);
  for (const key of keys) {
    tCount++;
    for (const l of LOCALES) {
      if (typeof lookup(dicts[l], key) !== "string") fail(`i18n: ${rel} uses key "${key}" which is missing in ${l}.json`);
    }
  }
}

// ---------- 3. content ----------
const categories = Object.keys(dicts.en.guides.categories);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const content = []; // { locale, collection, slug, data, body, file }

for (const locale of LOCALES) {
  for (const collection of COLLECTIONS) {
    const dir = path.join(ROOT, "content", locale, collection);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md"))) {
      const file = path.join(dir, f);
      const rel = path.relative(ROOT, file);
      let parsed;
      try {
        parsed = matter(fs.readFileSync(file, "utf8"));
      } catch (e) {
        fail(`content: ${rel} has invalid frontmatter (${e.message})`);
        continue;
      }
      const data = parsed.data;
      const updated = data.updated instanceof Date ? data.updated.toISOString().slice(0, 10) : data.updated;
      const slug = data.slug || f.replace(/\.md$/, "");

      // category drives the guide filters; other collections don't use it
      const required = ["title", "description", "translationKey", "updated"];
      if (collection === "guides") required.push("category");
      for (const field of required) {
        if (!data[field]) fail(`content: ${rel} is missing frontmatter "${field}"`);
      }
      if (updated && !ISO.test(String(updated))) fail(`content: ${rel} "updated" must be YYYY-MM-DD`);
      if (slug !== f.replace(/\.md$/, "")) fail(`content: ${rel} slug "${slug}" must match the file name`);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail(`content: ${rel} slug "${slug}" must be lower-case-kebab`);
      if (collection === "guides" && slug === "category") fail(`content: ${rel} slug "category" is reserved`);
      if (collection === "guides" && data.category && !categories.includes(data.category)) {
        fail(`content: ${rel} category "${data.category}" is not one of: ${categories.join(", ")}`);
      }
      if (!Array.isArray(data.sources)) fail(`content: ${rel} "sources" must be an array of {label, url}`);
      else
        data.sources.forEach((s, i) => {
          if (!s?.label || !/^https?:\/\//.test(s?.url ?? "")) fail(`content: ${rel} sources[${i}] needs label and absolute url`);
        });
      // optional SEO keywords (written by the article pipeline; emitted in Article JSON-LD)
      if (data.keywords !== undefined) {
        const kw = data.keywords;
        if (!kw || typeof kw.primary !== "string" || !kw.primary.trim()) fail(`content: ${rel} keywords.primary must be a non-empty string`);
        if (!Array.isArray(kw?.secondary) || kw.secondary.some((k) => typeof k !== "string" || !k.trim()))
          fail(`content: ${rel} keywords.secondary must be an array of non-empty strings`);
      }
      if (data.faq !== undefined) {
        if (!Array.isArray(data.faq)) fail(`content: ${rel} "faq" must be an array of {q, a}`);
        else data.faq.forEach((q, i) => (!q?.q || !q?.a) && fail(`content: ${rel} faq[${i}] needs q and a`));
      }
      content.push({ locale, collection, slug, data, body: parsed.content, file: rel, draft: data.draft === true });
    }
  }
}

// translation completeness (fail): every published page exists in all locales,
// unless its frontmatter sets `singleLocale: true` (e.g. a France-only FR article)
const byKey = new Map();
for (const c of content.filter((x) => !x.draft)) {
  const k = `${c.collection}:${c.data.translationKey}`;
  if (!byKey.has(k)) byKey.set(k, new Set());
  byKey.get(k).add(c.locale);
}
for (const [k, locs] of byKey) {
  const missing = LOCALES.filter((l) => !locs.has(l));
  const single = content.some((c) => `${c.collection}:${c.data.translationKey}` === k && c.data.singleLocale === true);
  if (missing.length && !single) fail(`content: ${k} has no published version in: ${missing.join(", ")}`);
}
// duplicate translationKey within one locale
const seen = new Set();
for (const c of content) {
  const k = `${c.locale}:${c.collection}:${c.data.translationKey}`;
  if (seen.has(k)) fail(`content: duplicate translationKey "${c.data.translationKey}" in ${c.locale}/${c.collection}`);
  seen.add(k);
}

// no TODO / lorem in published content
for (const c of content.filter((x) => !x.draft)) {
  const text = `${JSON.stringify(c.data)}\n${c.body}`;
  if (/\bTODO\b/.test(text)) fail(`content: ${c.file} contains "TODO"`);
  if (/lorem/i.test(text)) fail(`content: ${c.file} contains "lorem"`);
}

// ---------- 4. internal links ----------
// Routes are derived from the app/[locale] tree so they never drift from the real pages.
const routes = new Set(["/"]);
const localeDir = path.join(ROOT, "app", "[locale]");
function collectRoutes(dir, segs) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const next = [...segs, e.name];
    const sub = path.join(dir, e.name);
    if (fs.existsSync(path.join(sub, "page.tsx"))) {
      for (const locale of LOCALES) {
        for (const p of expand(next, locale)) routes.add(`/${locale}/${p.join("/")}/`);
      }
    }
    collectRoutes(sub, next);
  }
}
function expand(segs, locale) {
  let acc = [[]];
  segs.forEach((s, i) => {
    let values = [s];
    if (s === "[slug]") {
      const coll = DIR_TO_COLLECTION[segs[i - 1]];
      values = content.filter((c) => c.collection === coll && c.locale === locale).map((c) => c.slug);
    } else if (s === "[category]") {
      values = Object.keys(dicts[locale].guides.categories);
    } else if (s.startsWith("(")) {
      values = [null];
    }
    acc = acc.flatMap((a) => values.map((v) => (v === null ? a : [...a, v])));
  });
  return acc;
}
for (const l of LOCALES) routes.add(`/${l}/`);
collectRoutes(localeDir, []);
for (const extra of ["/sitemap.xml", "/robots.txt", "/llms.txt"]) routes.add(extra);

const linkRe = /\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
for (const c of content) {
  for (const m of c.body.matchAll(linkRe)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:|#)/.test(href)) continue;
    if (!href.startsWith("/")) {
      fail(`links: ${c.file} uses relative link "${href}" — use an absolute path like /${c.locale}/guides/…/`);
      continue;
    }
    let p = href.split(/[?#]/)[0];
    if (!/\.[a-z0-9]+$/i.test(p) && !p.endsWith("/")) p += "/";
    if (p.startsWith("/images/") || p.startsWith("/downloads/")) {
      if (!fs.existsSync(path.join(ROOT, "public", p))) fail(`links: ${c.file} links to missing file ${href}`);
      continue;
    }
    if (!routes.has(p)) fail(`links: ${c.file} links to "${href}", which is not a route`);
  }
}

// UI strings: internal "[label](/path/)" links (legal/privacy text) must resolve, and no email
// addresses anywhere — every written enquiry goes through the contact form (Formspark).
for (const l of LOCALES) {
  for (const [key, value] of flat[l]) {
    if (typeof value !== "string") continue;
    if (/[\w.+-]+@[\w-]+\.[\w.]+|mailto:/i.test(value)) fail(`i18n: "${key}" in ${l}.json contains an email address — use the contact form`);
    for (const m of value.matchAll(linkRe)) {
      let p = m[1].split(/[?#]/)[0];
      if (!p.startsWith("/")) continue;
      if (!/\.[a-z0-9]+$/i.test(p) && !p.endsWith("/")) p += "/";
      if (!routes.has(p)) fail(`links: "${key}" in ${l}.json links to "${m[1]}", which is not a route`);
    }
  }
}

// ---------- report ----------
for (const w of warnings) console.warn(`⚠️  ${w}`);
if (errors.length) {
  console.error(`\n❌ Content validation failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✅ Content valid: ${flat.en.size} UI keys × ${LOCALES.length} locales, ${tCount} code key references, ${content.length} content files (${content.filter((c) => c.draft).length} drafts), ${routes.size} routes.`,
);
