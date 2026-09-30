import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import {
  buildAllowedLinks,
  checkArticle,
  checkArticleSet,
  checkContentRules,
  checkNumberParity,
  countWords,
  extractFigures,
  extractNumbers,
  isQueryShaped,
  lastGeneratedCategory,
  loadBacklog,
  loadCategories,
  markDone,
  normalizeNumber,
  pickTopic,
  rawKeywordIssues,
  searchMetaIssues,
  selectLegalFacts,
  serializeGuide,
  stripUnverified,
  unverifiedOnlyNumbers,
  validateBacklog,
} from "./article-pipeline.mjs";
import { fixtureArticle } from "./test-fixture.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const LEGAL = fs.readFileSync(path.join(ROOT, "research", "legal-facts.md"), "utf8");
const categories = loadCategories(ROOT);

const item = (slug, category, priority, status = "todo") => ({ slug, category, priority, status, title: slug });

describe("topic picker", () => {
  const backlog = {
    items: [
      item("a-p2", "property", 2),
      item("b-p1", "lump-sum-taxation", 1),
      item("c-p1", "residence-permits", 1),
      item("d-done", "settling-in", 1, "done"),
      item("e-skip", "settling-in", 1, "skipped"),
    ],
  };

  it("picks the highest-priority todo in backlog order", () => {
    expect(pickTopic(backlog).item.slug).toBe("b-p1");
  });

  it("skips slugs that already exist", () => {
    expect(pickTopic(backlog, { existingSlugs: new Set(["b-p1"]) }).item.slug).toBe("c-p1");
  });

  it("never picks the same category twice in a row", () => {
    const r = pickTopic(backlog, { lastCategory: "lump-sum-taxation" });
    expect(r.item.slug).toBe("c-p1");
    expect(r.reason).toMatch(/outside last category/);
  });

  it("relaxes the diversity rule when only one category is left", () => {
    const r = pickTopic({ items: [item("x", "property", 2), item("y", "property", 3)] }, { lastCategory: "property" });
    expect(r.item.slug).toBe("x");
    expect(r.reason).toMatch(/relaxed/);
  });

  it("returns null when nothing is left", () => {
    expect(pickTopic({ items: [item("d", "property", 1, "done")] })).toBeNull();
  });

  it("honours a slug override and rejects unknown or existing ones", () => {
    expect(pickTopic(backlog, { slugOverride: "a-p2", lastCategory: "property" }).item.slug).toBe("a-p2");
    expect(() => pickTopic(backlog, { slugOverride: "nope" })).toThrow(/not in content\/backlog.json/);
    expect(() => pickTopic(backlog, { slugOverride: "a-p2", existingSlugs: new Set(["a-p2"]) })).toThrow(/already exists/);
  });

  it("marks done and remembers the last category", () => {
    const b = structuredClone(backlog);
    markDone(b, "c-p1", { date: "2026-10-01", title: "C" });
    expect(b.items.find((i) => i.slug === "c-p1")).toMatchObject({ status: "done", doneAt: "2026-10-01" });
    expect(lastGeneratedCategory(b)).toBe("residence-permits");
    expect(pickTopic(b, { lastCategory: lastGeneratedCategory(b) }).item.slug).toBe("b-p1");
  });

  it("the real backlog is valid, broad and has no existing slugs as todo", () => {
    const b = loadBacklog(ROOT);
    expect(validateBacklog(b, categories)).toEqual([]);
    expect(b.items.length).toBeGreaterThanOrEqual(60);
    expect(new Set(b.items.map((i) => i.category)).size).toBe(categories.length);
    expect(new Set(b.items.map((i) => i.audience))).toEqual(new Set(["client", "adviser"]));
  });
});

describe("allowed internal links", () => {
  it("is generated from content files and static pages, per locale", () => {
    const en = buildAllowedLinks(ROOT, "en").map((l) => l.url);
    expect(en).toEqual(expect.arrayContaining(["/en/", "/en/eligibility-check/", "/en/contact/", "/en/guides/swiss-lump-sum-taxation/", "/en/cantons/geneva/", "/en/moving-from/united-kingdom/", "/en/services/tax-ruling/"]));
    expect(en).not.toContain("/en/privacy/");
    expect(en.every((u) => u.startsWith("/en/") && u.endsWith("/"))).toBe(true);
    const fr = buildAllowedLinks(ROOT, "fr").map((l) => l.url);
    expect(fr).toContain("/fr/guides/swiss-lump-sum-taxation/");
  });

  it("can exclude the article being written", () => {
    const en = buildAllowedLinks(ROOT, "en", { excludeSlug: "geneva-or-vaud" }).map((l) => l.url);
    expect(en).not.toContain("/en/guides/geneva-or-vaud/");
  });
});

