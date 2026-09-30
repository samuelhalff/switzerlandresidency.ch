/**
 * Pure(ish) building blocks of the automated guide pipeline:
 * backlog + topic picker, allowed internal links, legal-facts excerpts, number normalisation
 * and parity, and the article guardrails. Used by scripts/ai-article.mjs and
 * scripts/validate-new-article.mjs; unit-tested in scripts/lib/article-pipeline.test.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { classifySource } from "./source-policy.mjs";

export const LOCALES = ["en", "fr", "de"];
const PRIORITY_DEFAULT = 9;

// ---------------------------------------------------------------------------
// Backlog and topic selection
// ---------------------------------------------------------------------------

export function loadBacklog(root) {
  return JSON.parse(fs.readFileSync(path.join(root, "content", "backlog.json"), "utf8"));
}

export function saveBacklog(root, backlog) {
  fs.writeFileSync(path.join(root, "content", "backlog.json"), `${JSON.stringify(backlog, null, 2)}\n`);
}

export function existingGuideSlugs(root, locale = "en") {
  const dir = path.join(root, "content", locale, "guides");
  if (!fs.existsSync(dir)) return new Set();
  return new Set(fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")));
}

/** Category of the most recently generated article (backlog history, newest last). */
export function lastGeneratedCategory(backlog) {
  const history = Array.isArray(backlog.history) ? backlog.history : [];
  if (history.length) return history[history.length - 1].category ?? null;
  const done = (backlog.items ?? []).filter((i) => i.status === "done" && i.doneAt);
  done.sort((a, b) => String(a.doneAt).localeCompare(String(b.doneAt)));
  return done.length ? done[done.length - 1].category : null;
}

/**
 * Pick the next topic.
 * - slugOverride: that item (any status except done-and-existing), bypassing priority and diversity.
 * - otherwise: status "todo", slug not already in content/en/guides, sorted by priority (1 first)
 *   then backlog order; never the same category as the last generated article unless every
 *   remaining candidate shares it (then the rule is relaxed and the reason says so).
 * @returns {{ item: object, reason: string } | null}
 */
export function pickTopic(backlog, { existingSlugs = new Set(), lastCategory = null, slugOverride = null } = {}) {
  const items = backlog.items ?? [];
  if (slugOverride) {
    const item = items.find((i) => i.slug === slugOverride);
    if (!item) throw new Error(`Slug override "${slugOverride}" is not in content/backlog.json`);
    if (existingSlugs.has(item.slug)) throw new Error(`Slug override "${slugOverride}" already exists in content/en/guides`);
    return { item, reason: "slug override" };
  }
  const candidates = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.status === "todo" && !existingSlugs.has(item.slug))
    .sort(
      (a, b) =>
        (Number(a.item.priority) || PRIORITY_DEFAULT) - (Number(b.item.priority) || PRIORITY_DEFAULT) || a.index - b.index,
    );
  if (!candidates.length) return null;
  const diverse = candidates.find(({ item }) => !lastCategory || item.category !== lastCategory);
  if (diverse) {
    const top = candidates[0];
    const reason =
      diverse === top
        ? `highest priority todo (P${diverse.item.priority})`
        : `highest priority todo outside last category "${lastCategory}" (P${diverse.item.priority}; skipped "${top.item.slug}")`;
    return { item: diverse.item, reason };
  }
  return { item: candidates[0].item, reason: `only "${lastCategory}" topics left; diversity rule relaxed` };
}

export function markDone(backlog, slug, { date, title } = {}) {
  const item = (backlog.items ?? []).find((i) => i.slug === slug);
  if (!item) throw new Error(`markDone: ${slug} not in backlog`);
  item.status = "done";
  item.doneAt = date;
  if (!Array.isArray(backlog.history)) backlog.history = [];
  backlog.history.push({ slug, category: item.category, date, title: title ?? item.title });
  return backlog;
}

