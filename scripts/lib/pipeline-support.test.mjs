import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { classifySource, isAllowedSource } from "./source-policy.mjs";
import { buildChatBody, buildChatUrl, extractJson, isReasoningDeployment } from "./azure-openai.mjs";
import { deriveKeywords, fetchSuggestions, researchKeywords } from "./keyword-research.mjs";
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