describe("legal facts", () => {
  it("strips UNVERIFIED sentences but keeps the verified part of a line", () => {
    const md = "- Verified rule A applies. Some detail — **UNVERIFIED**.\n- Fully **UNVERIFIED** line.\n- Clean line.";
    const out = stripUnverified(md);
    expect(out).toContain("Verified rule A applies.");
    expect(out).not.toMatch(/UNVERIFIED/);
    expect(out).toContain("Clean line.");
  });

  it("selects the category's sections first and never passes UNVERIFIED text", () => {
    const { text, relevantSections } = selectLegalFacts(LEGAL, { slug: "swiss-mortgage", title: "Swiss mortgage", category: "property", keywords: { en: ["mortgage"] } });
    expect(text).not.toMatch(/UNVERIFIED/);
    expect(relevantSections.join(" ")).toMatch(/Lex Koller|Mortgage/i);
  });

  it("finds figures that only exist as UNVERIFIED", () => {
    const n = unverifiedOnlyNumbers(LEGAL);
    expect(n.has("750")).toBe(true);
    expect(n.has("435000")).toBe(false);
  });
});

describe("number normalisation and parity", () => {
  it.each([
    ["435,000", "en", "435000"],
    ["435 000", "fr", "435000"],
    ["435 000", "fr", "435000"],
    ["435'000", "de", "435000"],
    ["435’000", "de", "435000"],
    ["1.25", "en", "1.25"],
    ["1,25", "fr", "1.25"],
    ["1,25", "de", "1.25"],
    ["211.412.41", "de", "211.412.41"],
    ["1.50", "en", "1.5"],
  ])("%s (%s) → %s", (token, locale, expected) => {
    expect(normalizeNumber(token, locale)).toBe(expected);
  });

  const en = { data: { faq: [{ q: "How much?", a: "At least CHF 435,000 in 2026." }] }, body: "Base CHF 1.25 m, 0.1% of taxpayers, SR 211.412.41, 4,557 people. See [x](/en/guides/a-2029/)." };
  const fr = { data: { faq: [{ q: "Combien ?", a: "Au moins CHF 435 000 en 2026." }] }, body: "Base CHF 1,25 million, 0,1 % des contribuables, RS 211.412.41, 4557 personnes." };
  const de = { data: { faq: [{ q: "Wie viel?", a: "Mindestens CHF 435'000 im Jahr 2026." }] }, body: "Basis CHF 1,25 Mio., 0,1 % der Steuerpflichtigen, SR 211.412.41, 4'557 Personen." };

  it("accepts the same facts in three number formats (and ignores link targets)", () => {
    expect(checkNumberParity({ en, fr, de })).toEqual([]);
  });

  it("flags a changed or dropped figure", () => {
    const bad = { ...de, body: de.body.replace("4'557", "4'575") };
    const errors = checkNumberParity({ en, fr, de: bad });
    expect(errors.join("\n")).toMatch(/de is missing numbers present in en: 4557/);
    expect(errors.join("\n")).toMatch(/de has numbers not in en: 4575/);
  });

  it("flags en-style thousands in a French text", () => {
    const bad = { ...fr, body: fr.body.replace("4557", "4,557") };
    expect(checkNumberParity({ en, fr: bad }).join("\n")).toMatch(/fr/);
  });

  it("keeps small integers (they are legal thresholds too)", () => {
    expect([...extractNumbers("3 months, 7 cantons, 14 days", "en")]).toEqual(["3", "7", "14"]);
  });

  it("extracts money and percentages", () => {
    expect([...extractFigures("CHF 435,000 and 4% and €800,000 and 12 cantons", "en")].sort()).toEqual(["4", "435000", "800000"]);
  });
});

