#!/usr/bin/env node
/**
 * Automated guide pipeline (EN canonical + FR + DE), modelled on ark-fid.ch's
 * scripts/ai-ressources-update.js.
 *
 *   node scripts/ai-article.mjs --dry-run [--slug <slug>] [--offline]
 *   node scripts/ai-article.mjs --apply   [--slug <slug>] [--offline]
 *
 * Steps: pick a backlog topic (content/backlog.json) → keyword & trend research (Google
 * autocomplete per market, trending RSS; best effort) → legal-facts excerpts (read at run time,
 * UNVERIFIED sentences removed) → optional research model for current developments (every fact
 * re-checked against the fetched official page) → outline → EN draft (repaired until the
 * guardrails pass) → FR and DE translations (one pass each, repaired on failure) → write files →
 * full guardrails incl. validate-content.mjs → mark the backlog item done.
 * --dry-run prints the topic and outline and writes nothing. Any failure exits non-zero and
 * leaves no article files behind.
 *
 * Env: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT, AZURE_OPENAI_API_VERSION
 * Optional: AZURE_OPENAI_RESEARCH_ENDPOINT / _DEPLOYMENT / _API_KEY / _API_VERSION (research model),
 *   AZURE_OPENAI_TRANSLATE_DEPLOYMENT, AI_ARTICLE_SLUG, AI_ARTICLE_ATTEMPTS (default 3),
 *   AI_ARTICLE_MAX_TOKENS (default 16000), AI_ARTICLE_DATE (YYYY-MM-DD), AI_ARTICLE_STATE,
 *   REFERENCE_ALLOWED_DOMAINS, LEGAL_FACTS_MAX_CHARS (default 100000 — the whole file today).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LOCALES,
  buildAllowedLinks,
  checkArticle,
  checkArticleSet,
  existingGuideSlugs,
  extractNumbers,
  lastGeneratedCategory,
  loadBacklog,
  loadCategories,
  loadFactSources,
  markDone,
  pickTopic,
  saveBacklog,
  selectLegalFacts,
  serializeGuide,
  stripUnverified,
  tokens,
  unverifiedOnlyNumbers,
  validateBacklog,
} from "./lib/article-pipeline.mjs";
import { researchKeywords } from "./lib/keyword-research.mjs";
import { chatJson, configFromEnv, hasConfig } from "./lib/azure-openai.mjs";
import { OFFICIAL_DOMAINS, INSTITUTIONAL_DOMAINS, classifySource } from "./lib/source-policy.mjs";
import { STATE_FILE, discardArticle, validateNewArticle } from "./validate-new-article.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const argValue = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};

const DRY = flag("--dry-run");
const APPLY = flag("--apply");
const OFFLINE = flag("--offline");
const ATTEMPTS = Math.max(1, parseInt(process.env.AI_ARTICLE_ATTEMPTS || "3", 10) || 3);
const MAX_TOKENS = parseInt(process.env.AI_ARTICLE_MAX_TOKENS || "16000", 10) || 16000;
const TODAY = process.env.AI_ARTICLE_DATE || new Date().toISOString().slice(0, 10);

const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
};
const [Y, M, D] = TODAY.split("-").map(Number);
const monthYear = (l) => `${MONTHS[l][M - 1]} ${Y}`;
const longDate = (l) => (l === "de" ? `${D}. ${MONTHS.de[M - 1]} ${Y}` : `${D} ${MONTHS[l][M - 1]} ${Y}`);

const log = (...a) => console.log(...a);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readDoc(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

/** CONTENT-GUIDE.md without its static URL list (the live list is generated from content files). */
function contentGuideForPrompt() {
  return readDoc("docs/CONTENT-GUIDE.md").replace(/## Allowed internal URLs[\s\S]*?(?=\n## )/, "");
}

function rankLinks(links, item) {
  const topic = new Set(tokens(`${item.title} ${(item.keywords?.en ?? []).join(" ")} ${item.category}`));
  return links
    .map((l) => ({ ...l, score: tokens(`${l.title} ${l.url}`).filter((t) => topic.has(t)).length }))
    .sort((a, b) => b.score - a.score);
}

async function urlStatus(url, timeoutMs = 12000) {
  for (const method of ["HEAD", "GET"]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; switzerlandresidency-link-check/1.0)" },
      });
      clearTimeout(timer);
      if (method === "HEAD" && [403, 405, 501].includes(res.status)) continue;
      return res.status;
    } catch {
      clearTimeout(timer);
      if (method === "GET") return 0;
    }
  }
  return 0;
}

