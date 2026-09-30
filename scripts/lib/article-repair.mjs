/**
 * Targeted, rule-preserving repairs for the guide pipeline (scripts/ai-article.mjs), ported from
 * ridger.ch's scripts/lib/translationRepair.js. None of these helpers relaxes a guardrail: they
 * either drop something deterministically (sources that can never pass) or ask the model for a
 * narrow correction and accept the answer only when it passes the SAME checks as checkArticle.
 *
 *   - cleanSources(): drop sources that are relative/internal, malformed, outside the source
 *     policy or absent from the fact base. Never invents a replacement; if too few remain,
 *     checkArticle still reports it.
 *   - fitMetaFields(): title > 60 or description outside 140–155 → up to 3 small "rewrite to
 *     ≤ N characters, keep the keyword" calls with the rejected candidates fed back.
 *   - expectedLinks() / linkParity() / repairLinks(): every EN body link must survive translation
 *     (internal paths mapped to the locale); one targeted call puts dropped links back.
 *   - alignSourcesToEn(): translations keep the EN source URLs in the EN order.
 *   - requirementsBlock() / repairFeedback(): exact limits and errors for every retry prompt.
 *   - generateWithRepair(): the attempt loop; the final attempt escalates to the strong
 *     deployment when one is configured.
 *
 * The model is injected as `call(prompt, label) → Promise<object>` so tests can mock it.
 */
import { checkContentRules, countWords, extractFigures, keywordCoverage } from "./article-pipeline.mjs";
import { classifySource } from "./source-policy.mjs";
import { startsWithLowercase } from "./title-case.mjs";

// ---------------------------------------------------------------------------
// Limits (the same numbers checkArticle enforces)
// ---------------------------------------------------------------------------

export const META_LIMITS = {
  title: { min: 1, max: 60 },
  description: { min: 140, max: 155 },
};
export const MIN_SOURCES = 3;
export const MIN_OFFICIAL_SOURCES = 2;
export const MAX_SOURCES = 6;

const LANGUAGE = { en: "British English", fr: "Swiss French", de: "Swiss High German" };

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