describe("content rules", () => {
  const hit = (s) => checkContentRules(s).map((e) => e.split(":")[0]);
  it.each([
    ["Our fee is CHF 5,000 for the ruling.", "pricing"],
    ["Nos honoraires commencent à CHF 3 000.", "pricing"],
    ["Write to hello@example.com for details.", "email"],
    ["We guarantee the permit.", "guarantee"],
    ["Le permis est garanti.", "guarantee"],
    ["Die Bewilligung ist garantiert.", "guarantee"],
    ["Guaranteed approval within weeks.", "guarantee"],
    ["We can guarantee your B permit.", "guarantee"],
    ["Nous garantissons l'obtention du permis.", "guarantee"],
    ["Wir garantieren Ihre Aufenthaltsbewilligung.", "guarantee"],
    ["Do we guarantee approval?", "guarantee"],
    ["The canton decides, and the result is guaranteed.", "guarantee"],
    ["It is not only fast but guaranteed.", "guarantee"],
    ["Die Gründung garantiert, dass Sie keine Wartezeit haben.", "guarantee"],
    ["Wir garantieren Ihnen keine Wartezeit.", "guarantee"],
    ["La société garantit un permis rapide et sans aucune attente.", "guarantee"],
    ["This figure is UNVERIFIED.", "unverified"],
    ["You become tax-resident after 183 days in Switzerland.", "183-days"],
    ["The base is at least 5× the annual rent.", "five-times-rent"],
    ["Switzerland offers residency by investment.", "residency-by-investment"],
    ["The minimum tax of CHF 435,000 applies.", "minimum-tax-435"],
    ["Switzerland has no inheritance tax.", "no-inheritance-wealth-tax"],
    ["La Suisse n'a pas d'impôt sur la fortune.", "no-inheritance-wealth-tax"],
    ["Die Schweiz kennt keine Erbschaftssteuer.", "no-inheritance-wealth-tax"],
  ])("rejects: %s", (sentence, rule) => {
    expect(hit(sentence)).toContain(rule);
  });

  it.each([
    "The 183-day rule is not the Swiss test; domicile or a 30/90-day stay is.",
    "The federal minimum tax base is CHF 435,000 for 2026.",
    "There is no federal inheritance tax, and Schwyz has no inheritance tax.",
    "Spouses pay no inheritance tax in most cantons.",
    "Switzerland has no residency-by-investment programme.",
    "The base is at least 7× the annual rent.",
    "Le calcul de contrôle porte sur les créances garanties par des hypothèques suisses.",
    "## Does company formation guarantee Swiss residence?",
    "Does starting a company guarantee a Swiss residence permit?",
    "Is a B permit guaranteed?",
    "Company formation alone does not guarantee a residence permit; the application is assessed on its merits.",
    "| Company formation | Does not guarantee residence; the permit is personal. |",
    "There is no guarantee that the canton will agree.",
    "A ruling is not a guarantee of residence.",
    "We cannot guarantee the outcome; the canton decides.",
    "## La création d'une société garantit-elle un permis de séjour ?",
    "La création d'une société ne garantit pas un permis de séjour.",
    "Le permis n'est pas garanti.",
    "Il n'existe aucune garantie d'obtenir le permis.",
    "## Garantiert eine Firmengründung eine Aufenthaltsbewilligung?",
    "Eine Firmengründung garantiert keine Aufenthaltsbewilligung.",
    "Die Gründung garantiert nicht, dass der Kanton zustimmt.",
    "Es gibt keine Garantie für eine Bewilligung.",
    "Die Bewilligung ist nicht garantiert.",
    "Eine Firmengründung in der Schweiz garantiert Drittstaatsangehörigen keine Aufenthaltsbewilligung.",
    "La création d'une société ne garantit à elle seule aucun permis.",
    "Une société garantit aux fondateurs étrangers aucun droit au permis.",
    "Transfer tax is 3% of the price in some cantons.",
  ])("accepts: %s", (sentence) => {
    expect(checkContentRules(sentence)).toEqual([]);
  });
});

describe("allowed internal links", () => {
  it("leaves out scheduled guides until their publishAt date", () => {
    const urls = (today) => new Set(buildAllowedLinks(ROOT, "en", { today }).map((x) => x.url));
    expect(urls("2026-09-30").has("/en/guides/family-reunification-switzerland/")).toBe(false);
    expect(urls("2026-10-16").has("/en/guides/family-reunification-switzerland/")).toBe(true);
  });
});

