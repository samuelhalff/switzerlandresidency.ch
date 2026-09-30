/**
 * Verification of research-model facts against the fetched official page.
 *
 * A fact is kept only if the model supplied a verbatim evidence quote that is found on the page
 * (after whitespace/typography normalisation), the quote contains the fact's key terms, and every
 * number in the claim appears in the quote with the same unit. Anything else is discarded — it
 * never reaches the prompt or the grounding corpus. Nothing here writes to research/legal-facts.md:
 * verified research only lives for one run (and in the run state file).
 */
import { buildFactIndex, extractNumbers, numberMentions, tokens } from "./article-pipeline.mjs";
import { classifySource } from "./source-policy.mjs";

const NAMED_ENTITIES = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  laquo: "«", raquo: "»", ndash: "–", mdash: "—", hellip: "…", shy: "", thinsp: " ", ensp: " ", emsp: " ",
  auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü", szlig: "ß", eacute: "é", egrave: "è",
  ecirc: "ê", euml: "ë", Eacute: "É", Egrave: "È", agrave: "à", acirc: "â", Agrave: "À", ccedil: "ç", Ccedil: "Ç",
  icirc: "î", iuml: "ï", ocirc: "ô", ucirc: "û", ugrave: "ù", oelig: "œ", euro: "€", pound: "£", sect: "§", deg: "°",
  times: "×", ordm: "º", ordf: "ª", middot: "·", bull: "•",
};

export function decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED_ENTITIES[n] ?? NAMED_ENTITIES[n.toLowerCase()] ?? m);
}
function safeCodePoint(n) {
  try {
    return String.fromCodePoint(n);
  } catch {
    return " ";
  }
}

