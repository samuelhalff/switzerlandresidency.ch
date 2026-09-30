import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { classifySource, isAllowedSource } from "./source-policy.mjs";
import { buildChatBody, buildChatUrl, extractJson, isReasoningDeployment } from "./azure-openai.mjs";
import {
  MARKETS,
  PROVIDER_ORDER,
  bingMarket,
  collectSuggestions,
  ddgRegion,
  deriveKeywords,
  fetchProviderSuggestions,
  fetchSuggestions,
  hasStaleYear,
  parseDuckDuckGo,
  parseOpenSearch,
  researchKeywords,
} from "./keyword-research.mjs";
import { applyResearch } from "../refresh-keywords.mjs";
import { serializeGuide } from "./article-pipeline.mjs";
import { fixtureArticle } from "./test-fixture.mjs";
import { discardArticle, validateNewArticle } from "../validate-new-article.mjs";
import { findKey, guideUrls } from "../indexnow.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("source policy", () => {
  it.each([
    ["https://www.fedlex.admin.ch/eli/cc/1991/1184_1184_1184/de", "official"],
    ["https://www.estv.admin.ch/x.pdf", "official"],
    ["https://www4.ti.ch/x", "official"],
    ["https://www.gov.uk/tax-foreign-income", "official"],
    ["https://www.irs.gov/instructions/i8621", "official"],
    ["https://www.ecolint.ch/", "institutional"],
    ["https://www.pwc.ch/en/insights.html", "blocked"],
    ["https://ark-fid.ch/fr/", "blocked"],
    ["https://www.some-law-firm.com/swiss-forfait", "disallowed"],
    ["https://admin.ch.evil.com/", "disallowed"],
    ["not a url", "invalid"],
  ])("%s → %s", (url, expected) => {
    expect(classifySource(url, { extraAllowed: [] })).toBe(expected);
  });

  it("runtime additions cannot unblock blocked domains", () => {
    expect(isAllowedSource("https://ridger.ch/x", { extraAllowed: ["ridger.ch"] })).toBe(false);
    expect(isAllowedSource("https://example.gov/x", { extraAllowed: ["example.gov"] })).toBe(true);
  });
});

describe("azure openai client", () => {
  it("normalises endpoints to the chat-completions route", () => {
    expect(buildChatUrl({ endpoint: "myres.openai.azure.com", deployment: "gpt-4.1", apiVersion: "2025-01-01-preview" })).toBe(
      "https://myres.openai.azure.com/openai/deployments/gpt-4.1/chat/completions?api-version=2025-01-01-preview",
    );
    expect(
      buildChatUrl({ endpoint: "https://x.cognitiveservices.azure.com/openai/deployments/old/chat/completions?api-version=2024-01-01", deployment: "new", apiVersion: "2025-01-01-preview" }),
    ).toBe("https://x.cognitiveservices.azure.com/openai/deployments/new/chat/completions?api-version=2024-01-01");
  });

  it("uses max_completion_tokens and no temperature for reasoning models", () => {
    expect(isReasoningDeployment("gpt-5.2")).toBe(true);
    expect(isReasoningDeployment("gpt-4.1")).toBe(false);
    const r = buildChatBody({ deployment: "gpt-5.2", messages: [], maxTokens: 100 });
    expect(r).toMatchObject({ max_completion_tokens: 100, response_format: { type: "json_object" } });
    expect(r).not.toHaveProperty("temperature");
    expect(buildChatBody({ deployment: "gpt-4.1", messages: [], maxTokens: 100 })).toMatchObject({ max_tokens: 100, temperature: 0.3 });
  });

  it("extracts JSON from fenced or chatty replies", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson('Here:\n```json\n{"a":2}\n```')).toEqual({ a: 2 });
    expect(extractJson('Sure! {"a":3} done')).toEqual({ a: 3 });
    expect(() => extractJson("nope")).toThrow();
  });
});