describe("article guardrails", () => {
  const links = Object.fromEntries(["en", "fr", "de"].map((l) => [l, new Set(buildAllowedLinks(ROOT, l).map((x) => x.url))]));
  const ctx = (locale) => ({ locale, slug: "swiss-tax-residency", category: "tax-and-wealth", categories, allowedLinks: links[locale] });
  const articles = { en: fixtureArticle("en"), fr: fixtureArticle("fr"), de: fixtureArticle("de") };

  it("passes a well-formed EN/FR/DE guide", () => {
    for (const l of ["en", "fr", "de"]) expect(checkArticle(articles[l], ctx(l))).toEqual([]);
    expect(checkArticleSet(articles, { factsCorpus: stripUnverified(LEGAL), unverifiedNumbers: unverifiedOnlyNumbers(LEGAL) })).toEqual([]);
  });

  it("word count lands in range", () => {
    const n = countWords(articles.en.body);
    expect(n).toBeGreaterThanOrEqual(1100);
    expect(n).toBeLessThanOrEqual(2000);
  });

  it("reports each broken rule", () => {
    const a = structuredClone(articles.en);
    a.data.title = "A".repeat(61);
    a.data.description = "Too short.";
    a.data.faq = a.data.faq.slice(0, 2);
    a.data.sources = [{ label: "Firm", url: "https://www.pwc.ch/x" }];
    a.data.keywords = { primary: "swiss tax residency", secondary: ["one"] };
    a.body = a.body
      .replace("/en/guides/swiss-permits-explained/", "/en/guides/does-not-exist/")
      .replace("## How we help", "## Our help")
      .replace("CHF 435,000", "CHF 999,000");
    const errors = checkArticle(a, ctx("en")).join("\n");
    for (const re of [/title is 61/, /description is 10/, /faq must have 4–6/, /pwc.ch.*blocked/, /at least 3 sources/, /official sources/, /secondary must be 5–10/, /does-not-exist.*does not resolve/, /"How we help" section missing/]) {
      expect(errors).toMatch(re);
    }
    const set = checkArticleSet({ ...articles, en: a }, { factsCorpus: stripUnverified(LEGAL) }).join("\n");
    expect(set).toMatch(/not found in legal-facts.*999000/);
    expect(set).toMatch(/parity/);
  });

  it("rejects too short and too long bodies", () => {
    expect(checkArticle(fixtureArticle("en", "swiss-tax-residency", { fillerRepeats: 8 }), ctx("en")).join()).toMatch(/words \(1100–2000\)/);
    expect(checkArticle(fixtureArticle("en", "swiss-tax-residency", { fillerRepeats: 60 }), ctx("en")).join()).toMatch(/words \(1100–2000\)/);
  });

  it("serialises frontmatter that round-trips through gray-matter", () => {
    const md = serializeGuide(articles.fr.data, articles.fr.body);
    const parsed = matter(md);
    expect(parsed.data).toEqual(articles.fr.data);
    expect(parsed.content.trim()).toBe(articles.fr.body.trim());
  });
});

describe("review follow-ups", () => {
  it("catches amounts written with the currency after the number", () => {
    expect([...extractFigures("A filing fee of 5,000 CHF and 3 000 francs", "en")].sort()).toEqual(["3000", "5000"]);
    expect(checkContentRules("A filing fee can be 5,000 CHF.").map((e) => e.split(":")[0])).toContain("pricing");
    expect(checkContentRules("Une émolument de 5 000 CHF.").map((e) => e.split(":")[0])).toContain("pricing");
  });

  it("flags figures that only appear in title/description", () => {
    const en = fixtureArticle("en");
    const fr = fixtureArticle("fr");
    fr.data.description = fr.data.description.replace("CHF 435 000", "CHF 999 000");
    const errors = checkArticleSet({ en, fr, de: fixtureArticle("de") }, { factsCorpus: stripUnverified(LEGAL) }).join("\n");
    expect(errors).toMatch(/fr: title\/description has figures not in the article: 999000/);
  });
});

