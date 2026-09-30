/**
 * Keyword and trend research for one topic (best effort — never throws, never fails a run).
 *
 * - Autocomplete per market: EN (GB, US, AE, SG), FR (CH, FR, BE), DE (CH, DE, AT), seeded with
 *   the backlog keywords plus question prefixes. Providers in fallback order: Google, Bing,
 *   DuckDuckGo (Google blocks datacenter IPs such as GitHub Actions runners).
 * - Pre-researched keywords (item.researchedKeywords, written by scripts/refresh-keywords.mjs from
 *   a normal machine) are used when live research yields no candidates; then the seeds.
 * - Trend signal: Google "trending now" RSS for CH/GB/FR/DE/AE, filtered to relocation/tax terms,
 *   plus a demand proxy (how many markets return suggestions for the seeds).
 * - deriveKeywords() turns raw suggestions into a primary + secondary set per locale
 *   (deterministic fallback; the writer model may refine the choice from the same candidates).
 */
import { tokens } from "./article-pipeline.mjs";

export const MARKETS = {
  en: [
    { hl: "en", gl: "gb" },
    { hl: "en", gl: "us" },
    { hl: "en", gl: "ae" },
    { hl: "en", gl: "sg" },
  ],
  fr: [
    { hl: "fr", gl: "ch" },
    { hl: "fr", gl: "fr" },
    { hl: "fr", gl: "be" },
  ],
  de: [
    { hl: "de", gl: "ch" },
    { hl: "de", gl: "de" },
    { hl: "de", gl: "at" },
  ],
};

const QUESTION_PREFIXES = {
  en: ["how", "can", "what"],
  fr: ["comment", "combien", "quel"],
  de: ["wie", "was", "kann"],
};

export const QUESTION_WORDS = {
  en: /^(how|what|can|is|are|do|does|why|which|when|who|should|will)\b/i,
  fr: /^(comment|combien|quel|quelle|quels|quelles|pourquoi|est-ce|peut-on|faut-il|qui|quand|où)\b/i,
  de: /^(wie|was|kann|welche|welcher|welches|wann|warum|wo|lohnt|muss|darf|wer|ist)\b/i,
};

const IRRELEVANT =
  /\b(mwst|tva|vat|iva|jobs?|stellen|emploi|salary|salaire|gehalt|lohn|reddit|pdf|wikipedia|meaning|traduction|übersetzung|translate|promis|celebrities|célébrités|calculator|calculateur|simulateur|rechner|youtube|forum)\b|permis de conduire|führerschein|fuehrerschein|driving licen[cs]e|driver'?s licen[cs]e/i;