describe("keyword research", () => {
  it("derives primary, secondary and question keywords from suggestions", () => {
    const rows = [
      { market: "de-CH", suggestions: ["pauschalbesteuerung schweiz voraussetzungen", "pauschalbesteuerung schweiz mwst", "pauschalbesteuerung schweiz kantone"] },
      { market: "de-DE", suggestions: ["pauschalbesteuerung schweiz kantone", "wie funktioniert pauschalbesteuerung schweiz", "fussball heute"] },
    ];
    const k = deriveKeywords(rows, ["pauschalbesteuerung schweiz"], "de");
    expect(k.primary).toBe("pauschalbesteuerung schweiz");
    expect(k.secondary[0]).toBe("wie funktioniert pauschalbesteuerung schweiz"); // questions first
    expect(k.secondary).toContain("pauschalbesteuerung schweiz kantone");
    expect(k.secondary.join()).not.toMatch(/mwst|fussball/);
    expect(k.candidates[0].keyword).toBe("pauschalbesteuerung schweiz kantone"); // seen in 2 markets
  });

  it("parses autocomplete responses and never throws on errors", async () => {
    const ok = async () => new Response(JSON.stringify(["q", ["a", "b"]]), { status: 200 });
    expect(await fetchSuggestions("q", { hl: "en", gl: "gb" }, { fetchImpl: ok })).toEqual(["a", "b"]);
    const bad = async () => {
      throw new Error("offline");
    };
    expect(await fetchSuggestions("q", { hl: "en", gl: "gb" }, { fetchImpl: bad })).toEqual([]);
  });

  it("falls back to backlog keywords offline", async () => {
    const r = await researchKeywords({ title: "T", keywords: { en: ["swiss tax residency", "tax domicile"], fr: ["résidence fiscale suisse"], de: [] } }, { offline: true });
    expect(r.locales.en.primary).toBe("swiss tax residency");
    expect(r.locales.en.secondary).toContain("tax domicile");
    expect(r.locales.fr.primary).toBe("résidence fiscale suisse");
    expect(r.trends).toEqual([]);
  });
});

describe("validate-new-article (temp copy of the site)", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sr-guard-"));
  for (const dir of ["content", "app", "src/i18n", "research"]) fs.cpSync(path.join(ROOT, dir), path.join(tmp, dir), { recursive: true });
  afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const slug = "zz-swiss-tax-residency-test";
  const write = (mutate = (a) => a) => {
    for (const l of ["en", "fr", "de"]) {
      const a = mutate(fixtureArticle(l, slug), l);
      fs.writeFileSync(path.join(tmp, "content", l, "guides", `${slug}.md`), serializeGuide(a.data, a.body));
    }
  };

  it("passes a valid article set", () => {
    write();
    expect(validateNewArticle(slug, { root: tmp, siteValidator: false })).toEqual({ ok: true, errors: [] });
  });

  it("fails with reasons and can discard the files", () => {
    write((a, l) => (l === "de" ? { ...a, body: a.body.replace("CHF 435'000", "CHF 453'000") } : a));
    const r = validateNewArticle(slug, { root: tmp, siteValidator: false });
    expect(r.ok).toBe(false);
    expect(r.errors.join("\n")).toMatch(/parity: de/);
    discardArticle(slug, tmp);
    expect(fs.existsSync(path.join(tmp, "content", "en", "guides", `${slug}.md`))).toBe(false);
  });

  it("reports a missing translation", () => {
    write();
    fs.rmSync(path.join(tmp, "content", "fr", "guides", `${slug}.md`));
    expect(validateNewArticle(slug, { root: tmp, siteValidator: false }).errors.join()).toMatch(/fr.*missing/);
    discardArticle(slug, tmp);
  });
});

describe("indexnow", () => {
  it("finds the committed key file and builds guide URLs", () => {
    const key = findKey(ROOT, {});
    expect(key).toMatch(/^[a-f0-9]{32}$/);
    expect(findKey(ROOT, { INDEXNOW_KEY: "abc123abc" })).toBe("abc123abc");
    expect(guideUrls("https://switzerlandresidency.ch", "x")).toContain("https://switzerlandresidency.ch/de/guides/x/");
  });
});