/** Visible text of an HTML page (scripts, styles, comments and tags removed, entities decoded). */
export function htmlToText(html) {
  return decodeEntities(
    String(html)
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalisation used on both sides of the quote match: typography, spacing, case. */
export function normalizeForMatch(s) {
  return String(s ?? "")
    .normalize("NFKC")
    .replace(/[­​-‍﻿]/g, "")
    .replace(/[‘’‚‛′`´]/g, "'")
    .replace(/[“”„‟″«»]/g, '"')
    .replace(/[‐‑‒–—―−]/g, "-")
    .replace(/…/g, "...")
    .replace(/[\s   ]+/g, " ")
    .toLowerCase()
    .trim();
}

const EN_MARKERS = new Set(["the", "and", "of", "is", "are", "for", "with", "which", "must", "may", "from", "or", "at", "least", "to", "in", "on", "by", "a", "an", "be"]);
const FOREIGN_MARKERS = new Set([
  "der", "die", "das", "und", "ist", "für", "mit", "von", "den", "dem", "des", "ein", "eine", "nach", "bei", "wird", "werden", "sind", "oder",
  "le", "la", "les", "et", "est", "pour", "une", "un", "du", "dans", "par", "sur", "au", "aux", "sont", "ou", "qui",
]);
/** English unless the quote has more German/French function words than English ones. */
function looksEnglish(text) {
  const words = normalizeForMatch(text).split(/[^\p{L}']+/u);
  const en = words.filter((w) => EN_MARKERS.has(w)).length;
  const foreign = words.filter((w) => FOREIGN_MARKERS.has(w)).length;
  return en >= foreign;
}

/** Numbers of a text, read with every locale's separators (pages are EN, FR or DE). */
function numbersAnyLocale(text) {
  const out = new Set();
  for (const l of ["en", "fr", "de"]) for (const n of extractNumbers(text, l)) out.add(n);
  return out;
}

const QUOTE_MIN = 25;
const QUOTE_MAX = 800;

/**
 * @param {{ claim?: unknown, quote?: unknown, keyTerms?: unknown, url?: unknown }} fact
 * @param {string} pageText visible page text (htmlToText)
 * @returns {{ ok: true, fact: { claim: string, quote: string, keyTerms: string[], url: string } } | { ok: false, reason: string }}
 */
export function verifyResearchFact(fact, pageText) {
  const claim = String(fact?.claim ?? "").trim();
  const quote = String(fact?.quote ?? "").replace(/\s+/g, " ").trim();
  const url = String(fact?.url ?? "").trim();
  const keyTerms = (Array.isArray(fact?.keyTerms) ? fact.keyTerms : []).map((t) => String(t).trim()).filter(Boolean);
  if (!claim || !url) return { ok: false, reason: "missing claim or url" };
  if (classifySource(url) !== "official") return { ok: false, reason: "url is not an official source" };
  if (/unverified/i.test(`${claim} ${quote}`)) return { ok: false, reason: "carries an UNVERIFIED marker" };
  if (quote.length < QUOTE_MIN || quote.length > QUOTE_MAX) return { ok: false, reason: `evidence quote missing or not ${QUOTE_MIN}–${QUOTE_MAX} chars` };
  const nQuote = normalizeForMatch(quote);
  if (/\.\.\.|\[\s*\]/.test(nQuote)) return { ok: false, reason: "evidence quote is elided" };
  if (!normalizeForMatch(pageText).includes(nQuote)) return { ok: false, reason: "evidence quote not found verbatim on the page" };

  // Key terms: at least 2 substantive terms, each present in the quote.
  const substantive = keyTerms.filter((t) => normalizeForMatch(t).replace(/[^\p{L}\p{N}]/gu, "").length >= 4);
  if (substantive.length < 2) return { ok: false, reason: "needs at least 2 substantive key terms" };
  const missingTerm = substantive.find((t) => !nQuote.includes(normalizeForMatch(t)));
  if (missingTerm) return { ok: false, reason: `key term "${missingTerm}" is not in the quote` };

  // Numbers: every number in the claim is in the quote, and amounts/rates/durations keep their unit.
  const quoteNums = numbersAnyLocale(quote);
  const missingNum = [...extractNumbers(claim, "en")].find((n) => !quoteNums.has(n));
  if (missingNum) return { ok: false, reason: `number ${missingNum} is not in the quote` };
  const quoteIndex = buildFactIndex(quote);
  const unitMismatch = numberMentions(claim, "en").find(
    (m) => m.kind === "number" && m.unit !== "num" && !quoteIndex.pairs.has(`${m.unit}:${m.value}`),
  );
  if (unitMismatch) return { ok: false, reason: `"${unitMismatch.raw}" has a different unit in the quote` };

  // Same-language claims must also share their vocabulary with the quote.
  if (looksEnglish(quote)) {
    const words = tokens(claim).filter((t) => t.length > 3);
    const qTokens = new Set(tokens(quote));
    const overlap = words.length ? words.filter((w) => qTokens.has(w)).length / words.length : 0;
    if (overlap < 0.5) return { ok: false, reason: `claim shares only ${Math.round(overlap * 100)}% of its terms with the quote` };
  }
  return { ok: true, fact: { claim, quote, keyTerms: substantive, url } };
}

/**
 * Visible text of an official HTML page, or null (not fetchable, not HTML, timeout).
 * @param {string} url
 * @param {{ fetchImpl?: typeof fetch, timeoutMs?: number }} [opts]
 */
export async function fetchPageText(url, { fetchImpl = fetch, timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; switzerlandresidency-research-check/1.0)" },
    });
    if (!res.ok || !/html|text\/plain/i.test(res.headers.get("content-type") ?? "")) return null;
    return htmlToText((await res.text()).slice(0, 3_000_000));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Verify a batch of research facts; each URL is fetched once.
 * @returns {Promise<{ verified: object[], dropped: { claim: string, reason: string }[] }>}
 */
export async function verifyResearchFacts(facts, { fetchText = fetchPageText, max = 12 } = {}) {
  const verified = [];
  const dropped = [];
  const pages = new Map();
  for (const f of (Array.isArray(facts) ? facts : []).slice(0, max)) {
    const url = String(f?.url ?? "");
    if (classifySource(url) !== "official") {
      dropped.push({ claim: String(f?.claim ?? ""), reason: "url is not an official source" });
      continue;
    }
    if (!pages.has(url)) pages.set(url, await fetchText(url));
    const page = pages.get(url);
    if (!page) {
      dropped.push({ claim: String(f?.claim ?? ""), reason: "page not fetchable as HTML" });
      continue;
    }
    const r = verifyResearchFact(f, page);
    if (r.ok) verified.push(r.fact);
    else dropped.push({ claim: String(f?.claim ?? ""), reason: r.reason });
  }
  return { verified, dropped };
}