/** Plain text of an HTML page (best effort), or null if not fetchable / not HTML. */
async function fetchPageText(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { redirect: "follow", signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok || !/html|text\/plain/i.test(res.headers.get("content-type") ?? "")) return null;
    const html = (await res.text()).slice(0, 3_000_000);
    return html
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ");
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function writeOutput(pairs) {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) return;
  for (const [k, v] of Object.entries(pairs)) fs.appendFileSync(out, `${k}<<__EOF__\n${String(v).replace(/\n/g, " ")}\n__EOF__\n`);
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

function hardRules(item) {
  const adviser = item.audience === "adviser";
  return `HARD RULES (automated guardrails reject the article otherwise):
- Audience: ${adviser ? "professional advisers (lawyers, tax advisers, wealth managers, relocation partners) briefing a client; peer-to-peer, precise, 'your client'" : "private individuals and families; warm, calm, reassuring"}. British spelling, sentence-case headings, short paragraphs, no exclamation marks.
- Facts: every legal/tax figure, threshold, date or rule must come from the FACT BASE below (legal-facts.md excerpts or verified research facts). Every CHF/€/£/$ amount and every percentage must appear in the fact base exactly. Write all figures as digits. If a fact is not in the fact base, do not state it (say "the canton decides" / "varies by canton; confirm in a ruling").
- Never: prices or fees of any kind; the words guarantee/guaranteed (not even negated — write "no certainty" or "the canton decides"); email addresses; the word UNVERIFIED; invented statistics, testimonials or client counts; links to ark-fid.ch or ridger.ch.
- Legal audit: never present "183 days" as a Swiss residence test (Swiss rule: domicile, or a stay of 30 days with gainful activity / 90 days without); never "5× rent" (the federal test is 7× rent or rental value); never "residency by investment" (Switzerland has no such programme); CHF 435,000 is the federal minimum tax BASE, never "a minimum tax"; never write "no inheritance tax"/"no wealth tax" without qualifying it (federal level, a named canton, spouses/descendants).
- Proposals must be labelled as proposals. Not advice: end with the disclaimer line.
- Commercial search terms: where the topic touches the move itself (relocation, settling in, cities, family logistics), use the terms people search for naturally in the title, H2s and FAQ: "relocation services", "relocation agency", "destination services", "moving to <city>". Never stuff keywords.
${item.notes ? `- Topic notes: ${item.notes}` : ""}`;
}

function structureRules(locale = "en") {
  return `STRUCTURE (exact):
1. Body starts with a 2–3 sentence paragraph that answers the core question directly and uses the primary keyword. No H1 in the body.
2. Then a bold line "**Key facts (as of ${monthYear("en")})**" followed by a 2-column Markdown table or 5–7 bullets of cited facts.
3. 5–8 H2 sections (## ...). At least 3 H2s are phrased as the questions people search (ending with "?"), using the secondary/question keywords. Use tables for comparisons.
4. 3–6 internal links, ONLY from the ALLOWED INTERNAL URLS list, exact paths with trailing slash, with descriptive keyword-rich anchor text (never "click here"). Never link to the article itself.
5. A "## How we help" section (2–4 sentences) ending with a link to /${locale}/eligibility-check/ or /${locale}/contact/.
6. The very last line is one italic sentence: "*This guide is general information as of ${longDate("en")} and is not tax or legal advice; your own situation needs a ruling or personal advice.*" (wording may vary slightly).
7. Length: 1,300–1,800 words of body (hard limits 1,100–2,000).
8. title ≤ 60 characters and contains the primary keyword; description 140–155 characters (count them), answers the query, contains the primary keyword.
9. faq: 4–6 items phrased like real search questions (use question keywords), concise factual answers consistent with the body.
10. sources: 3–6 items {label, url}, at least 2 official. Use ONLY URLs that appear in the FACT BASE. Allowed domains: ${OFFICIAL_DOMAINS.join(", ")} (official); ${INSTITUTIONAL_DOMAINS.join(", ")} (lifestyle only).`;
}

function factBase(facts, research) {
  const verified = research.length
    ? `\n\nVERIFIED RESEARCH FACTS (each re-checked on the fetched official page, ${TODAY}):\n${research.map((f) => `- ${f.claim} [${f.url}]`).join("\n")}`
    : "";
  return `FACT BASE — research/legal-facts.md and the verified sections of research/audit-*.md (UNVERIFIED items removed; most relevant sections first):\n${facts}${verified}`;
}

function keywordBrief(kw, locale) {
  const k = kw.locales[locale];
  const cands = k.candidates.slice(0, 25).map((c) => `${c.keyword} (${c.markets.join("/")})`);
  return `KEYWORD RESEARCH (${locale}, Google autocomplete ${Object.keys(kw.demand).length ? "per market" : ""}):
- Suggested primary: ${k.primary}
- Suggested secondary: ${k.secondary.join("; ")}
- Question keywords: ${k.questions.slice(0, 8).join("; ") || "(none found)"}
- Candidates: ${cands.join("; ") || "(none — network unavailable)"}`;
}

const ARTICLE_JSON = `Return ONLY a JSON object:
{"title": string, "description": string, "keywords": {"primary": string, "secondary": string[5..10]}, "faq": [{"q": string, "a": string}], "sources": [{"label": string, "url": string}], "body": string (Markdown)}`;

// ---------------------------------------------------------------------------
// Pipeline stages
// ---------------------------------------------------------------------------

async function runResearch(item, cfg) {
  const system = "You are a meticulous research assistant for Swiss residence and tax law. Output ONLY a JSON object.";
  const user = `Topic: "${item.title}" (category ${item.category}; keywords: ${(item.keywords?.en ?? []).join(", ")}).
List up to 10 current, specific facts (rules, thresholds, dates, recent changes or proposals in 2025–2026) that a guide on this topic needs, each with the exact official page URL where the fact is stated. Only these domains: ${OFFICIAL_DOMAINS.join(", ")}.
Prefer HTML pages over PDFs. Quote figures exactly as on the page. Label proposals as proposals.
Return {"facts": [{"claim": string, "url": string}]}`;
  let facts = [];
  try {
    const out = await chatJson(cfg, { system, user, maxTokens: 4000, label: "research" });
    facts = Array.isArray(out.facts) ? out.facts : [];
  } catch (err) {
    console.warn(`[research] skipped: ${err.message}`);
    return [];
  }
  const verified = [];
  for (const f of facts.slice(0, 12)) {
    if (!f?.claim || !f?.url || classifySource(f.url) !== "official") continue;
    const page = await fetchPageText(f.url);
    if (!page) continue;
    const pageNums = extractNumbers(page, "en", { keepSmall: true });
    for (const n of extractNumbers(page, "de", { keepSmall: true })) pageNums.add(n);
    const nums = [...extractNumbers(f.claim, "en", { keepSmall: true })];
    const words = tokens(f.claim).filter((t) => t.length > 3);
    const pageTokens = new Set(tokens(page));
    const overlap = words.length ? words.filter((w) => pageTokens.has(w)).length / words.length : 0;
    if (nums.every((n) => pageNums.has(n)) && overlap >= 0.4) verified.push({ claim: String(f.claim), url: String(f.url) });
    else log(`[research] dropped (not confirmed on page): ${String(f.claim).slice(0, 100)}`);
  }
  log(`[research] ${verified.length}/${facts.length} facts confirmed on official pages`);
  return verified;
}

async function makeOutline(item, ctx, cfg) {
  const system = `You plan SEO/GEO-optimised guides for switzerlandresidency.ch. Output ONLY a JSON object.\n\n${hardRules(item)}\n\n${structureRules("en")}`;
  const user = `Plan the EN guide "${item.title}" (slug ${item.slug}, category ${item.category}, intent ${item.intent}).
${keywordBrief(ctx.keywords, "en")}
TREND SIGNAL (best effort): ${ctx.trendSummary}

ALLOWED INTERNAL URLS (EN):\n${ctx.linkList}

${factBase(ctx.facts, ctx.research)}

Return {"title": string, "description": string, "primaryKeyword": string, "secondaryKeywords": string[], "h2": string[], "keyFacts": string[], "internalLinks": [{"url": string, "anchor": string}], "faqQuestions": string[], "sources": [{"label": string, "url": string}]}`;
  return chatJson(cfg, { system, user, maxTokens: 6000, label: "outline" });
}

function assemble(locale, item, out) {
  return {
    data: {
      title: String(out.title ?? "").trim(),
      description: String(out.description ?? "").trim(),
      slug: item.slug,
      translationKey: item.slug,
      collection: "guides",
      category: item.category,
      updated: TODAY,
      draft: false,
      keywords: {
        primary: String(out.keywords?.primary ?? "").trim(),
        secondary: (Array.isArray(out.keywords?.secondary) ? out.keywords.secondary : []).map((s) => String(s).trim()).filter(Boolean).slice(0, 10),
      },
      faq: (Array.isArray(out.faq) ? out.faq : []).map((f) => ({ q: String(f?.q ?? "").trim(), a: String(f?.a ?? "").trim() })),
      sources: (Array.isArray(out.sources) ? out.sources : []).map((s) => ({ label: String(s?.label ?? "").trim(), url: String(s?.url ?? "").trim() })),
    },
    body: String(out.body ?? "").trim(),
  };
}

/** Extra generator-only checks: sources must come from the fact base and resolve. */
async function sourceChecks(article, factText) {
  const errors = [];
  for (const s of article.data.sources) {
    const bare = s.url.split("#")[0];
    if (!factText.includes(bare)) errors.push(`en: source ${s.url} does not appear in the fact base (use only URLs given there)`);
    const kind = classifySource(s.url);
    if (kind !== "official" && kind !== "institutional") continue; // reported by checkArticle; never fetched
    const status = await urlStatus(s.url);
    if (status === 404 || status === 410) errors.push(`en: source ${s.url} returns HTTP ${status}`);
    else if (status === 0) console.warn(`[sources] could not reach ${s.url} (network) — not failing on this`);
  }
  return errors;
}

async function draftEnglish(item, ctx, cfg, outline) {
  const system = `You write SEO/GEO-optimised guides for switzerlandresidency.ch in British English. Output ONLY a JSON object.

CONTENT GUIDE (house rules):
${contentGuideForPrompt()}

${hardRules(item)}

${structureRules("en")}`;
  const base = `Write the EN guide "${item.title}" (slug ${item.slug}, category ${item.category}, intent ${item.intent}, audience ${item.audience}).
OUTLINE TO FOLLOW (you may refine it): ${JSON.stringify(outline)}
${keywordBrief(ctx.keywords, "en")}

ALLOWED INTERNAL URLS (EN):\n${ctx.linkList}

${factBase(ctx.facts, ctx.research)}

${ARTICLE_JSON}`;
  let previous = null;
  let errors = [];
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const user = previous
      ? `${base}\n\nYOUR PREVIOUS DRAFT FAILED THESE CHECKS — fix every one and return the full corrected JSON:\n${errors.map((e) => `- ${e}`).join("\n")}\n\nPREVIOUS DRAFT:\n${JSON.stringify(previous)}`
      : base;
    const out = await chatJson(cfg, { system, user, maxTokens: MAX_TOKENS, label: `draft-en#${attempt}` });
    const article = assemble("en", item, out);
    errors = [
      ...checkArticle(article, ctx.checkCtx("en")),
      ...checkArticleSet({ en: article }, { factsCorpus: ctx.factsCorpus, unverifiedNumbers: ctx.unverifiedNumbers }).filter((e) => e.startsWith("en:")),
      ...(await sourceChecks(article, ctx.factsCorpus)),
    ];
    if (!errors.length) return article;
    log(`[draft-en#${attempt}] ${errors.length} issue(s):\n  - ${errors.join("\n  - ")}`);
    previous = out;
  }
  throw new Error(`EN draft failed guardrails after ${ATTEMPTS} attempts:\n- ${errors.join("\n- ")}`);
}

