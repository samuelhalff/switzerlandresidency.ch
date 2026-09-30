import { afterEach, describe, expect, it, vi } from "vitest";
import { chatJson } from "./azure-openai.mjs";
import {
  alignSourcesToEn,
  buildShortenPrompt,
  cleanSources,
  expectedLinks,
  factBaseUrls,
  fieldMisfit,
  fitMetaFields,
  generateWithRepair,
  linkParity,
  measure,
  metaProblems,
  repairFeedback,
  repairLinks,
  requirementsBlock,
  strongConfig,
} from "./article-repair.mjs";

const FACTS = `Art. 19 AIG: https://www.fedlex.admin.ch/eli/cc/2007/758/de#art_19
SEM directives https://www.sem.admin.ch/sem/en/home/publiservice/weisungen-kreisschreiben/auslaenderbereich.html.
Canton page https://www.zh.ch/de/migration-integration.html and a blog https://example-blog.com/post`;

describe("source clean-up", () => {
  it("lists only official/institutional URLs of the fact base", () => {
    const urls = factBaseUrls(FACTS);
    expect(urls).toContain("https://www.fedlex.admin.ch/eli/cc/2007/758/de#art_19");
    expect(urls).toContain("https://www.sem.admin.ch/sem/en/home/publiservice/weisungen-kreisschreiben/auslaenderbereich.html");
    expect(urls.some((u) => u.includes("example-blog"))).toBe(false);
  });

  it("drops internal, malformed, off-policy, unknown and duplicate sources; never invents", () => {
    const { sources, dropped } = cleanSources(
      [
        { label: "AIG art. 19", url: "https://www.fedlex.admin.ch/eli/cc/2007/758/de#art_19" },
        { label: "Permits", url: "/en/guides/swiss-permits-explained/" },
        { label: "Broken", url: "www.sem.admin.ch/page" },
        { label: "Blog", url: "https://example-blog.com/post" },
        { label: "Not in facts", url: "https://www.sem.admin.ch/sem/en/home/other.html" },
        { label: "SEM", url: "https://www.sem.admin.ch/sem/en/home/publiservice/weisungen-kreisschreiben/auslaenderbereich.html" },
        { label: "AIG again", url: "https://www.fedlex.admin.ch/eli/cc/2007/758/de" },
        { label: "", url: "https://www.zh.ch/de/migration-integration.html" },
      ],
      { sourceText: FACTS },
    );
    expect(sources.map((s) => s.label)).toEqual(["AIG art. 19", "SEM"]);
    const reasons = Object.fromEntries(dropped.map((d) => [d.source.url, d.reason]));
    expect(reasons["/en/guides/swiss-permits-explained/"]).toBe("internal/relative path");
    expect(reasons["www.sem.admin.ch/page"]).toBe("not an absolute https URL");
    expect(reasons["https://example-blog.com/post"]).toMatch(/source policy/);
    expect(reasons["https://www.sem.admin.ch/sem/en/home/other.html"]).toBe("not in the fact base");
    expect(reasons["https://www.fedlex.admin.ch/eli/cc/2007/758/de"]).toBe("duplicate");
    expect(reasons["https://www.zh.ch/de/migration-integration.html"]).toBe("missing label");
  });

  it("aligns translated sources to the EN URLs and order", () => {
    const en = [
      { label: "Federal act", url: "https://a.admin.ch/x" },
      { label: "SEM", url: "https://b.admin.ch/y" },
    ];
    expect(
      alignSourcesToEn(
        [
          { label: "SEM (fr)", url: "https://b.admin.ch/y" },
          { label: "Loi fédérale", url: "https://a.admin.ch/x-mangled" },
        ],
        en,
      ),
    ).toEqual([
      { label: "Loi fédérale", url: "https://a.admin.ch/x" },
      { label: "SEM (fr)", url: "https://b.admin.ch/y" },
    ]);
    expect(alignSourcesToEn([], en)).toEqual(en);
  });
});

