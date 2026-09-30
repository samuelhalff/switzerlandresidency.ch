/**
 * Keyword and trend research for one topic (best effort — never throws, never fails a run).
 *
 * - Google autocomplete per market: EN (GB, US, AE, SG), FR (CH, FR, BE), DE (CH, DE, AT),
 *   seeded with the backlog keywords plus question prefixes.
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

const IRRELEVANT = /\b(mwst|tva|vat|iva|jobs?|stellen|emploi|salary|salaire|gehalt|lohn|reddit|pdf|wikipedia|meaning|traduction|übersetzung|translate)\b/i;
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

export async function fetchSuggestions(query, { hl, gl }, opts = {}) {
  const url =
    "https://suggestqueries.google.com/complete/search?client=firefox&ie=UTF-8&oe=UTF-8" +
    `&hl=${encodeURIComponent(hl)}&gl=${encodeURIComponent(gl)}&q=${encodeURIComponent(query)}`;
  try {
    const parsed = JSON.parse(await fetchText(url, opts));
    return Array.isArray(parsed?.[1]) ? parsed[1].map((s) => String(s).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
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
      if (!k || k.length > 90 || IRRELEVANT.test(k) || FORBIDDEN.test(k)) return;
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
  for (const geo of geos) {
    try {
      const xml = await fetchText(`https://trends.google.com/trending/rss?geo=${geo}`, { timeoutMs: 8000, ...opts });
      for (const item of xml.split(/<item>/i).slice(1)) {
        const title = /<title>([\s\S]*?)<\/title>/i.exec(item)?.[1]?.trim();
        const traffic = /<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/i.exec(item)?.[1]?.trim();
        if (title && TREND_RELEVANT.test(title)) out.push({ geo, title, traffic: traffic ?? "?" });
      }
    } catch {
      // best effort
    }
  }
  return out;
}

/**
 * Full research for a backlog item. Returns per-locale keyword sets and a trend summary.
 * Never throws; `offline: true` skips the network (used by --dry-run without network and tests).
 */
export async function researchKeywords(item, { offline = false, fetchImpl, log = () => {} } = {}) {
  const result = { locales: {}, trends: [], demand: {} };
  for (const locale of ["en", "fr", "de"]) {
    const seeds = (item.keywords?.[locale] ?? []).filter(Boolean);
    const effectiveSeeds = seeds.length ? seeds : locale === "en" ? [item.title] : [];
    let rows = [];
    if (!offline && effectiveSeeds.length) {
      const core = effectiveSeeds[0];
      const queries = [...new Set([...effectiveSeeds.slice(0, 2), ...QUESTION_PREFIXES[locale].map((p) => `${p} ${core}`)])];
      const tasks = [];
      for (const market of MARKETS[locale]) {
        for (const query of queries) {
          tasks.push(async () => ({
            query,
            market: `${market.hl}-${market.gl.toUpperCase()}`,
            suggestions: await fetchSuggestions(query, market, { fetchImpl }),
          }));
        }
      }
      try {
        rows = await pool(tasks, 4);
      } catch {
        rows = [];
      }
    }
    const derived = deriveKeywords(rows, effectiveSeeds, locale);
    result.locales[locale] = derived;
    const marketsWithHits = new Set(rows.filter((r) => r.suggestions.length).map((r) => r.market));
    result.demand[locale] = { marketsWithSuggestions: [...marketsWithHits], suggestionCount: rows.reduce((n, r) => n + r.suggestions.length, 0) };
    log(`[keywords] ${locale}: primary "${derived.primary}", ${derived.candidates.length} candidates from ${marketsWithHits.size} markets`);
  }
  if (!offline) {
    try {
      result.trends = await fetchTrendSignal(undefined, { fetchImpl });
    } catch {
      result.trends = [];
    }
  }
  return result;
}