async function translate(item, ctx, cfg, en, locale) {
  const language = locale === "fr" ? "Swiss French" : "Swiss High German";
  const system = `You are a native ${language} editor translating a guide for switzerlandresidency.ch. Output ONLY a JSON object.

TRANSLATION GUIDE:
${readDoc("docs/TRANSLATION-GUIDE.md")}

RULES (automated guardrails):
- Same structure as EN: same number of H2 sections, same tables, same FAQ count, same sources (identical URLs, translated labels only).
- Every number from EN stays a digit with the same value, formatted for ${locale} (${locale === "fr" ? '"CHF 435 000", decimal comma "1,25"' : "\"CHF 435'000\", decimal comma \"1,25\""}); never spell numbers out, never add or drop a figure.
- Internal links: replace /en/ with /${locale}/, paths otherwise unchanged.
- Key facts line: ${locale === "fr" ? `"**Points clés (${monthYear("fr")})**"` : `"**Das Wichtigste in Kürze (Stand ${monthYear("de")})**"`}; the help section heading: ${locale === "fr" ? '"## Comment nous vous aidons"' : '"## Wie wir helfen"'}; question H2s stay questions ending with "?".
- Last line: the italic disclaimer, dated ${longDate(locale)}.
- Keywords: choose a ${locale} primary keyword and 5–8 secondary keywords, preferring the ${locale} candidates below (real searches); if there are fewer than 5, add natural ${locale} variants of the backlog keywords people would type. Use the primary in the title, the description and the opening paragraph, and work secondary/question keywords into H2s and FAQ questions naturally.
- title ≤ 60 characters; description 140–155 characters (count them).
- Commercial terms where EN uses them: ${locale === "fr" ? '"services de relocation", "agence de relocation", "s\'installer en Suisse", "déménager à <ville>"' : '"Relocation Service", "Umzug in die Schweiz", "Umzug nach <Stadt>", "Auswandern Schweiz"'}.
- Never use: garanti/garantie/garantiert, prices or fees, email addresses, "UNVERIFIED"/"non vérifié"/"nicht verifiziert".`;
  const base = `${keywordBrief(ctx.keywords, locale)}

EN SOURCE (JSON):
${JSON.stringify({ title: en.data.title, description: en.data.description, keywords: en.data.keywords, faq: en.data.faq, sources: en.data.sources, body: en.body })}

${ARTICLE_JSON}`;
  const tcfg = { ...cfg, deployment: process.env.AZURE_OPENAI_TRANSLATE_DEPLOYMENT || cfg.deployment };
  let previous = null;
  let errors = [];
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const user = previous
      ? `${base}\n\nYOUR PREVIOUS TRANSLATION FAILED THESE CHECKS — fix every one and return the full corrected JSON:\n${errors.map((e) => `- ${e}`).join("\n")}\n\nPREVIOUS TRANSLATION:\n${JSON.stringify(previous)}`
      : base;
    const out = await chatJson(tcfg, { system, user, maxTokens: MAX_TOKENS, label: `translate-${locale}#${attempt}` });
    const article = assemble(locale, item, out);
    const enUrls = en.data.sources.map((s) => s.url).join("|");
    errors = [
      ...checkArticle(article, ctx.checkCtx(locale)),
      ...checkArticleSet({ en, [locale]: article }).filter((e) => e.startsWith(`${locale}:`) || e.startsWith(`parity: ${locale}`)),
      ...(article.data.sources.map((s) => s.url).join("|") !== enUrls ? [`${locale}: sources must keep the EN URLs in the same order`] : []),
    ];
    if (!errors.length) return article;
    log(`[translate-${locale}#${attempt}] ${errors.length} issue(s):\n  - ${errors.join("\n  - ")}`);
    previous = out;
  }
  throw new Error(`${locale.toUpperCase()} translation failed guardrails after ${ATTEMPTS} attempts:\n- ${errors.join("\n- ")}`);
}