describe("title/description fitting", () => {
  const primary = "self employed permit switzerland non eu";
  const longTitle = "Setting up a business as a non-EU founder: the self-employed permit route"; // 73
  const goodDesc = "How non-EU nationals get a self-employed permit in Switzerland: economic interest, business plan, quotas and what the canton checks before it decides.";

  it("reports fields outside the limits", () => {
    expect(metaProblems({ title: longTitle, description: goodDesc })).toEqual([{ field: "title", length: 73, min: 1, max: 60 }]);
    expect(goodDesc.length).toBeGreaterThanOrEqual(140);
    expect(goodDesc.length).toBeLessThanOrEqual(155);
  });

  it("rejects candidates that fail the same checks as checkArticle", () => {
    const o = { primary, original: longTitle, allowedNumbers: new Set(["2"]), locale: "en" };
    expect(fieldMisfit("title", "x".repeat(61), o)).toMatch(/61 characters/);
    expect(fieldMisfit("title", "Founding a firm in Switzerland as a foreigner", o)).toMatch(/lost the primary keyword/);
    expect(fieldMisfit("title", "Self-employed permit for non-EU: a 20% quota share", o)).toMatch(/adds figures/);
    expect(fieldMisfit("title", "Self-employed permit for non-EU: guaranteed approval", o)).toMatch(/wording rule \(guarantee\)/);
    expect(fieldMisfit("title", "self-employed permit for non-EU nationals", o)).toMatch(/lowercase/);
    expect(fieldMisfit("title", "Self-employed permit in Switzerland for non-EU nationals", o)).toBeNull();
  });

  it("retries with rejection feedback and accepts only a fitting candidate (mocked model)", async () => {
    const prompts = [];
    const replies = [
      { title: "Setting up a business in Switzerland as a non-EU founder today" }, // 62, too long
      { title: "Self-employed permit in Switzerland for non-EU nationals" },
    ];
    const call = vi.fn(async (prompt) => {
      prompts.push(prompt);
      return replies.shift();
    });
    const res = await fitMetaFields({ data: { title: longTitle, description: goodDesc }, locale: "en", primary, call });
    expect(call).toHaveBeenCalledTimes(2);
    expect(prompts[0]).toMatch(/title \(currently 73 characters\): shorten to AT MOST 60 characters/);
    expect(prompts[0]).toContain(primary);
    expect(prompts[1]).toMatch(/Rejected earlier: .*62 characters/);
    expect(res.data.title).toBe("Self-employed permit in Switzerland for non-EU nationals");
    expect(res.data.description).toBe(goodDesc);
    expect(res.remaining).toEqual([]);
  });

  it("takes the first fitting candidate of several", async () => {
    const call = vi.fn(async (prompt) => {
      expect(prompt).toMatch(/each an array of 3 strings/);
      return { title: ["Setting up a business in Switzerland as a non-EU founder today", "Self-employed permit in Switzerland for non-EU nationals", "Self-employed permit for non-EU"] };
    });
    const res = await fitMetaFields({ data: { title: longTitle, description: goodDesc }, locale: "en", primary, call });
    expect(call).toHaveBeenCalledTimes(1);
    expect(res.data.title).toBe("Self-employed permit in Switzerland for non-EU nationals");
  });

  it("gives up after 3 rounds and keeps the original value", async () => {
    const call = vi.fn(async () => ({ description: "Too short." }));
    const desc = `${goodDesc} Extra words that push it over.`;
    const res = await fitMetaFields({ data: { title: "Self-employed permit for non-EU nationals", description: desc }, locale: "en", primary, call });
    expect(call).toHaveBeenCalledTimes(3);
    expect(res.data.description).toBe(desc);
    expect(res.remaining.map((r) => r.field)).toEqual(["description"]);
  });

  it("lets a too-long keyword be shortened to its main words", () => {
    const p = buildShortenPrompt({ locale: "de", primary: "aufenthaltsbewilligung selbständige erwerbstätigkeit drittstaat", fields: [{ field: "title", length: 63, min: 1, max: 60, value: "x" }] });
    expect(p).toMatch(/too long to fit whole — keep its main words/);
    const o = { primary: "aufenthaltsbewilligung selbständige erwerbstätigkeit drittstaat", original: "Aufenthaltsbewilligung für selbständige Erwerbstätigkeit aus Drittstaaten", locale: "de" };
    expect(fieldMisfit("title", "Selbständige Erwerbstätigkeit: Bewilligung für Drittstaaten", o)).toBeNull();
  });

  it("flags a title that only capitalises the raw query and asks for a natural rewrite (mocked model)", async () => {
    const raw = "Self employed permit Switzerland non EU: self-employed route";
    expect(metaProblems({ title: raw, description: goodDesc }, { primary, locale: "en" })).toEqual([{ field: "title", length: raw.length, min: 1, max: 60, reason: "raw-query" }]);
    expect(metaProblems({ title: raw, description: goodDesc })).toEqual([]);
    const o = { primary, original: raw, locale: "en" };
    expect(fieldMisfit("title", raw, o)).toMatch(/raw search query/);
    expect(fieldMisfit("title", "Self-employed permit: what people search for in Switzerland", o)).toMatch(/searches\/keywords/);
    const prompts = [];
    const call = vi.fn(async (prompt) => {
      prompts.push(prompt);
      return { title: ["Self employed permit Switzerland non EU founders", "Self-employed permit in Switzerland for non-EU founders"] };
    });
    const res = await fitMetaFields({ data: { title: raw, description: goodDesc }, locale: "en", primary, call });
    expect(prompts[0]).toMatch(/rewrite as a natural, grammatical phrase/);
    expect(prompts[0]).toMatch(/never paste a search query verbatim/);
    expect(res.data.title).toBe("Self-employed permit in Switzerland for non-EU founders");
    expect(res.remaining).toEqual([]);
  });

  it("asks to lengthen a short description", () => {
    expect(buildShortenPrompt({ locale: "fr", primary: "permis", fields: [{ field: "description", length: 120, min: 140, max: 155, value: "x" }] })).toMatch(
      /lengthen to AT LEAST 140 characters — allowed range 140–155/,
    );
  });
});