export function validateBacklog(backlog, categories) {
  const errors = [];
  const seen = new Set();
  for (const [i, it] of (backlog.items ?? []).entries()) {
    const where = `items[${i}] (${it.slug ?? "?"})`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(it.slug ?? "")) errors.push(`${where}: slug must be lower-case-kebab`);
    if (seen.has(it.slug)) errors.push(`${where}: duplicate slug`);
    seen.add(it.slug);
    if (!it.title) errors.push(`${where}: missing title`);
    if (!["client", "adviser"].includes(it.audience)) errors.push(`${where}: audience must be client|adviser`);
    if (!categories.includes(it.category)) errors.push(`${where}: unknown category "${it.category}"`);
    if (!["todo", "done", "skipped"].includes(it.status)) errors.push(`${where}: status must be todo|done|skipped`);
    if (![1, 2, 3].includes(it.priority)) errors.push(`${where}: priority must be 1, 2 or 3`);
    for (const l of LOCALES) if (!Array.isArray(it.keywords?.[l])) errors.push(`${where}: keywords.${l} must be an array`);
    if (it.status === "todo" && !(it.keywords?.en?.length > 0)) errors.push(`${where}: todo item needs at least one EN keyword`);
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Categories and internal links
// ---------------------------------------------------------------------------

export function loadCategories(root) {
  const en = JSON.parse(fs.readFileSync(path.join(root, "src", "i18n", "en.json"), "utf8"));
  return Object.keys(en.guides.categories);
}

const COLLECTION_ROUTE = { guides: "guides", services: "services", cantons: "cantons", origins: "moving-from" };
const EXCLUDED_STATIC = new Set(["legal-notice", "privacy"]);

/** Static pages under app/[locale] (no dynamic segments), e.g. ["", "about", "guides", ...]. */
export function staticPagePaths(root) {
  const base = path.join(root, "app", "[locale]");
  const out = [];
  const walk = (dir, segs) => {
    if (fs.existsSync(path.join(dir, "page.tsx")) && !segs.some((s) => s.startsWith("["))) out.push(segs.join("/"));
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name.startsWith("[") || e.name.startsWith("(")) continue;
      if (segs.length === 0 && EXCLUDED_STATIC.has(e.name)) continue;
      walk(path.join(dir, e.name), [...segs, e.name]);
    }
  };
  if (fs.existsSync(base)) walk(base, []);
  return out.sort();
}

/**
 * Allowed internal URLs for one locale, generated from the content files (never a static list).
 * @returns {{ url: string, title: string, kind: string }[]}
 */
export function buildAllowedLinks(root, locale, { excludeSlug = null } = {}) {
  const links = staticPagePaths(root).map((p) => ({
    url: p ? `/${locale}/${p}/` : `/${locale}/`,
    title: p || "home",
    kind: "page",
  }));
  for (const [collection, route] of Object.entries(COLLECTION_ROUTE)) {
    const dir = path.join(root, "content", locale, collection);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md")).sort()) {
      const { data } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
      if (data.draft === true) continue;
      const slug = data.slug || f.replace(/\.md$/, "");
      if (collection === "guides" && slug === excludeSlug) continue;
      links.push({ url: `/${locale}/${route}/${slug}/`, title: String(data.title ?? slug), kind: collection });
    }
  }
  return links;
}