function printOutline(item, reason, ctx, outline) {
  log(`\n=== Topic ===\n${item.title}\nslug: ${item.slug} · category: ${item.category} · audience: ${item.audience} · priority: P${item.priority}\nwhy: ${reason}`);
  for (const l of LOCALES) {
    const k = ctx.keywords.locales[l];
    log(`keywords ${l}: primary "${k.primary}" · secondary: ${k.secondary.join("; ")}`);
  }
  log(`trend signal: ${ctx.trendSummary}`);
  log(`legal-facts sections: ${ctx.relevantSections.join(" · ") || "(none matched)"}`);
  if (ctx.research.length) log(`verified research facts: ${ctx.research.length}`);
  log(`\n=== Outline${outline.model ? "" : " (template — no Azure OpenAI credentials, model outline skipped)"} ===`);
  log(`title: ${outline.title}`);
  if (outline.description) log(`description: ${outline.description}`);
  log(`opening: direct 2–3 sentence answer using "${outline.primaryKeyword}"`);
  log(`**Key facts (as of ${monthYear("en")})**${(outline.keyFacts ?? []).map((f) => `\n  - ${f}`).join("")}`);
  for (const h of outline.h2 ?? []) log(`## ${h}`);
  log(`## How we help → /en/eligibility-check/ or /en/contact/`);
  log(`internal links: ${(outline.internalLinks ?? []).map((l) => (typeof l === "string" ? l : `${l.url} ("${l.anchor}")`)).join(", ")}`);
  log(`faq: ${(outline.faqQuestions ?? []).join(" | ")}`);
  if (outline.sources?.length) log(`sources: ${outline.sources.map((s) => s.url).join(", ")}`);
}