describe("link parity (translations)", () => {
  const en = `Intro with a [permits guide](/en/guides/swiss-permits-explained/) and [SEM](https://www.sem.admin.ch/x).

## How we help

Start with our [eligibility check](/en/eligibility-check/).`;
  const expected = expectedLinks(en, "fr");
  const frMissing = `Intro avec le [guide des permis](/fr/guides/swiss-permits-explained/) et le SEM.

## Comment nous vous aidons

Commencez par notre test d'éligibilité.`;

  it("maps EN links to the locale and finds missing ones", () => {
    expect(expected.map((e) => e.url)).toEqual(["/fr/guides/swiss-permits-explained/", "https://www.sem.admin.ch/x", "/fr/eligibility-check/"]);
    const p = linkParity(expected, frMissing);
    expect(p.ok).toBe(false);
    expect(p.missing.map((m) => m.url)).toEqual(["https://www.sem.admin.ch/x", "/fr/eligibility-check/"]);
  });

  it("accepts a targeted repair that restores the links without changing structure", async () => {
    const fixed = frMissing.replace("le SEM.", "le [SEM](https://www.sem.admin.ch/x).").replace("notre test d'éligibilité", "notre [test d'éligibilité](/fr/eligibility-check/)");
    const call = vi.fn(async (prompt) => {
      expect(prompt).toContain("https://www.sem.admin.ch/x");
      expect(prompt).toContain('English anchor: "eligibility check"');
      return { body: fixed };
    });
    expect(await repairLinks({ locale: "fr", body: frMissing, expected, call })).toEqual({ body: fixed, repaired: true });
  });

  it("rejects a repair that changes structure or still misses links", async () => {
    const withLinks = frMissing.replace("le SEM.", "le [SEM](https://www.sem.admin.ch/x).").replace("notre test d'éligibilité", "notre [test](/fr/eligibility-check/)");
    expect(await repairLinks({ locale: "fr", body: frMissing, expected, call: async () => ({ body: `${withLinks}\n\n## Extra` }) })).toBeNull();
    expect(await repairLinks({ locale: "fr", body: frMissing, expected, call: async () => ({ body: frMissing }) })).toBeNull();
    expect(await repairLinks({ locale: "fr", body: withLinks, expected, call: async () => ({}) })).toEqual({ body: withLinks, repaired: false });
  });
});

describe("prompt blocks", () => {
  it("states the exact limits and the allowed source URLs", () => {
    const r = requirementsBlock({ locale: "en", primary: "kw", words: [1100, 2000], sourceUrls: ["https://www.fedlex.admin.ch/a"] });
    expect(r).toMatch(/title: at most 60 characters/);
    expect(r).toMatch(/description: 140–155 characters/);
    expect(r).toMatch(/1100–2000 words/);
    expect(r).toMatch(/Internal pages \(\/en\/…\) are NEVER sources/);
    expect(r).toContain("  - https://www.fedlex.admin.ch/a");
  });

  it("repeats every error, the measurements and asks for the full output", () => {
    const article = { data: { title: "t".repeat(66), description: "d".repeat(162), sources: [] }, body: "one two three" };
    const fb = repairFeedback({ errors: ["en: title is 66 chars (max 60)", "en: description is 162 chars (140–155)"], requirements: "HARD LIMITS …", previous: { title: "x" }, measured: measure(article) });
    expect(fb).toContain("- en: title is 66 chars (max 60)");
    expect(fb).toContain("- en: description is 162 chars (140–155)");
    expect(fb).toMatch(/title 66 characters; description 162 characters; body 3 words; 0 sources/);
    expect(fb).toMatch(/FULL corrected JSON/);
    expect(fb).toContain("HARD LIMITS");
  });
});