/** Markdown links in a body, split into internal (/...) and external (http...). */
export function extractLinks(body) {
  const internal = [];
  const external = [];
  for (const m of String(body).matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    const href = m[1];
    if (/^https?:\/\//i.test(href)) external.push(href);
    else if (href.startsWith("/")) internal.push(href);
  }
  return { internal, external };
}

// ---------------------------------------------------------------------------
// Legal facts (read at run time; UNVERIFIED sentences never reach the model)
// ---------------------------------------------------------------------------

export function splitSentences(text) {
  return String(text)
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?;])\s+(?=[A-Z("*\[])/))
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Remove every sentence that carries an UNVERIFIED marker. */
export function stripUnverified(text) {
  return String(text)
    .split("\n")
    .map((line) => {
      if (!/UNVERIFIED/i.test(line)) return line;
      const kept = line.split(/(?<=[.!?;])\s+(?=[A-Z("*\[])/).filter((s) => !/UNVERIFIED/i.test(s));
      const joined = kept.join(" ").trim();
      return /^[-*]?\s*$/.test(joined) ? null : joined;
    })
    .filter((l) => l !== null)
    .join("\n");
}

/** Sections of audit reports that hold verified facts (the rest quotes wrong claims being fixed). */
const AUDIT_FACT_SECTIONS = /^##\s+(missing topics worth a page|benchmark claims)/i;

/** Keep only the `## …` sections of a markdown file whose heading matches `re`. */
export function extractH2Sections(md, re) {
  const out = [];
  let keep = false;
  for (const line of String(md).split("\n")) {
    if (/^##\s/.test(line)) keep = re.test(line);
    if (keep) out.push(line);
  }
  return out.join("\n").trim();
}

/**
 * All fact sources, read at run time: research/legal-facts.md (whole file) plus the verified
 * sections of every research/audit-*.md report. Returned as one markdown document whose audit
 * part is appended under a "## Audit: …" heading so selectLegalFacts() can rank it.
 */
export function loadFactSources(root) {
  const dir = path.join(root, "research");
  let md = fs.readFileSync(path.join(dir, "legal-facts.md"), "utf8");
  const audits = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^audit-.*\.md$/.test(f)).sort() : [];
  for (const f of audits) {
    const part = extractH2Sections(fs.readFileSync(path.join(dir, f), "utf8"), AUDIT_FACT_SECTIONS);
    if (part) md += `\n\n${part.replace(/^##\s+/gm, `## Audit ${f.replace(/\.md$/, "")}: `)}\n`;
  }
  return md;
}

/** Split legal-facts.md into `###`/`##` sections. */
export function parseLegalFacts(md) {
  const sections = [];
  let parent = "";
  let current = null;
  for (const line of String(md).split("\n")) {
    const h2 = /^##\s+(.*)/.exec(line);
    const h3 = /^###\s+(.*)/.exec(line);
    if (h3 || h2) {
      if (current) sections.push(current);
      if (h2 && !h3) parent = h2[1].trim();
      current = { heading: (h3 ?? h2)[1].trim(), parent: h3 ? parent : "", lines: [line] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);
  return sections.map((s) => ({ heading: s.heading, parent: s.parent, text: s.lines.join("\n").trim() }));
}

const CATEGORY_SECTION_HINTS = {
  "lump-sum-taxation": [/lump-sum/i, /tax rulings?/i],
  "residence-permits": [/residence permits?/i, /registration/i, /family/i, /non-eu/i, /eu\/efta/i],
  "moving-from": [/residence permits?/i, /exit|uk|us\b|germany|france|italy/i, /competitor/i],
  property: [/property|lex koller|second-home|mortgage|transfer/i],
  "where-to-live": [/canton-by-canton|abolished/i, /wealth, capital gains/i, /settling/i],
  "settling-in": [/settling/i, /registration/i],
  "tax-and-wealth": [/wealth|inheritance|withholding/i, /tax rulings?/i, /exit|uk|us\b|germany|france/i],
};

const STOP = new Set(
  "the a an and or of to in on for with from your you is are how what when which who can do does be at by as it its into after before swiss switzerland suisse schweiz en de la le les des du et pour un une dans die der das und für mit von nach"
    .split(" "),
);
export const tokens = (s) =>
  String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));

/**
 * Legal-facts context for a topic: relevant sections first (category hints + keyword overlap),
 * then every other section, until maxChars. Always strips UNVERIFIED sentences.
 */
export function selectLegalFacts(md, topic, { maxChars = 100000 } = {}) {
  const intro = String(md).split(/\n##\s/)[0];
  const sections = parseLegalFacts(md).filter((s) => !/source documents/i.test(s.heading));
  const topicTokens = new Set(tokens([topic.title, ...(topic.keywords?.en ?? []), topic.slug.replace(/-/g, " ")].join(" ")));
  const hints = CATEGORY_SECTION_HINTS[topic.category] ?? [];
  const scored = sections.map((s, index) => {
    const head = `${s.parent} ${s.heading}`;
    let score = hints.some((h) => h.test(head)) ? 10 : 0;
    // New or benchmark sections (e.g. a verification pass) are always worth reading.
    if (/benchmark|verification|verified|correction|audit/i.test(head)) score += 8;
    const sTokens = tokens(s.text);
    for (const t of sTokens) if (topicTokens.has(t)) score += 0.2;
    return { ...s, index, score };
  });
  const ordered = [...scored].sort((a, b) => b.score - a.score || a.index - b.index);
  const out = [stripUnverified(intro).trim()];
  const relevant = [];
  let size = out[0].length;
  for (const s of ordered) {
    const text = stripUnverified(s.text);
    if (size + text.length > maxChars) continue;
    out.push(s.parent ? `<!-- ${s.parent} -->\n${text}` : text);
    size += text.length;
    if (s.score >= 2) relevant.push(s.heading);
  }
  return { text: out.join("\n\n"), relevantSections: relevant };
}

// ---------------------------------------------------------------------------
// Numbers: extraction, normalisation, parity
// ---------------------------------------------------------------------------

const NUM_TOKEN = /\d+(?:(?:[.,'’]|[    ](?=\d{3}(?!\d)))\d+)*/g;

/**
 * Normalise one numeric token to a canonical string.
 * Thousands separators: ' ’ space nbsp narrow-nbsp thin-space (any locale), comma (en only).
 * Decimal separator: dot (en) or comma (fr/de). Multi-dot references like "211.412.41" stay as-is.
 */
export function normalizeNumber(token, locale) {
  let t = String(token).replace(/['’    ]/g, "");
  if (locale === "en") {
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) t = t.replace(/,/g, "");
  } else if (/^\d+,\d+$/.test(t)) {
    t = t.replace(",", ".");
  } else if (/^\d{1,3}(,\d{3})+$/.test(t)) {
    // en-style thousands in a fr/de text: keep distinguishable so parity flags it
    return `?${t}`;
  }
  if (/^\d+(\.\d+)?$/.test(t)) return String(Number(t));
  return t;
}

/** Strip link targets, URLs, HTML comments and code so only prose numbers remain. */
export function proseOnly(text) {
  return String(text)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/https?:\/\/\S+/g, " ");
}

/**
 * Set of normalised numbers in a text. Bare integers 0–12 are ignored (they are often spelled out
 * in one language and not another); everything else — amounts, percentages, years, legal
 * references — must match across locales.
 */
export function extractNumbers(text, locale, { keepSmall = false } = {}) {
  const out = new Set();
  for (const m of proseOnly(text).matchAll(NUM_TOKEN)) {
    const n = normalizeNumber(m[0], locale);
    if (!keepSmall && /^\d+$/.test(n) && Number(n) <= 12) continue;
    out.add(n);
  }
  return out;
}

export function articleNumberText(article) {
  const faq = (article.data.faq ?? []).map((f) => `${f.q}\n${f.a}`).join("\n");
  return `${article.body}\n${faq}`;
}

const metaText = (article) => `${article.data.title ?? ""}\n${article.data.description ?? ""}`;

/** Compare the numeric facts of EN against each translation. Returns error strings. */
export function checkNumberParity(articles) {
  const errors = [];
  const en = extractNumbers(articleNumberText(articles.en), "en");
  for (const l of LOCALES.filter((x) => x !== "en")) {
    if (!articles[l]) continue;
    const other = extractNumbers(articleNumberText(articles[l]), l);
    const missing = [...en].filter((n) => !other.has(n));
    const extra = [...other].filter((n) => !en.has(n));
    if (missing.length) errors.push(`parity: ${l} is missing numbers present in en: ${missing.join(", ")}`);
    if (extra.length) errors.push(`parity: ${l} has numbers not in en: ${extra.join(", ")}`);
  }
  return errors;
}

const MONEY_OR_PERCENT = new RegExp(
  String.raw`(?:CHF|Fr\.|EUR|€|USD|US\$|\$|£|GBP|AED)\s?(${NUM_TOKEN.source})|(${NUM_TOKEN.source})\s?(?:%|percent\b|per cent\b|pour cent\b|Prozent\b|€|CHF\b|EUR\b|USD\b|GBP\b|AED\b|francs?\b|Franken\b|euros?\b|pounds?\b|dollars?\b)`,
  "gi",
);

/** Money amounts and percentages in a text (normalised). */
export function extractFigures(text, locale) {
  const out = new Set();
  for (const m of proseOnly(text).matchAll(MONEY_OR_PERCENT)) out.add(normalizeNumber(m[1] ?? m[2], locale));
  return out;
}

/** A currency amount in either order ("CHF 5,000" or "5 000 CHF"). */
const CURRENCY_AMOUNT =
  /(?:CHF|Fr\.|EUR|€|USD|\$|£|GBP|AED)\s?\d|\d[\d'’.,\u00a0\u202f ]*\s?(?:CHF|EUR|€|USD|GBP|AED|francs?|Franken|euros?|pounds?|dollars?)(?![\p{L}])/iu;

/** Numbers that legal-facts only mentions inside UNVERIFIED sentences. */
export function unverifiedOnlyNumbers(legalFactsMd) {
  const verified = extractNumbers(stripUnverified(legalFactsMd), "en", { keepSmall: true });
  const unverified = new Set();
  for (const s of splitSentences(legalFactsMd).filter((x) => /UNVERIFIED/i.test(x))) {
    for (const n of extractNumbers(s, "en")) {
      if (verified.has(n)) continue;
      if (/^(19|20)\d\d$/.test(n)) continue;
      unverified.add(n);
    }
  }
  return unverified;
}

// ---------------------------------------------------------------------------
// Guardrails
// ---------------------------------------------------------------------------

export function countWords(markdown) {
  const text = String(markdown)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/[#>*_|`[\]-]+/g, " ");
  return (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.,]*/gu) ?? []).length;
}

const PATTERNS = {
  keyFacts: { en: /key facts/i, fr: /points clés|l['’]essentiel/i, de: /das wichtigste|auf einen blick|eckdaten/i },
  howWeHelp: {
    en: /^##\s+how we help/im,
    fr: /^##\s+comment nous (vous )?aidons/im,
    de: /^##\s+(wie wir (ihnen |sie )?(helfen|unterstützen)|so (helfen|unterstützen) wir)/im,
  },
  disclaimer: {
    en: /general\s+information/i,
    fr: /informations?\s+générales?/i,
    de: /allgemeine\s+information(en)?/i,
  },
};

const CANTON_WORDS =
  "zurich|zürich|zuerich|bern|berne|lucerne|luzern|uri|schwyz|schwytz|obwalden|nidwalden|glarus|zug|zoug|fribourg|freiburg|solothurn|basel|bâle|schaffhausen|appenzell|st\\.? gallen|graubünden|grisons|aargau|thurgau|thurgovie|ticino|tessin|vaud|waadt|valais|wallis|neuchâtel|geneva|genève|genf|jura";
const QUALIFIER_WORDS = new RegExp(
  `(^|[^\\p{L}])(federal|fédéral\\p{L}*|bund\\p{L}*|canton\\p{L}*|kanton\\p{L}*|spouse\\p{L}*|conjoint\\p{L}*|ehe\\p{L}*|descendant\\p{L}*|nachkomm\\p{L}*|children|enfants|kinder\\p{L}*|${CANTON_WORDS})(?![\\p{L}])`,
  "iu",
);
/** Canton abbreviations are matched case-sensitively ("SO", "BE" — not "so", "be"). */
const CANTON_ABBR = /\b(ZH|BE|LU|UR|SZ|OW|NW|GL|ZG|FR|SO|BS|BL|SH|AR|AI|SG|GR|AG|TG|TI|VD|VS|NE|GE|JU)\b/;
const QUALIFIER = { test: (s) => QUALIFIER_WORDS.test(s) || CANTON_ABBR.test(s) };
const NEGATION =
  /\b(not|no|isn['’]t|rather than|instead of|unlike|myth|misconception|pas|aucun\w*|contrairement|nicht|kein\w*|anders als)\b|\bn['’]/i;

/** Rules applied sentence by sentence to every locale. */
export const CONTENT_RULES = [
  {
    id: "pricing",
    message: "pricing language (currency amount next to fee/price words)",
    test: (s) =>
      CURRENCY_AMOUNT.test(s) &&
      /(?<![\p{L}])(fees?|prices?|priced|pricing|honoraires|prix|émoluments?|gebühr\p{L}*|honorar\p{L}*|preis\p{L}*)(?![\p{L}])/iu.test(s),
  },
  {
    id: "our-fees",
    message: "mentions our fees/prices",
    test: (s) => /\b(our|my) (fees?|prices?|rates|pricing)\b|\bnos (honoraires|tarifs|prix)\b|\bunser\w* (honorar\w*|preis\w*|gebühr\w*|tarif\w*)/i.test(s),
  },
  { id: "email", message: "contains an email address", test: (s) => /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(s) },
  {
    id: "guarantee",
    message: "uses guarantee / garanti / garantiert",
    // "créances garanties par gage/hypothèque" is the statutory term in the control calculation (art. 14 LIFD)
    test: (s) =>
      /\bguarantee(s|d)?\b|\bguaranteeing\b|\bgaranti\w*|\bgarantier\w*/i.test(
        s.replace(/créances garanties par (des )?(hypothèques?|gages?)/gi, ""),
      ),
  },
  {
    id: "unverified",
    message: "contains an UNVERIFIED marker",
    test: (s) => /unverified|non[- ]vérifié|nicht verifiziert|unverifiziert/i.test(s),
  },
  {
    id: "183-days",
    message: '"183 days" presented as a Swiss residence test (Swiss rule: domicile or 30/90-day stay)',
    test: (s) => /\b183[\s-]*(days?|jours?|tage?n?|day)\b/i.test(s) && !NEGATION.test(s),
  },
  {
    id: "five-times-rent",
    message: '"5× rent" (the federal test is 7× rent or rental value)',
    test: (s) =>
      /\b(5|five|cinq|fünf)\s*(×|x|times|fois|-?fache\w*|mal)\s[^.]{0,40}(rent|rental|loyer|locative|miet)/i.test(s) ||
      /fünffach\w*\s+\w*miet/i.test(s),
  },
  {
    id: "residency-by-investment",
    message: '"residency by investment" (Switzerland has no such programme; say so explicitly or avoid the term)',
    test: (s) =>
      /residen(cy|ce)[- ]by[- ]investment|résidence par (l['’])?investissement|aufenthalt\w* (durch|gegen) investition|investoren(visum|programm)/i.test(s) &&
      !NEGATION.test(s),
  },
  {
    id: "minimum-tax-435",
    message: '"minimum tax of CHF 435,000" (CHF 435,000 is the minimum tax BASE, not the tax)',
    test: (s) =>
      /\bminimum (annual )?tax(es)?\b(?!\s*base)(?!able)[^.]{0,40}435|\btax(es)? of (at least |a minimum of )?CHF\s?435|impôt minimum[^.]{0,40}435|mindeststeuer[^.]{0,40}435/i.test(s),
  },
  {
    id: "no-inheritance-wealth-tax",
    message: 'unqualified "no inheritance tax" / "no wealth tax" (qualify: federal level, canton, spouse/descendants)',
    test: (s) =>
      (/\bno (inheritance|wealth|gift)( or (inheritance|wealth|gift))? tax(es)?\b|\b(does not|doesn['’]t) (have|levy) (an? )?(inheritance|wealth) tax/i.test(s) ||
        /\b(pas d['’]|aucun |sans )imp[ôo]t (sur la fortune|sur les successions|successoral)/i.test(s) ||
        /\bkeine (vermögens|erbschafts|schenkungs)steuer/i.test(s)) &&
      !QUALIFIER.test(s),
  },
];

export function checkContentRules(text) {
  const errors = [];
  for (const s of splitSentences(proseOnly(text))) {
    for (const rule of CONTENT_RULES) {
      if (rule.test(s)) errors.push(`${rule.id}: ${rule.message} — "${s.slice(0, 140)}"`);
    }
  }
  return errors;
}

const GENERIC_KW = new Set(["switzerland", "swiss", "suisse", "schweiz", "schweizer", "moving", "move"]);

function keywordCoverage(keyword, text) {
  const kw = tokens(keyword).filter((t) => !GENERIC_KW.has(t));
  if (!kw.length) return 1;
  const hay = new Set(tokens(text));
  return kw.filter((t) => hay.has(t) || [...hay].some((h) => h.startsWith(t.slice(0, 5)))).length / kw.length;
}

/**
 * Guardrails for one locale of the new guide.
 * @param {{ data: object, body: string }} article
 * @param {object} ctx { locale, slug, category, categories, allowedLinks: Set<string>, wordRange: [min,max] }
 */
export function checkArticle(article, ctx) {
  const { locale, slug, categories, allowedLinks } = ctx;
  const { data, body } = article;
  const errors = [];
  const e = (msg) => errors.push(`${locale}: ${msg}`);

  // Frontmatter completeness
  for (const f of ["title", "description", "slug", "translationKey", "collection", "category", "updated"]) {
    if (!data[f]) e(`frontmatter "${f}" missing`);
  }
  const updated = data.updated instanceof Date ? data.updated.toISOString().slice(0, 10) : data.updated;
  if (updated && !/^\d{4}-\d{2}-\d{2}$/.test(String(updated))) e(`"updated" must be YYYY-MM-DD`);
  if (data.slug !== slug || data.translationKey !== slug) e(`slug/translationKey must both be "${slug}"`);
  if (data.collection !== "guides") e(`collection must be "guides"`);
  if (!categories.includes(data.category)) e(`unknown category "${data.category}"`);
  if (ctx.category && data.category !== ctx.category) e(`category "${data.category}" differs from "${ctx.category}"`);
  if (data.draft !== false) e(`draft must be false`);
  const faq = Array.isArray(data.faq) ? data.faq : [];
  if (faq.length < 4 || faq.length > 6) e(`faq must have 4–6 items (has ${faq.length})`);
  faq.forEach((f, i) => (!f?.q || !f?.a) && e(`faq[${i}] needs q and a`));
  const kw = data.keywords;
  if (!kw || typeof kw.primary !== "string" || !kw.primary.trim()) e(`keywords.primary missing`);
  if (!Array.isArray(kw?.secondary) || kw.secondary.length < 5 || kw.secondary.length > 10 || kw.secondary.some((s) => typeof s !== "string" || !s.trim()))
    e(`keywords.secondary must be 5–10 strings`);

  // Meta lengths
  const title = String(data.title ?? "");
  const desc = String(data.description ?? "");
  if (title.length > 60) e(`title is ${title.length} chars (max 60)`);
  if (desc.length < 140 || desc.length > 155) e(`description is ${desc.length} chars (140–155)`);

  // Length
  const words = countWords(body);
  const [min, max] = ctx.wordRange ?? (locale === "en" ? [1100, 2000] : [950, 2400]);
  if (words < min || words > max) e(`body has ${words} words (${min}–${max})`);

  // Structure
  if (/^#\s/m.test(body)) e(`body must not contain an H1 (the page renders the title)`);
  const kfIdx = body.search(PATTERNS.keyFacts[locale]);
  if (kfIdx < 0 || kfIdx > body.length * 0.3) e(`"Key facts" box missing near the top`);
  const questionH2 = (body.match(/^##\s+[^\n]*\?\s*$/gm) ?? []).length;
  if (questionH2 < 2) e(`needs at least 2 question-style H2s (has ${questionH2})`);
  if (!PATTERNS.howWeHelp[locale].test(body)) e(`"How we help" section missing`);
  const lastLine = body.trim().split("\n").filter((l) => l.trim()).pop() ?? "";
  if (!PATTERNS.disclaimer[locale].test(lastLine)) e(`must end with the "general information" disclaimer line`);

  // Internal links
  const { internal, external } = extractLinks(body);
  const norm = (h) => {
    let p = h.split(/[?#]/)[0];
    if (!p.endsWith("/")) p += "/";
    return p;
  };
  const self = `/${locale}/guides/${slug}/`;
  const distinct = new Set();
  for (const href of internal) {
    const p = norm(href);
    if (!p.startsWith(`/${locale}/`)) e(`internal link "${href}" is not in /${locale}/`);
    else if (p === self) e(`links to itself`);
    else if (!allowedLinks.has(p)) e(`internal link "${href}" does not resolve to an existing page`);
    else distinct.add(p);
  }
  if (distinct.size < 3) e(`needs at least 3 distinct internal links (has ${distinct.size})`);
  if (![...distinct].some((p) => /\/(eligibility-check|contact)\/$/.test(p))) e(`needs a CTA link to eligibility-check or contact`);

  // Sources policy
  const sources = Array.isArray(data.sources) ? data.sources : [];
  let official = 0;
  sources.forEach((s, i) => {
    if (!s?.label || !/^https?:\/\//.test(s?.url ?? "")) return e(`sources[${i}] needs label and absolute url`);
    const c = classifySource(s.url);
    if (c === "official") official++;
    else if (c !== "institutional") e(`sources[${i}] ${s.url} is ${c} by the source policy`);
  });
  if (sources.length < 3) e(`needs at least 3 sources (has ${sources.length})`);
  if (official < 2) e(`needs at least 2 official sources (has ${official})`);
  for (const url of external) {
    const c = classifySource(url);
    if (c !== "official" && c !== "institutional") e(`body links to ${url} (${c} by the source policy)`);
  }

  // Wording rules
  const allText = `${title}\n${desc}\n${body}\n${faq.map((f) => `${f.q}\n${f.a}`).join("\n")}`;
  for (const err of checkContentRules(allText)) e(err);
  if (/\bTODO\b|lorem/i.test(allText)) e(`contains TODO/lorem`);

  // Keywords in the right places
  if (kw?.primary) {
    if (keywordCoverage(kw.primary, `${title} ${desc}`) < 0.5) e(`primary keyword "${kw.primary}" not reflected in title/description`);
    if (keywordCoverage(kw.primary, body) < 0.75) e(`primary keyword "${kw.primary}" not used in the body`);
    if (locale === "en" && keywordCoverage(kw.primary, slug.replace(/-/g, " ")) === 0)
      e(`slug "${slug}" shares no term with primary keyword "${kw.primary}"`);
  }
  return errors;
}

/** Cross-locale checks: same category/sources count/faq count, number parity, grounded figures. */
export function checkArticleSet(articles, { factsCorpus = "", unverifiedNumbers = new Set() } = {}) {
  const errors = [];
  const en = articles.en;
  for (const l of ["fr", "de"]) {
    const a = articles[l];
    if (!a) {
      errors.push(`${l}: translation missing`);
      continue;
    }
    if (a.data.category !== en.data.category) errors.push(`${l}: category differs from en`);
    if ((a.data.faq ?? []).length !== (en.data.faq ?? []).length) errors.push(`${l}: faq count differs from en`);
    if ((a.data.sources ?? []).length !== (en.data.sources ?? []).length) errors.push(`${l}: sources count differs from en`);
    const h2 = (b) => (b.match(/^##\s/gm) ?? []).length;
    if (h2(a.body) !== h2(en.body)) errors.push(`${l}: H2 count ${h2(a.body)} differs from en (${h2(en.body)})`);
  }
  errors.push(...checkNumberParity(articles));

  // Title/description may be phrased differently per language, but must not introduce figures
  // that the article itself does not contain.
  const enNumbers = extractNumbers(articleNumberText(en), "en");
  for (const l of LOCALES) {
    if (!articles[l]) continue;
    const extra = [...extractFigures(metaText(articles[l]), l)].filter((n) => !enNumbers.has(n));
    if (extra.length) errors.push(`${l}: title/description has figures not in the article: ${extra.join(", ")}`);
  }

  const text = `${articleNumberText(en)}\n${metaText(en)}`;
  if (factsCorpus) {
    const corpus = extractNumbers(factsCorpus, "en", { keepSmall: true });
    const ungrounded = [...extractFigures(text, "en")].filter((n) => !corpus.has(n));
    if (ungrounded.length) errors.push(`en: amounts/percentages not found in legal-facts or verified research: ${ungrounded.join(", ")}`);
  }
  const bad = [...extractNumbers(text, "en")].filter((n) => unverifiedNumbers.has(n));
  if (bad.length) errors.push(`en: uses numbers that legal-facts marks UNVERIFIED: ${bad.join(", ")}`);
  return errors;
}

// ---------------------------------------------------------------------------
// Serialisation
// ---------------------------------------------------------------------------

const q = (s) => JSON.stringify(String(s)); // JSON strings are valid YAML double-quoted scalars

/** Frontmatter in the same shape and order as the hand-written guides. */
export function serializeGuide(data, body) {
  const lines = [
    "---",
    `title: ${q(data.title)}`,
    `description: ${q(data.description)}`,
    `slug: ${q(data.slug)}`,
    `translationKey: ${q(data.translationKey)}`,
    `collection: guides`,
    `category: ${q(data.category)}`,
    `updated: ${q(data.updated)}`,
    `draft: false`,
    `keywords:`,
    `  primary: ${q(data.keywords.primary)}`,
    `  secondary:`,
    ...data.keywords.secondary.map((k) => `    - ${q(k)}`),
    `faq:`,
    ...data.faq.flatMap((f) => [`  - q: ${q(f.q)}`, `    a: ${q(f.a)}`]),
    `sources:`,
    ...data.sources.flatMap((s) => [`  - label: ${q(s.label)}`, `    url: ${q(s.url)}`]),
    "---",
    "",
  ];
  return `${lines.join("\n")}${String(body).trim()}\n`;
}

export function readGuide(root, locale, slug) {
  const file = path.join(root, "content", locale, "guides", `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const parsed = matter(fs.readFileSync(file, "utf8"));
  return { data: parsed.data, body: parsed.content, file };
}