function templateOutline(item, ctx) {
  const k = ctx.keywords.locales.en;
  const qs = k.questions.length ? k.questions : (item.keywords?.en ?? []).map((x) => `What should you know about ${x}?`);
  return {
    model: false,
    title: item.title,
    primaryKeyword: k.primary,
    keyFacts: ["5–7 cited facts from: " + (ctx.relevantSections.slice(0, 4).join(", ") || "legal-facts")],
    h2: qs.slice(0, 4).map((q) => (q.endsWith("?") ? q[0].toUpperCase() + q.slice(1) : `${q[0].toUpperCase()}${q.slice(1)}?`)),
    internalLinks: ctx.rankedLinks.slice(0, 6).map((l) => ({ url: l.url, anchor: l.title })),
    faqQuestions: qs.slice(0, 5),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (DRY === APPLY) {
    console.error("Usage: node scripts/ai-article.mjs (--dry-run | --apply) [--slug <slug>] [--offline]");
    process.exit(2);
  }
  const slugOverride = (argValue("--slug") || process.env.AI_ARTICLE_SLUG || "").trim() || null;
  if (slugOverride && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugOverride)) throw new Error(`Invalid slug override "${slugOverride}"`);

  const categories = loadCategories(ROOT);
  const backlog = loadBacklog(ROOT);
  const backlogErrors = validateBacklog(backlog, categories);
  if (backlogErrors.length) throw new Error(`content/backlog.json is invalid:\n- ${backlogErrors.join("\n- ")}`);

  const existing = existingGuideSlugs(ROOT);
  const picked = pickTopic(backlog, { existingSlugs: existing, lastCategory: lastGeneratedCategory(backlog), slugOverride });
  if (!picked) {
    log("ℹ️  Backlog has no todo topics left — nothing to do.");
    writeOutput({ generated: "false" });
    return;
  }
  const { item, reason } = picked;
  log(`🧭 Topic: ${item.slug} (${reason})`);

  // Research inputs
  const keywords = await researchKeywords(item, { offline: OFFLINE, log });
  const trendSummary = keywords.trends.length
    ? keywords.trends.slice(0, 8).map((t) => `${t.geo}: ${t.title} (${t.traffic})`).join("; ")
    : "no relevant trending searches today";
  const legalFacts = loadFactSources(ROOT); // legal-facts.md + verified audit sections, read at run time
  const { text: facts, relevantSections } = selectLegalFacts(legalFacts, item, {
    maxChars: parseInt(process.env.LEGAL_FACTS_MAX_CHARS || "100000", 10) || 100000,
  });
  const linksByLocale = Object.fromEntries(LOCALES.map((l) => [l, buildAllowedLinks(ROOT, l, { excludeSlug: item.slug })]));
  const rankedLinks = rankLinks(linksByLocale.en, item);
  const ctx = {
    keywords,
    trendSummary,
    facts,
    relevantSections,
    research: [],
    rankedLinks,
    linkList: linksByLocale.en.map((l) => `- ${l.url} — ${l.title}`).join("\n"),
    unverifiedNumbers: unverifiedOnlyNumbers(legalFacts),
    factsCorpus: stripUnverified(legalFacts),
    checkCtx: (locale) => ({
      locale,
      slug: item.slug,
      category: item.category,
      categories,
      allowedLinks: new Set(linksByLocale[locale].map((l) => l.url)),
    }),
  };

  const cfg = configFromEnv();
  if (!hasConfig(cfg)) {
    if (DRY) {
      printOutline(item, reason, ctx, templateOutline(item, ctx));
      log("\n(dry run: nothing written)");
      return;
    }
    throw new Error("Azure OpenAI is not configured (AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT, AZURE_OPENAI_API_VERSION).");
  }

  const rcfg = configFromEnv(process.env, "AZURE_OPENAI_RESEARCH");
  if (rcfg.endpoint && rcfg.deployment) {
    ctx.research = await runResearch(item, { ...rcfg, apiKey: rcfg.apiKey || cfg.apiKey, apiVersion: rcfg.apiVersion || cfg.apiVersion });
    ctx.factsCorpus += `\n${ctx.research.map((f) => `${f.claim} ${f.url}`).join("\n")}`;
  }

  const outline = await makeOutline(item, ctx, cfg);
  printOutline(item, reason, ctx, { ...outline, model: true });
  if (DRY) {
    log("\n(dry run: nothing written)");
    return;
  }

  // Generate
  const articles = { en: await draftEnglish(item, ctx, cfg, outline) };
  for (const locale of ["fr", "de"]) articles[locale] = await translate(item, ctx, cfg, articles.en, locale);

  // Write, then the full guardrails (incl. validate-content.mjs); discard on any failure.
  for (const locale of LOCALES) {
    const file = path.join(ROOT, "content", locale, "guides", `${item.slug}.md`);
    fs.writeFileSync(file, serializeGuide(articles[locale].data, articles[locale].body));
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify({ slug: item.slug, title: articles.en.data.title, date: TODAY, researchFacts: ctx.research }, null, 2));
  const result = validateNewArticle(item.slug, { root: ROOT, researchFacts: ctx.research });
  if (!result.ok) {
    discardArticle(item.slug, ROOT);
    throw new Error(`Guardrails failed; article discarded:\n- ${result.errors.join("\n- ")}`);
  }

  markDone(backlog, item.slug, { date: TODAY, title: articles.en.data.title });
  saveBacklog(ROOT, backlog);
  writeOutput({ generated: "true", slug: item.slug, title: articles.en.data.title });
  log(`✅ Wrote content/{en,fr,de}/guides/${item.slug}.md — "${articles.en.data.title}"`);
}

main().catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