/** Official/institutional URLs that appear in the fact base (the only citable ones). */
export function factBaseUrls(sourceText) {
  const out = new Set();
  for (const m of String(sourceText).matchAll(/https?:\/\/[^\s)<>"'`\]|]+/g)) {
    const url = m[0].replace(/[.,;:]+$/, "");
    const kind = classifySource(url);
    if (kind === "official" || kind === "institutional") out.add(url);
  }
  return [...out];
}

/**
 * Deterministic source clean-up before the guardrails. Drops (with a reason) every source that
 * can never pass: missing label, relative/internal or malformed URL, a domain outside the source
 * policy, a URL not present in the fact base, or a duplicate. Keeps the rest in order (max 6).
 * @returns {{ sources: {label: string, url: string}[], dropped: {source: object, reason: string}[] }}
 */
export function cleanSources(sources, { sourceText = "" } = {}) {
  const kept = [];
  const dropped = [];
  const seen = new Set();
  for (const s of Array.isArray(sources) ? sources : []) {
    const label = String(s?.label ?? "").trim();
    const url = String(s?.url ?? "").trim();
    const drop = (reason) => dropped.push({ source: { label, url }, reason });
    if (!/^https:\/\/[^\s/]+\.[^\s/]+/i.test(url)) {
      drop(url.startsWith("/") ? "internal/relative path" : "not an absolute https URL");
      continue;
    }
    try {
      new URL(url);
    } catch {
      drop("malformed URL");
      continue;
    }
    if (!label) {
      drop("missing label");
      continue;
    }
    const kind = classifySource(url);
    if (kind !== "official" && kind !== "institutional") {
      drop(`${kind} by the source policy`);
      continue;
    }
    if (sourceText && !sourceText.includes(url.split("#")[0])) {
      drop("not in the fact base");
      continue;
    }
    const key = url.split("#")[0].replace(/\/$/, "");
    if (seen.has(key)) {
      drop("duplicate");
      continue;
    }
    seen.add(key);
    kept.push({ label, url });
  }
  for (const s of kept.splice(MAX_SOURCES)) dropped.push({ source: s, reason: `more than ${MAX_SOURCES} sources` });
  return { sources: kept, dropped };
}

/**
 * Translations must cite exactly the EN URLs in the EN order: keep the translated label of each
 * EN URL when the model returned it, else fall back to the EN label.
 */
export function alignSourcesToEn(localeSources, enSources) {
  const list = Array.isArray(localeSources) ? localeSources : [];
  const labelOf = (s) => String(s?.label ?? "").trim();
  const urlOf = (s) => String(s?.url ?? "").trim();
  const enUrls = new Set(enSources.map((s) => s.url));
  // locale sources whose URL was mangled: their labels are reused, in order, for unmatched EN URLs
  const orphans = list.filter((s) => !enUrls.has(urlOf(s)) && labelOf(s));
  return enSources.map((en) => {
    const sameUrl = list.find((s) => urlOf(s) === en.url);
    return { label: labelOf(sameUrl) || labelOf(orphans.shift()) || en.label, url: en.url };
  });
}

// ---------------------------------------------------------------------------
// Title / description length fitting
// ---------------------------------------------------------------------------

/** Title/description outside the limits. */
export function metaProblems(data) {
  const out = [];
  for (const [field, lim] of Object.entries(META_LIMITS)) {
    const len = String(data?.[field] ?? "").trim().length;
    if (len < lim.min || len > lim.max) out.push({ field, length: len, min: lim.min, max: lim.max });
  }
  return out;
}

/**
 * Why a candidate title/description would fail checkArticle (null when it passes): length,
 * lowercase start, wording rules, lost primary keyword, figures the article does not contain.
 */
export function fieldMisfit(field, value, { primary = "", original = "", allowedNumbers = null, factIndex = null, locale = "en" } = {}) {
  const lim = META_LIMITS[field];
  const v = String(value ?? "").trim();
  if (!v) return "empty";
  if (v.length < lim.min || v.length > lim.max) return `${v.length} characters (allowed ${lim.min === 1 ? `≤ ${lim.max}` : `${lim.min}–${lim.max}`})`;
  if (startsWithLowercase(v)) return "starts with a lowercase letter";
  const rules = checkContentRules(v, { factIndex });
  if (rules.length) return `breaks a wording rule (${rules[0].split(":")[0]})`;
  if (primary) {
    const need = Math.min(0.5, keywordCoverage(primary, original));
    if (keywordCoverage(primary, v) < need) return `lost the primary keyword "${primary}"`;
  }
  if (allowedNumbers) {
    const extra = [...extractFigures(v, locale)].filter((n) => !allowedNumbers.has(n));
    if (extra.length) return `adds figures not in the article (${extra.join(", ")})`;
  }
  return null;
}

export function buildShortenPrompt({ locale, fields, primary, context = "" }) {
  const lines = fields.map((f) => {
    const verb = f.length > f.max ? `shorten to AT MOST ${f.max} characters` : `lengthen to AT LEAST ${f.min} characters`;
    const range = f.min > 1 ? `allowed range ${f.min}–${f.max} characters` : `maximum ${f.max} characters`;
    const rejected = (f.rejected ?? []).map((r) => `\n  Rejected earlier: ${JSON.stringify(r.value)} — ${r.reason}`).join("");
    return `- ${f.field} (currently ${f.length} characters): ${verb} — ${range}; keep the primary keyword "${primary}" (its words may be reordered or inflected, not dropped).\n  Current: ${JSON.stringify(f.value)}${rejected}`;
  });
  return [
    `Rewrite the following ${LANGUAGE[locale] ?? locale} metadata fields of a Swiss residence guide so that each fits its character limit.`,
    "Keep the meaning, the language and the calm, factual tone. Keep every number exactly; do not add facts or figures. No prices, no promises, no guarantees. Start with a capital letter.",
    "Count characters including spaces; aim a few characters inside the limit (title ≤ 57, description 145–152).",
    "",
    ...lines,
    context ? `\nArticle context (opening paragraph): ${context}` : "",
    "",
    `Output STRICT JSON with exactly these keys: ${JSON.stringify(Object.fromEntries(fields.map((f) => [f.field, ""])))}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/**
 * Ask for a shorter (or longer) title/description until both fit, max `rounds` calls. A
 * candidate is accepted only when fieldMisfit() finds nothing wrong with it.
 * @returns {Promise<{ data: object, fixed: string[], remaining: object[] }>}
 */
export async function fitMetaFields({ data, locale, primary, call, rounds = 3, context = "", allowedNumbers = null, factIndex = null, log = () => {} }) {
  let current = { ...data };
  const fixed = [];
  const rejected = {};
  for (let round = 1; round <= rounds; round++) {
    const bad = metaProblems(current).map((f) => ({ ...f, value: String(current[f.field] ?? ""), rejected: rejected[f.field] ?? [] }));
    if (!bad.length) break;
    log(`[fit-${locale}] ${bad.map((f) => `${f.field} ${f.length}→${f.length > f.max ? `≤${f.max}` : `≥${f.min}`}`).join(", ")} (round ${round}/${rounds})`);
    let out;
    try {
      out = await call(buildShortenPrompt({ locale, fields: bad, primary, context }), `shorten-${locale}#${round}`);
    } catch (err) {
      log(`[fit-${locale}] shorten call failed (${err.message})`);
      break;
    }
    for (const f of bad) {
      const v = typeof out?.[f.field] === "string" ? out[f.field].trim() : "";
      const reason = fieldMisfit(f.field, v, { primary, original: f.value, allowedNumbers, factIndex, locale });
      if (!reason) {
        current = { ...current, [f.field]: v };
        fixed.push(f.field);
      } else {
        (rejected[f.field] ??= []).push({ value: v, reason });
        log(`[fit-${locale}] ${f.field} candidate rejected (${reason}): ${JSON.stringify(v)}`);
      }
    }
  }
  return { data: current, fixed, remaining: metaProblems(current) };
}