describe("keyword stuffing guardrails", () => {
  it("tells query-shaped keywords from natural phrases", () => {
    expect(isQueryShaped("self employed permit switzerland non eu", "en")).toBe(true);
    expect(isQueryShaped("work permit switzerland non eu", "en")).toBe(true);
    expect(isQueryShaped("moving to geneva with children", "en")).toBe(false);
    expect(isQueryShaped("aufenthaltsbewilligung schweiz als deutscher", "de")).toBe(true);
    expect(isQueryShaped("selbständig in der schweiz als drittstaatsangehöriger", "de")).toBe(false);
    expect(isQueryShaped("permis indépendant suisse hors ue", "fr")).toBe(false);
    expect(isQueryShaped("liste des permis en suisse", "fr")).toBe(false);
  });

  it("rejects raw lowercase queries, bolded/quoted queries and capitalised query-shaped titles", () => {
    const kws = ["self employed permit switzerland non eu", "swiss residence permit through company", "moving to geneva with children"];
    expect(rawKeywordIssues("The **self employed permit switzerland non eu** route is the main way.", kws, "en").join()).toMatch(/self employed permit switzerland non eu/);
    expect(rawKeywordIssues("Self employed permit Switzerland non EU: self-employed route", kws, "en")).toHaveLength(1);
    expect(rawKeywordIssues("Many ask about a “swiss residence permit through company”.", kws, "en")).toHaveLength(1);
    expect(rawKeywordIssues("Many ask about a “Swiss residence permit through company”.", kws, "en")).toHaveLength(1);
    expect(rawKeywordIssues("Some tips on **moving to geneva with children** below.", kws, "en")).toHaveLength(1);
    expect(rawKeywordIssues("Ein Irrtum: \"selbständig in der schweiz als drittstaatsangehöriger\" reicht.", ["selbständig in der schweiz als drittstaatsangehöriger"], "de")).toHaveLength(1);
    expect(rawKeywordIssues("La **liste des permis en suisse** change.", ["liste des permis en suisse"], "fr")).toHaveLength(1);
  });

  it("accepts natural uses of the same keywords", () => {
    const kws = ["self employed permit switzerland non eu", "swiss residence permit through company", "moving to geneva with children", "self employed in switzerland"];
    for (const t of [
      "Self-employed permit in Switzerland for non-EU founders",
      "A Swiss residence permit through company formation alone is not possible.",
      "Moving to Geneva with children takes planning.",
      "Being self employed in Switzerland means registering with the canton.",
    ])
      expect(rawKeywordIssues(t, kws, "en")).toEqual([]);
    expect(rawKeywordIssues("Wenn Sie als Drittstaatsangehöriger selbständig in der Schweiz arbeiten möchten.", ["selbständig in der schweiz als drittstaatsangehöriger"], "de")).toEqual([]);
    expect(rawKeywordIssues("Pour la plupart, la liste des permis en Suisse reste stable.", ["liste des permis en suisse"], "fr")).toEqual([]);
    expect(rawKeywordIssues("short one swiss eu", ["short one swiss"], "en")).toEqual([]); // < 4 words: not checked
  });

  it("rejects meta-phrases about searches in EN/FR/DE", () => {
    expect(searchMetaIssues("A misunderstanding behind searches like this one.", "en")).toHaveLength(1);
    expect(searchMetaIssues("People researching “how to get a permit” mix things up.", "en")).toHaveLength(1);
    expect(searchMetaIssues("Many people search for residence options.", "en")).toHaveLength(1);
    expect(searchMetaIssues("Common search queries include permits.", "en")).toHaveLength(1);
    expect(searchMetaIssues("Une confusion derrière les recherches comme celle-ci.", "fr")).toHaveLength(1);
    expect(searchMetaIssues("Les personnes qui recherchent « comment obtenir un permis » confondent.", "fr")).toHaveLength(1);
    expect(searchMetaIssues("Ein Irrtum bei Suchanfragen wie dieser.", "de")).toHaveLength(1);
    expect(searchMetaIssues('Viele, die "wie bekommt man eine Bewilligung" recherchieren, irren.', "de")).toHaveLength(1);
    // Ordinary uses of "search"/"recherche"/"Suche" stay allowed
    expect(searchMetaIssues("Plan the housing search early; start your search for a school in spring.", "en")).toEqual([]);
    expect(searchMetaIssues("La recherche de logement prend du temps ; ceux qui cherchent à s’installer doivent anticiper.", "fr")).toEqual([]);
    expect(searchMetaIssues("Die Wohnungssuche dauert; wer eine Schule sucht, plant früh.", "de")).toEqual([]);
    expect(searchMetaIssues("Check the permit type “B” on your card.", "en")).toEqual([]);
    expect(searchMetaIssues("L’autorité cherche « un intérêt économique » concret.", "fr")).toEqual([]);
    expect(searchMetaIssues("Das SEM sucht „nachhaltige Effekte“ für den Arbeitsmarkt.", "de")).toEqual([]);
    expect(searchMetaIssues("Wer nach „Bewilligung Schweiz Firma“ sucht, irrt oft.", "de")).toHaveLength(1);
  });

  it("checkArticle reports a pasted query and a search meta-phrase", () => {
    const links = new Set(buildAllowedLinks(ROOT, "en").map((x) => x.url));
    const a = structuredClone(fixtureArticle("en"));
    a.body = a.body.replace("\n\n", "\n\nPeople searching for “**tax residency switzerland rules**” often get this wrong.\n\n");
    const errors = checkArticle(a, { locale: "en", slug: "swiss-tax-residency", category: "tax-and-wealth", categories: loadCategories(ROOT), allowedLinks: links }).join("\n");
    expect(errors).toMatch(/keyword "tax residency switzerland rules" pasted as a raw search query/);
    expect(errors).toMatch(/talks about searches\/keywords/);
  });
});