describe("keyword providers, fallback and stored keywords", () => {
  const json = (body, status = 200) => new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  /** Fake fetch keyed by host; records URLs. */
  const fakeFetch = (byHost) => {
    const calls = [];
    const impl = async (url) => {
      calls.push(String(url));
      const h = byHost[new URL(url).host];
      return h ? h(new URL(url)) : json("", 404);
    };
    return { impl, calls };
  };
  const G = "suggestqueries.google.com";
  const B = "api.bing.com";
  const D = "duckduckgo.com";

  it("parses bing (osjson) and duckduckgo responses and maps markets", () => {
    expect(parseOpenSearch(JSON.stringify(["q", ["swiss c permit", " "]]))).toEqual(["swiss c permit"]);
    expect(parseDuckDuckGo(JSON.stringify([{ phrase: "permis c suisse" }, {}]))).toEqual(["permis c suisse"]);
    expect(() => parseOpenSearch("<html>consent</html>")).toThrow();
    expect(PROVIDER_ORDER).toEqual(["google", "bing", "duckduckgo"]);
    const all = Object.values(MARKETS).flat();
    expect(all.map(bingMarket)).toEqual(["en-GB", "en-US", "en-AE", "en-SG", "fr-CH", "fr-FR", "fr-BE", "de-CH", "de-DE", "de-AT"]);
    expect(all.map(ddgRegion)).toEqual(["uk-en", "us-en", "xa-en", "sg-en", "ch-fr", "fr-fr", "be-fr", "ch-de", "de-de", "at-de"]);
  });

  it("reports HTTP status / unparseable bodies instead of swallowing them", async () => {
    const { impl } = fakeFetch({ [G]: () => json("", 429), [B]: () => json("<html>", 200) });
    expect(await fetchProviderSuggestions("google", "q", { hl: "en", gl: "gb" }, { fetchImpl: impl })).toEqual({ suggestions: [], error: "HTTP 429" });
    expect((await fetchProviderSuggestions("bing", "q", { hl: "en", gl: "gb" }, { fetchImpl: impl })).error).toBe("unparseable body");
  });

  it("falls back google → bing → duckduckgo, logs errors once, skips a blocked provider", async () => {
    const { impl, calls } = fakeFetch({
      [G]: () => json("", 403),
      [B]: () => json(["q", []]),
      [D]: (u) => json([{ phrase: `${u.searchParams.get("q")} geneva` }]),
    });
    const logs = [];
    const state = { blocked: new Set() };
    const r = await collectSuggestions("fr", ["permis c suisse"], { fetchImpl: impl, log: (m) => logs.push(m), state });
    expect(r.provider).toBe("duckduckgo");
    expect(r.attempts.map((a) => a.provider)).toEqual(["google", "bing", "duckduckgo"]);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatch(/google 3\/3 requests failed — HTTP 403 ×3 \(fr-CH, fr-FR, fr-BE\)/);
    expect(state.blocked.has("google")).toBe(true);
    calls.length = 0;
    await collectSuggestions("de", ["c bewilligung schweiz"], { fetchImpl: impl, state });
    expect(calls.some((u) => u.includes(G))).toBe(false);
  });

  it("uses live results, else stored researchedKeywords, else seeds — and reports the source", async () => {
    const item = {
      title: "T",
      keywords: { en: ["swiss c permit"], fr: ["permis c suisse"], de: ["niederlassungsbewilligung schweiz"] },
      researchedKeywords: {
        date: "2026-09-30",
        perLocale: { fr: { primary: "permis c suisse", secondary: ["permis c suisse conditions"], questions: ["comment obtenir le permis c en suisse"] } },
      },
    };
    const { impl } = fakeFetch({
      [G]: (u) => (u.searchParams.get("hl") === "en" ? json(["q", ["swiss c permit requirements", "swiss c permit after 5 years"]]) : json("", 429)),
      [B]: () => json("", 429),
      [D]: () => json("", 429),
    });
    const logs = [];
    const r = await researchKeywords(item, { fetchImpl: impl, trends: false, log: (m) => logs.push(m) });
    expect(r.sources).toEqual({ en: "live:google", fr: "stored 2026-09-30", de: "seeds" });
    expect(r.locales.en.secondary).toContain("swiss c permit requirements");
    expect(r.locales.fr.secondary).toEqual(["permis c suisse conditions"]);
    expect(r.locales.fr.questions).toEqual(["comment obtenir le permis c en suisse"]);
    expect(r.locales.fr.candidates.map((c) => c.keyword)).toContain("comment obtenir le permis c en suisse");
    expect(r.locales.de.primary).toBe("niederlassungsbewilligung schweiz");
    expect(logs.some((m) => /source: stored 2026-09-30/.test(m))).toBe(true);
    const noStore = await researchKeywords(item, { fetchImpl: impl, trends: false, useStored: false });
    expect(noStore.sources.fr).toBe("seeds");
  });

  it("refresh-keywords stores only live results and keeps other locales", () => {
    const item = { researchedKeywords: { date: "2026-01-01", perLocale: { de: { primary: "x", secondary: [], questions: [] } } } };
    const research = {
      locales: {
        en: { primary: "swiss c permit", secondary: ["swiss c permit requirements"], questions: [], candidates: [{ keyword: "swiss c permit requirements" }] },
        de: { primary: "y", secondary: [], questions: [], candidates: [] },
      },
      sources: { en: "live:bing", de: "seeds" },
    };
    expect(applyResearch(item, research, "2026-09-30")).toEqual(["en"]);
    expect(item.researchedKeywords.date).toBe("2026-09-30");
    expect(item.researchedKeywords.perLocale.de.primary).toBe("x");
    expect(item.researchedKeywords.perLocale.en.secondary).toEqual(["swiss c permit requirements"]);
  });

  it("drops junk suggestions (calculator, driving licence, reddit)", () => {
    const rows = [{ market: "fr-CH", suggestions: ["permis c suisse conditions", "permis de conduire suisse permis c", "permis c suisse calculateur", "permis c suisse reddit", "permis c suisse conditions 2024", "welche promis wohnen in genf"] }];
    const k = deriveKeywords(rows, ["permis c suisse"], "fr");
    expect(k.candidates.map((c) => c.keyword)).toEqual(["permis c suisse conditions"]);
    expect(hasStaleYear("valeur locative abolition 2029", new Date("2026-09-30"))).toBe(false);
    expect(hasStaleYear("guide fiscal valais 2024", new Date("2026-09-30"))).toBe(true);
  });
});