// ---------------------------------------------------------------------------
// Link parity (translations)
// ---------------------------------------------------------------------------

const LINK_RE = /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g;
const normUrl = (u) => {
  if (!u.startsWith("/")) return u;
  const p = u.split("#")[0];
  return p.endsWith("/") ? p : `${p}/`;
};

function sentenceAround(body, index) {
  const s = String(body);
  const start = Math.max(s.lastIndexOf("\n", index), s.lastIndexOf(". ", index)) + 1;
  let end = s.indexOf("\n", index);
  if (end < 0) end = s.length;
  return s.slice(start, end).trim().slice(0, 400);
}

/** Every Markdown link of the EN body with its expected target in `locale` (/en/ → /<locale>/). */
export function expectedLinks(enBody, locale) {
  return [...String(enBody ?? "").matchAll(LINK_RE)].map((m) => {
    const href = m[2].trim();
    return {
      url: href.startsWith("/") ? normUrl(href.replace(/^\/en\//, `/${locale}/`)) : href,
      enAnchor: m[1].trim(),
      enSentence: sentenceAround(enBody, m.index),
    };
  });
}

/** Compare link targets (multiset) of a translated body with the expected ones. */
export function linkParity(expected, body) {
  const want = new Map();
  for (const e of expected) want.set(normUrl(e.url), (want.get(normUrl(e.url)) ?? 0) + 1);
  const have = new Map();
  for (const m of String(body ?? "").matchAll(LINK_RE)) {
    const u = normUrl(m[2].trim());
    have.set(u, (have.get(u) ?? 0) + 1);
  }
  const missing = [];
  const extra = [];
  for (const [url, n] of want) if ((have.get(url) ?? 0) < n) missing.push({ url, expected: n, actual: have.get(url) ?? 0 });
  for (const [url, n] of have) if (n > (want.get(url) ?? 0)) extra.push({ url, expected: want.get(url) ?? 0, actual: n });
  return { ok: !missing.length && !extra.length, missing, extra };
}

/** Headings, table rows and list items — must not change during a link repair. */
export const structureSignature = (body) =>
  [/^##\s/gm, /^###\s/gm, /^\s*\|/gm, /^\s*[-*]\s/gm].map((re) => (String(body).match(re) ?? []).length).join("/");

export function buildLinkRepairPrompt({ locale, body, expected, parity }) {
  const missing = new Set(parity.missing.map((m) => m.url));
  const places = expected.filter((e) => missing.has(normUrl(e.url)));
  const urls = [...new Set(expected.map((e) => normUrl(e.url)))];
  return [
    `The ${LANGUAGE[locale] ?? locale} translation below of an English guide lost or changed some Markdown links. Put them back.`,
    "",
    "RULES:",
    "- Return the SAME translated body; change nothing except the links (turn the matching words of the corresponding sentence into a Markdown link [anchor](url)). Do not add or remove headings, table rows, bullets, numbers or facts.",
    "- Use each URL exactly as given, character for character. Anchors are descriptive words in the target language (never \"here\").",
    `- Required link counts per URL in the final body (exactly): ${urls.map((u) => `${u} ×${expected.filter((e) => normUrl(e.url) === u).length}`).join(" ; ")}.`,
    parity.extra.length ? `- Remove these surplus links (keep the anchor text as plain text): ${parity.extra.map((x) => `${x.url} (has ${x.actual}, expected ${x.expected})`).join(" ; ")}.` : "",
    "",
    "MISSING LINKS — where they sit in the English original:",
    ...places.map((p, i) => `${i + 1}. url: ${p.url}\n   English anchor: "${p.enAnchor}"\n   English sentence: "${p.enSentence}"`),
    "",
    "TRANSLATED BODY:",
    body,
    "",
    'Output STRICT JSON: {"body": "<the full corrected Markdown body>"}',
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/**
 * One targeted call that restores dropped links. Returns the repaired body only when link parity
 * is then exact and the structure is unchanged; otherwise null (the caller keeps its body).
 */
export async function repairLinks({ locale, body, expected, call, log = () => {} }) {
  const parity = linkParity(expected, body);
  if (parity.ok) return { body, repaired: false };
  log(`[links-${locale}] parity off (missing ${parity.missing.map((m) => m.url).join(", ") || "none"}; surplus ${parity.extra.map((m) => m.url).join(", ") || "none"}) — targeted repair`);
  let out;
  try {
    out = await call(buildLinkRepairPrompt({ locale, body, expected, parity }), `links-${locale}`);
  } catch (err) {
    log(`[links-${locale}] repair call failed (${err.message})`);
    return null;
  }
  const repaired = String(out?.body ?? "").trim();
  if (!repaired) return null;
  const after = linkParity(expected, repaired);
  if (!after.ok || structureSignature(repaired) !== structureSignature(body)) {
    log(`[links-${locale}] repair rejected (${after.ok ? "structure changed" : `still off: ${[...after.missing, ...after.extra].map((m) => m.url).join(", ")}`})`);
    return null;
  }
  log(`[links-${locale}] links restored`);
  return { body: repaired, repaired: true };
}

// ---------------------------------------------------------------------------
// Prompt blocks
// ---------------------------------------------------------------------------

/**
 * Exact limits for every draft/translation prompt (and repeated with the errors on retries).
 * @param {{ locale: string, primary?: string, words: [number, number], sourceUrls?: string[],
 *   parity?: { h2: number, faq: number, sources: string[], links: string[] } }} o
 */
export function requirementsBlock({ locale, primary = "", words, sourceUrls = [], parity = null }) {
  const lines = [
    "HARD LIMITS (checked by a program; any miss = rejection):",
    `- title: at most ${META_LIMITS.title.max} characters, spaces included (aim ≤ ${META_LIMITS.title.max - 3})${primary ? `; contains "${primary}"` : ""}.`,
    `- description: ${META_LIMITS.description.min}–${META_LIMITS.description.max} characters, spaces included (aim 145–152)${primary ? `; contains "${primary}"` : ""}.`,
    `- body: ${words[0]}–${words[1]} words.`,
    "- guarantees: never promise one (no \"we guarantee\", \"guaranteed approval\"). A question or a clear negation is fine (\"Does company formation guarantee a permit?\", \"it does not guarantee a permit\").",
  ];
  if (parity) {
    lines.push(
      `- same structure as EN: ${parity.h2} H2 sections, ${parity.faq} FAQ items, ${parity.sources.length} sources with exactly these URLs in this order: ${parity.sources.join(" , ")}.`,
      `- body links (same count per URL as EN): ${parity.links.join(" , ") || "none"}.`,
    );
  } else {
    lines.push(
      `- sources: ${MIN_SOURCES}–${MAX_SOURCES} items, each {label, url} with an absolute https URL, at least ${MIN_OFFICIAL_SOURCES} official. Internal pages (/${locale}/…) are NEVER sources — link them in the body instead.`,
    );
    if (sourceUrls.length) lines.push(`- sources: copy URLs ONLY from this list (every other URL is rejected):\n${sourceUrls.map((u) => `  - ${u}`).join("\n")}`);
  }
  return lines.join("\n");
}

/** Measured state of a draft, so the model sees what is wrong in numbers. */
export function measure(article) {
  const t = String(article?.data?.title ?? "");
  const d = String(article?.data?.description ?? "");
  return `CURRENT MEASUREMENTS: title ${t.length} characters; description ${d.length} characters; body ${countWords(article?.body ?? "")} words; ${(article?.data?.sources ?? []).length} sources.`;
}

export function repairFeedback({ errors, requirements, previous, measured, what = "DRAFT" }) {
  return `YOUR PREVIOUS ${what} FAILED THESE CHECKS — fix every one and return the FULL corrected JSON (all fields, the whole body):
${errors.map((e) => `- ${e}`).join("\n")}
${measured ? `\n${measured}` : ""}

${requirements}

PREVIOUS ${what}:
${JSON.stringify(previous)}`;
}

// ---------------------------------------------------------------------------
// Models and the attempt loop
// ---------------------------------------------------------------------------

/**
 * The stronger deployment for the final attempt (AZURE_OPENAI_DEPLOYMENT_STRONG, optionally with
 * _API_VERSION_STRONG / _ENDPOINT_STRONG / _API_KEY_STRONG); null when not configured or equal to
 * the base deployment.
 */
export function strongConfig(cfg, env = process.env) {
  const deployment = String(env.AZURE_OPENAI_DEPLOYMENT_STRONG ?? "").trim();
  if (!deployment || deployment === cfg.deployment) return null;
  return {
    ...cfg,
    deployment,
    endpoint: env.AZURE_OPENAI_ENDPOINT_STRONG || cfg.endpoint,
    apiKey: env.AZURE_OPENAI_API_KEY_STRONG || cfg.apiKey,
    apiVersion: env.AZURE_OPENAI_API_VERSION_STRONG || cfg.apiVersion,
  };
}

/**
 * Attempt loop: generate → deterministic/targeted fixes → full check. Each retry gets the exact
 * errors (the caller builds the prompt from `feedback`); the last attempt uses `strongCfg` when
 * set, falling back to `baseCfg` if the strong call fails (missing deployment, empty reply, …).
 *
 * @param {{ attempts: number, label: string, baseCfg: object, strongCfg?: object|null,
 *   generate: (cfg: object, feedback: {errors: string[], previous: any, article: any}|null, attempt: number) => Promise<any>,
 *   finish: (out: any, cfg: object, attempt: number) => Promise<any>,
 *   check: (article: any) => Promise<string[]> | string[], log?: Function }} o
 */
export async function generateWithRepair({ attempts, label, baseCfg, strongCfg = null, generate, finish, check, log = () => {} }) {
  let feedback = null;
  let errors = [];
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const strong = Boolean(strongCfg) && attempts > 1 && attempt === attempts;
    let cfg = strong ? strongCfg : baseCfg;
    if (strong) log(`[${label}#${attempt}] final attempt escalated to ${strongCfg.deployment}`);
    let out;
    try {
      out = await generate(cfg, feedback, attempt);
    } catch (err) {
      if (!strong) throw err;
      log(`[${label}#${attempt}] strong deployment unavailable (${err.message.slice(0, 160)}); using ${baseCfg.deployment}`);
      cfg = baseCfg;
      out = await generate(cfg, feedback, attempt);
    }
    const article = await finish(out, cfg, attempt);
    errors = await check(article);
    if (!errors.length) return article;
    log(`[${label}#${attempt}] ${errors.length} issue(s):\n  - ${errors.join("\n  - ")}`);
    feedback = { errors, previous: out, article };
  }
  const err = new Error(`${label} failed guardrails after ${attempts} attempts:\n- ${errors.join("\n- ")}`);
  err.errors = errors;
  throw err;
}