/** Past years age badly ("… requirements 2024"); future years (e.g. "abolition 2029") are kept. */
export function hasStaleYear(keyword, now = new Date()) {
  const y = now.getUTCFullYear();
  return (String(keyword).match(/\b(19|20)\d{2}\b/g) ?? []).some((yr) => Number(yr) < y);
}
/** True for suggestions the pipeline never proposes (low intent, off-topic, stale). */
export function isJunkKeyword(k) {
  return IRRELEVANT.test(k) || FORBIDDEN.test(k) || hasStaleYear(k);
}
/** Phrases the guardrails forbid (see CONTENT_RULES) are never proposed as keywords. */
const FORBIDDEN = /by investment|par investissement|durch investition|183|guarantee|garanti/i;
/** A suggestion must be about Switzerland (or contain every distinctive term of the main seed). */
const SWISS = /suisse|swiss|switzerland|schweiz|svizzer|helvet|genève|geneva|genf|vaud|waadt|zurich|zürich|zug|zoug|ticino|tessin|valais|wallis|lugano|lausanne|lucerne|luzern|bern|graub|grisons|schwyz|thurgau|gstaad|verbier|st moritz|lex koller|forfait|pauschalbesteuerung|aufwandbesteuerung|ahv|avs/i;
const GENERIC = new Set(["switzerland", "swiss", "suisse", "schweiz", "how", "long", "get", "combien", "temps", "wie", "lange"]);

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function fetchText(url, { timeoutMs = 6000, fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { headers: { "User-Agent": UA, Accept: "*/*" }, signal: controller.signal, redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** Parse the OpenSearch suggestion shape `["query", ["s1", "s2", …]]` (Google firefox client, Bing osjson). */
export function parseOpenSearch(text) {
  const parsed = typeof text === "string" ? JSON.parse(text) : text;
  if (!Array.isArray(parsed) || !Array.isArray(parsed[1])) throw new Error("unexpected response");
  return parsed[1].map((s) => String(s).trim()).filter(Boolean);
}

/** Parse DuckDuckGo's `[{ "phrase": "…" }, …]`. */
export function parseDuckDuckGo(text) {
  const parsed = typeof text === "string" ? JSON.parse(text) : text;
  if (!Array.isArray(parsed)) throw new Error("unexpected response");
  return parsed.map((x) => String(x?.phrase ?? "").trim()).filter(Boolean);
}

/** Bing market code (en-GB, fr-CH, de-AT …). */
export function bingMarket({ hl, gl }) {
  return `${hl}-${gl.toUpperCase()}`;
}

/** DuckDuckGo region code (uk-en, ch-fr, de-de …); DDG uses "uk" for GB and "xa" for the Gulf. */
const DDG_COUNTRY = { gb: "uk", ae: "xa" };
export function ddgRegion({ hl, gl }) {
  return `${DDG_COUNTRY[gl] ?? gl}-${hl.split("-")[0]}`;
}

/**
 * Autocomplete providers in fallback order. Google suggestqueries blocks most datacenter IPs
 * (GitHub Actions runners get 403/429 or an HTML consent page), so Bing and DuckDuckGo are
 * tried when Google yields nothing for a locale.
 */
export const PROVIDERS = {
  google: {
    url: (q, { hl, gl }) =>
      "https://suggestqueries.google.com/complete/search?client=firefox&ie=UTF-8&oe=UTF-8" +
      `&hl=${encodeURIComponent(hl)}&gl=${encodeURIComponent(gl)}&q=${encodeURIComponent(q)}`,
    parse: parseOpenSearch,
  },
  bing: {
    url: (q, market) => `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(q)}&market=${encodeURIComponent(bingMarket(market))}`,
    parse: parseOpenSearch,
  },
  duckduckgo: {
    url: (q, market) => `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&kl=${encodeURIComponent(ddgRegion(market))}`,
    parse: parseDuckDuckGo,
  },
};
export const PROVIDER_ORDER = ["google", "bing", "duckduckgo"];

/** One provider request. Never throws: `{ suggestions, error }` where error is e.g. "HTTP 429", "timeout". */
export async function fetchProviderSuggestions(provider, query, market, opts = {}) {
  const p = PROVIDERS[provider];
  try {
    return { suggestions: p.parse(await fetchText(p.url(query, market), opts)), error: null };
  } catch (err) {
    const msg = err?.name === "AbortError" ? "timeout" : err instanceof SyntaxError ? "unparseable body" : String(err?.message ?? err);
    return { suggestions: [], error: msg.slice(0, 60) };
  }
}

/** Google autocomplete only (kept for callers/tests); [] on any failure. */
export async function fetchSuggestions(query, market, opts = {}) {
  return (await fetchProviderSuggestions("google", query, market, opts)).suggestions;
}

/** Summarise request errors per provider: "HTTP 429 ×10, timeout ×2 (en-GB, en-US)". */
export function summarizeErrors(rows) {
  const counts = new Map();
  const markets = new Set();
  for (const r of rows) {
    if (!r.error) continue;
    counts.set(r.error, (counts.get(r.error) ?? 0) + 1);
    markets.add(r.market);
  }
  if (!counts.size) return "";
  return `${[...counts].map(([e, n]) => `${e} ×${n}`).join(", ")} (${[...markets].join(", ")})`;
}

/** Run tasks with a small concurrency limit. */
async function pool(tasks, limit = 4) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Pure: rank suggestions for a locale.
 * @param {{ query: string, market: string, suggestions: string[] }[]} rows
 * @param {string[]} seeds backlog keywords for this locale
 */
export function deriveKeywords(rows, seeds, locale, { maxSecondary = 8 } = {}) {
  const seedTokens = new Set(seeds.flatMap((s) => tokens(s)));
  const distinctive = tokens(seeds[0] ?? "").filter((t) => !GENERIC.has(t));
  const score = new Map();
  for (const row of rows) {
    row.suggestions.forEach((s, rank) => {
      const k = s.toLowerCase().replace(/\s+/g, " ").trim();
      if (!k || k.length > 90 || isJunkKeyword(k)) return;
      const kTokens = new Set(tokens(k));
      if (!SWISS.test(k) && !(distinctive.length && distinctive.every((t) => kTokens.has(t)))) return;
      const overlap = tokens(k).filter((t) => seedTokens.has(t)).length;
      if (seedTokens.size && overlap === 0) return;
      const prev = score.get(k) ?? { keyword: k, score: 0, markets: new Set() };
      prev.score += 10 - Math.min(rank, 9) + overlap;
      prev.markets.add(row.market);
      score.set(k, prev);
    });
  }
  const ranked = [...score.values()]
    .map((x) => ({ keyword: x.keyword, score: x.score + x.markets.size * 5, markets: [...x.markets] }))
    .sort((a, b) => b.score - a.score || a.keyword.localeCompare(b.keyword));

  const primary = (seeds[0] ?? ranked[0]?.keyword ?? "").toLowerCase();
  const questions = ranked.filter((r) => QUESTION_WORDS[locale]?.test(r.keyword)).map((r) => r.keyword);
  const secondary = [];
  const push = (k) => {
    const v = String(k).toLowerCase().trim();
    if (v && v !== primary && !secondary.includes(v) && secondary.length < maxSecondary) secondary.push(v);
  };
  seeds.slice(1).forEach(push);
  questions.slice(0, 3).forEach(push);
  ranked.forEach((r) => push(r.keyword));
  return { primary, secondary, questions, candidates: ranked.slice(0, 30) };
}

const TREND_RELEVANT =
  /switzerland|swiss|suisse|schweiz|forfait|pauschal|lump[- ]sum|non[- ]dom|wealth tax|impôt|steuer|tax|permis|bewilligung|residen|lex koller|auswander|expat|inheritance|succession|erbschaft/i;

export async function fetchTrendSignal(geos = ["CH", "GB", "FR", "DE", "AE"], opts = {}) {
  const out = [];
  const errors = [];
  for (const geo of geos) {
    try {
      const xml = await fetchText(`https://trends.google.com/trending/rss?geo=${geo}`, { timeoutMs: 8000, ...opts });
      for (const item of xml.split(/<item>/i).slice(1)) {
        const title = /<title>([\s\S]*?)<\/title>/i.exec(item)?.[1]?.trim();
        const traffic = /<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/i.exec(item)?.[1]?.trim();
        if (title && TREND_RELEVANT.test(title)) out.push({ geo, title, traffic: traffic ?? "?" });
      }
    } catch (err) {
      errors.push(`${geo} ${err?.name === "AbortError" ? "timeout" : String(err?.message ?? err).slice(0, 40)}`); // best effort
    }
  }
  if (errors.length) opts.log?.(`[trends] ${errors.length}/${geos.length} feeds failed: ${errors.join(", ")}`);
  return out;
}

/** Spacing limiter: at most one request start every `minIntervalMs` (shared across workers). */
export function rateLimiter(minIntervalMs = 0) {
  let next = 0;
  return async () => {
    if (!minIntervalMs) return;
    const now = Date.now();
    const at = Math.max(now, next);
    next = at + minIntervalMs;
    if (at > now) await new Promise((r) => setTimeout(r, at - now));
  };
}

/**
 * Query providers in fallback order until one returns suggestions for this locale.
 * A provider whose every request failed is marked blocked (`state.blocked`) and skipped for later
 * locales. Errors are logged once per provider and locale. Never throws.
 */
export async function collectSuggestions(locale, queries, { fetchImpl, log = () => {}, state = { blocked: new Set() }, concurrency = 4, wait = async () => {}, providers = PROVIDER_ORDER } = {}) {
  const attempts = [];
  for (const provider of providers) {
    if (state.blocked.has(provider)) {
      attempts.push({ provider, skipped: true });
      continue;
    }
    const tasks = [];
    for (const market of MARKETS[locale]) {
      for (const query of queries) {
        tasks.push(async () => {
          await wait();
          const { suggestions, error } = await fetchProviderSuggestions(provider, query, market, { fetchImpl });
          return { provider, query, market: `${market.hl}-${market.gl.toUpperCase()}`, suggestions, error };
        });
      }
    }
    let rows = [];
    try {
      rows = await pool(tasks, concurrency);
    } catch {
      rows = [];
    }
    const count = rows.reduce((n, r) => n + r.suggestions.length, 0);
    const errors = summarizeErrors(rows);
    if (errors) log(`[keywords] ${locale}: ${provider} ${rows.filter((r) => r.error).length}/${rows.length} requests failed — ${errors}`);
    attempts.push({ provider, requests: rows.length, suggestions: count, errors: rows.filter((r) => r.error).length });
    if (rows.length && rows.every((r) => r.error)) state.blocked.add(provider);
    if (count > 0) return { provider, rows, attempts };
  }
  return { provider: null, rows: [], attempts };
}

/** Stored (pre-researched) keywords for a locale, shaped like deriveKeywords() output, or null. */
export function storedKeywords(item, locale) {
  const s = item?.researchedKeywords?.perLocale?.[locale];
  if (!s?.primary) return null;
  const secondary = (Array.isArray(s.secondary) ? s.secondary : []).map(String).filter(Boolean);
  const questions = (Array.isArray(s.questions) ? s.questions : []).map(String).filter(Boolean);
  const candidates = [...new Set([...secondary, ...questions])].map((keyword) => ({ keyword, score: 0, markets: ["stored"] }));
  return { primary: String(s.primary), secondary, questions, candidates };
}

/**
 * Full research for a backlog item. Returns per-locale keyword sets, the source used per locale
 * ("live:<provider>" | "stored <date>" | "seeds") and a trend summary.
 * Order: live suggestions when they yield candidates, else item.researchedKeywords (from
 * scripts/refresh-keywords.mjs), else the backlog seed keywords.
 * Never throws; `offline: true` skips the network (used by --dry-run without network and tests).
 */
export async function researchKeywords(
  item,
  { offline = false, fetchImpl, log = () => {}, useStored = true, trends = true, concurrency = 4, minIntervalMs = 0 } = {},
) {
  const result = { locales: {}, trends: [], demand: {}, sources: {} };
  const state = { blocked: new Set() };
  const wait = rateLimiter(minIntervalMs);
  for (const locale of ["en", "fr", "de"]) {
    const seeds = (item.keywords?.[locale] ?? []).filter(Boolean);
    const effectiveSeeds = seeds.length ? seeds : locale === "en" ? [item.title] : [];
    let rows = [];
    let provider = null;
    if (!offline && effectiveSeeds.length) {
      const core = effectiveSeeds[0];
      const queries = [...new Set([...effectiveSeeds.slice(0, 2), ...QUESTION_PREFIXES[locale].map((p) => `${p} ${core}`)])];
      ({ rows, provider } = await collectSuggestions(locale, queries, { fetchImpl, log, state, concurrency, wait }));
    }
    let derived = deriveKeywords(rows, effectiveSeeds, locale);
    let source = `live:${provider}`;
    if (!derived.candidates.length) {
      const stored = useStored ? storedKeywords(item, locale) : null;
      if (stored) {
        derived = stored;
        source = `stored ${item.researchedKeywords.date ?? "?"}`;
      } else {
        source = "seeds";
      }
    }
    result.locales[locale] = derived;
    result.sources[locale] = source;
    const marketsWithHits = new Set(rows.filter((r) => r.suggestions.length).map((r) => r.market));
    result.demand[locale] = {
      provider,
      marketsWithSuggestions: [...marketsWithHits],
      suggestionCount: rows.reduce((n, r) => n + r.suggestions.length, 0),
    };
    log(
      `[keywords] ${locale}: primary "${derived.primary}", ${derived.candidates.length} candidates from ${marketsWithHits.size} markets` +
        ` (source: ${source}${offline ? ", offline" : ""})`,
    );
  }
  if (!offline && trends) {
    try {
      result.trends = await fetchTrendSignal(undefined, { fetchImpl, log });
    } catch {
      result.trends = [];
    }
  }
  return result;
}