describe("attempt loop and strong escalation", () => {
  const base = { endpoint: "https://x.openai.azure.com", apiKey: "k", deployment: "gpt-4.1", apiVersion: "2025-01-01-preview" };
  afterEach(() => vi.unstubAllGlobals());

  it("configures the strong deployment only when set and different", () => {
    expect(strongConfig(base, {})).toBeNull();
    expect(strongConfig(base, { AZURE_OPENAI_DEPLOYMENT_STRONG: "gpt-4.1" })).toBeNull();
    expect(strongConfig(base, { AZURE_OPENAI_DEPLOYMENT_STRONG: "gpt-5.2", AZURE_OPENAI_API_VERSION_STRONG: "2025-04-01-preview" })).toEqual({
      ...base,
      deployment: "gpt-5.2",
      apiVersion: "2025-04-01-preview",
    });
  });

  it("feeds the exact errors back and escalates the final attempt", async () => {
    const seen = [];
    const article = await generateWithRepair({
      attempts: 3,
      label: "draft-en",
      baseCfg: base,
      strongCfg: { ...base, deployment: "gpt-5.2" },
      generate: async (cfg, fb, attempt) => {
        seen.push({ deployment: cfg.deployment, errors: fb?.errors ?? null, attempt });
        return { n: attempt };
      },
      finish: async (out) => out,
      check: (a) => (a.n < 3 ? [`en: title is ${70 - a.n} chars (max 60)`] : []),
    });
    expect(article).toEqual({ n: 3 });
    expect(seen).toEqual([
      { deployment: "gpt-4.1", errors: null, attempt: 1 },
      { deployment: "gpt-4.1", errors: ["en: title is 69 chars (max 60)"], attempt: 2 },
      { deployment: "gpt-5.2", errors: ["en: title is 68 chars (max 60)"], attempt: 3 },
    ]);
  });

  it("keeps the same model when no strong deployment is set, and reports the last errors", async () => {
    const deployments = [];
    await expect(
      generateWithRepair({
        attempts: 2,
        label: "translate-fr",
        baseCfg: base,
        generate: async (cfg) => deployments.push(cfg.deployment),
        finish: async (out) => out,
        check: () => ["fr: description is 162 chars (140–155)"],
      }),
    ).rejects.toThrow(/translate-fr failed guardrails after 2 attempts:\n- fr: description is 162 chars/);
    expect(deployments).toEqual(["gpt-4.1", "gpt-4.1"]);
  });

  it("falls back to the base deployment when the strong one is missing (mocked Azure HTTP 404)", async () => {
    const urls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        urls.push(String(url));
        if (String(url).includes("/deployments/gpt-5.2/")) return new Response('{"error":{"code":"DeploymentNotFound"}}', { status: 404 });
        return new Response(JSON.stringify({ choices: [{ message: { content: '{"ok": true}' }, finish_reason: "stop" }] }), { status: 200 });
      }),
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
    const logs = [];
    let calls = 0;
    const out = await generateWithRepair({
      attempts: 2,
      label: "draft-en",
      baseCfg: base,
      strongCfg: { ...base, deployment: "gpt-5.2" },
      log: (m) => logs.push(m),
      generate: (cfg) => chatJson(cfg, { system: "s", user: "u", label: "t", retries: 0 }),
      finish: async (o) => ({ ...o, n: ++calls }),
      check: (a) => (a.n < 2 ? ["en: some error"] : []),
    });
    expect(out.ok).toBe(true);
    expect(urls.map((u) => u.match(/deployments\/([^/]+)/)[1])).toEqual(["gpt-4.1", "gpt-5.2", "gpt-4.1"]);
    expect(logs.some((l) => /strong deployment unavailable/.test(l))).toBe(true);
    const body = JSON.parse(vi.mocked(fetch).mock.calls[1][1].body);
    expect(body.max_completion_tokens).toBeDefined(); // gpt-5.x takes max_completion_tokens
  });
});
