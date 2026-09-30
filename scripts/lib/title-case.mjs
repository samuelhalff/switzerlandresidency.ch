/**
 * Deterministic casing normaliser for generated/translated guide frontmatter and body
 * headings (ESM port of ridger.ch's scripts/lib/titleCase.js).
 *
 * The AI pipeline occasionally copies a lowercase autocomplete keyword straight into
 * `title`/`description`, or lowercases an acronym mid-sentence when translating. This
 * module is a small, rule-based (no-LLM) fixer applied after generation/translation and
 * before the guardrails:
 *
 *   - capitalise the first letter of the string;
 *   - uppercase a whitelist of Swiss/legal acronyms, matched as whole words
 *     ("lpp" → "LPP", "avs" → "AVS");
 *   - capitalise known country names (Switzerland/Suisse/Schweiz, United Kingdom/
 *     Royaume-Uni, …);
 *   - never lowercase anything — German capitalises common nouns
 *     ("PK-Einkauf", "Pensionskasse") and this module must not undo that.
 *
 * It is intentionally dumb: it never rewords, reorders or removes text — only the casing
 * of existing characters can change. That keeps every replacement length-preserving and
 * safe to run on every locale, every time, with no LLM round-trip and no invariant to
 * verify.
 */

// Swiss/legal acronyms that must render in upper case as whole words.
// Matched case-insensitively, word-bounded; canonical display form given here.
export const ACRONYMS = [
  "LPP",
  "BVG",
  "AVS",
  "AHV",
  "LAMal",
  "KVG",
  "IFD",
  "DBG",
  "LIFD",
  "LHID",
  "StHG",
  "AIG",
  "LEI",
  "AFC",
  "ESTV",
  "SEM",
  "CHF",
  "EU",
  "UE",
  "EFTA",
  "AELE",
  "FZA",
  "ALCP",
  "UK",
  "US",
  "FIG",
  "TRF",
  "IHT",
  "FATCA",
];

// Proper nouns (country names) that must be capitalised whenever they occur.
export const COUNTRY_NAMES = [
  "Switzerland",
  "Suisse",
  "Schweiz",
  "United Kingdom",
  "Royaume-Uni",
  "Grossbritannien",
  "Großbritannien",
  "United States",
  "États-Unis",
  "Vereinigte Staaten",
  "Germany",
  "Allemagne",
  "Deutschland",
  "France",
  "Frankreich",
  "Italy",
  "Italie",
  "Italien",
  "Canada",
  "Kanada",
  "Portugal",
  "Spain",
  "Espagne",
  "Spanien",
  "Austria",
  "Autriche",
  "Österreich",
  "Dubai",
];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Capitalise the first alphabetic character of a string, leaving any leading
 * punctuation/whitespace/markdown markers (e.g. "## ", "### ") untouched.
 */
export function capitalizeFirst(str) {
  if (typeof str !== "string" || !str) return str;
  const m = str.match(/^([^A-Za-zÀ-ÖØ-öø-ÿ]*)([A-Za-zÀ-ÖØ-öø-ÿ])(.*)$/s);
  if (!m) return str;
  const [, lead, first, rest] = m;
  return lead + first.toUpperCase() + rest;
}

/** Uppercase every whole-word occurrence of a known Swiss/legal acronym. */
export function applyAcronyms(str) {
  if (typeof str !== "string" || !str) return str;
  let out = str;
  for (const acro of ACRONYMS) {
    const re = new RegExp(`\\b${escapeRegExp(acro)}\\b`, "gi");
    out = out.replace(re, acro);
  }
  return out;
}

/** Capitalise every whole-word occurrence of a known country name. */
export function applyCountryNames(str) {
  if (typeof str !== "string" || !str) return str;
  let out = str;
  for (const name of COUNTRY_NAMES) {
    const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, "gi");
    out = out.replace(re, name);
  }
  return out;
}

/**
 * Normalise a single title-like field (title, description, a FAQ question, an H2
 * heading, …) for any locale.
 *
 * Locale-agnostic by design: it only ever raises case, never lowers it, which already
 * satisfies "for DE don't lowercase anything" (German capitalises common nouns).
 */
export function normalizeTitleCasing(str) {
  if (typeof str !== "string" || !str) return str;
  let out = str;
  out = applyAcronyms(out);
  out = applyCountryNames(out);
  out = capitalizeFirst(out);
  return out;
}

// Matches a Markdown H2 heading: "## <text>" (not "###", not "#").
const H2_LINE_RE = /^(##)(?!#)(\s+)(.*)$/;

/**
 * Apply normalizeTitleCasing to the text of every "## …" H2 heading in a guide's
 * Markdown body. Non-heading lines (and H3+/H1 lines) are left untouched.
 */
export function normalizeH2Headings(body) {
  if (typeof body !== "string" || !body) return body;
  return body
    .split("\n")
    .map((line) => {
      const m = line.match(H2_LINE_RE);
      if (!m) return line;
      return `${m[1]}${m[2]}${normalizeTitleCasing(m[3])}`;
    })
    .join("\n");
}

/**
 * Normalise the casing-sensitive fields of a freshly generated/translated guide in
 * place: frontmatter `title`, `description`, every FAQ question (`faq[].q`), and every
 * H2 heading in `body`. Accepts either the `{ data, body }` shape used by this pipeline
 * (scripts/lib/article-pipeline.mjs) or a flat `{ title, description, faq, body, ... }`
 * record, and mutates + returns the same object for convenient chaining.
 */
export function normalizeArticleCasing(article) {
  if (!article || typeof article !== "object") return article;
  const data = article.data && typeof article.data === "object" ? article.data : article;
  if (typeof data.title === "string") data.title = normalizeTitleCasing(data.title);
  if (typeof data.description === "string") data.description = normalizeTitleCasing(data.description);
  if (Array.isArray(data.faq)) {
    for (const f of data.faq) {
      if (f && typeof f.q === "string") f.q = normalizeTitleCasing(f.q);
    }
  }
  if (typeof article.body === "string") article.body = normalizeH2Headings(article.body);
  return article;
}

/** True when `str` starts with a lowercase letter (the validator rule). */
export function startsWithLowercase(str) {
  if (typeof str !== "string" || !str) return false;
  const m = str.match(/^[^A-Za-zÀ-ÖØ-öø-ÿ]*([A-Za-zÀ-ÖØ-öø-ÿ])/);
  if (!m) return false;
  const ch = m[1];
  return ch === ch.toLowerCase() && ch !== ch.toUpperCase();
}
