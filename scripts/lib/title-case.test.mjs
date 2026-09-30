import { describe, expect, it } from "vitest";
import {
  ACRONYMS,
  applyAcronyms,
  applyCountryNames,
  capitalizeFirst,
  normalizeArticleCasing,
  normalizeH2Headings,
  normalizeTitleCasing,
  startsWithLowercase,
} from "./title-case.mjs";

describe("capitalizeFirst", () => {
  it("capitalises the first letter of a plain string", () => {
    expect(capitalizeFirst("pension fund buy-in in Switzerland")).toBe("Pension fund buy-in in Switzerland");
  });

  it("leaves leading Markdown markers untouched", () => {
    expect(capitalizeFirst("## what should you know?")).toBe("## What should you know?");
  });

  it("never lowercases an already-uppercase first letter", () => {
    expect(capitalizeFirst("LPP buy-in explained")).toBe("LPP buy-in explained");
  });

  it("is a no-op on empty/non-string input", () => {
    expect(capitalizeFirst("")).toBe("");
    expect(capitalizeFirst(undefined)).toBe(undefined);
  });
});

describe("applyAcronyms", () => {
  it.each(ACRONYMS)("uppercases %s as a whole word regardless of input case", (acro) => {
    const input = `the ${acro.toLowerCase()} rule applies`;
    expect(applyAcronyms(input)).toBe(`the ${acro} rule applies`);
  });

  it("does not touch substrings that are not whole words", () => {
    // "US" must not match inside "using" or "house"
    expect(applyAcronyms("using the house rules")).toBe("using the house rules");
  });

  it("handles multiple acronyms in one string (EN)", () => {
    expect(applyAcronyms("lpp and bvg buy-ins for avs/ahv coordination")).toBe("LPP and BVG buy-ins for AVS/AHV coordination");
  });

  it("handles acronyms in French text", () => {
    expect(applyAcronyms("le rachat lpp et l'afc genevoise")).toBe("le rachat LPP et l'AFC genevoise");
  });

  it("handles acronyms in German text, only touching the acronym itself", () => {
    expect(applyAcronyms("die bvg-einkauf und die estv Voranfrage")).toBe("die BVG-einkauf und die ESTV Voranfrage");
  });
});

describe("applyCountryNames", () => {
  it("capitalises Switzerland in all three locale spellings", () => {
    expect(applyCountryNames("moving to switzerland")).toBe("moving to Switzerland");
    expect(applyCountryNames("s'installer en suisse")).toBe("s'installer en Suisse");
    expect(applyCountryNames("auswandern in die schweiz")).toBe("auswandern in die Schweiz");
  });

  it("capitalises United Kingdom / Royaume-Uni", () => {
    expect(applyCountryNames("leaving the united kingdom")).toBe("leaving the United Kingdom");
    expect(applyCountryNames("quitter le royaume-uni")).toBe("quitter le Royaume-Uni");
  });

  it("capitalises other known country names (US/Germany/France)", () => {
    expect(applyCountryNames("moving from the united states")).toBe("moving from the United States");
    expect(applyCountryNames("depuis l'allemagne")).toBe("depuis l'Allemagne");
    expect(applyCountryNames("quitter la france")).toBe("quitter la France");
  });
});

describe("normalizeTitleCasing", () => {
  it("capitalises an autocomplete-style lowercase EN title and its acronym", () => {
    expect(normalizeTitleCasing("lpp buy-in switzerland: what it costs")).toBe("LPP buy-in Switzerland: what it costs");
  });

  it("capitalises an autocomplete-style lowercase FR title", () => {
    expect(normalizeTitleCasing("rachat lpp en suisse : ce qu'il faut savoir")).toBe("Rachat LPP en Suisse : ce qu'il faut savoir");
  });

  it("capitalises an autocomplete-style lowercase DE title without lowercasing German nouns", () => {
    expect(normalizeTitleCasing("lpp einkauf in der schweiz: was er kostet")).toBe("LPP einkauf in der Schweiz: was er kostet");
  });

  it("never lowercases German capitalised common nouns", () => {
    const input = "Pensionskasse und Vorsorgeausweis in der Schweiz";
    expect(normalizeTitleCasing(input)).toBe(input);
  });

  it("is idempotent", () => {
    const once = normalizeTitleCasing("avs contributions for us expats in switzerland");
    expect(normalizeTitleCasing(once)).toBe(once);
  });

  it("only ever raises case, never lowers it", () => {
    const input = "CHF 435,000 minimum tax base and the AHV/AVS threshold";
    expect(normalizeTitleCasing(input)).toBe(input);
  });

  it("is a no-op on empty/non-string input", () => {
    expect(normalizeTitleCasing("")).toBe("");
    expect(normalizeTitleCasing(null)).toBe(null);
  });
});

describe("normalizeH2Headings", () => {
  it("capitalises the first letter of every H2 heading, leaving other lines untouched", () => {
    const body = ["intro paragraph.", "", "## what counts as domicile?", "some text.", "### not touched (h3)", "## avs contributions explained"].join(
      "\n",
    );
    const out = normalizeH2Headings(body);
    expect(out).toContain("## What counts as domicile?");
    expect(out).toContain("## AVS contributions explained");
    expect(out).toContain("### not touched (h3)");
    expect(out).toContain("intro paragraph.");
  });

  it("does not touch an H1 line", () => {
    const body = "# a top-level heading\n\n## a sub heading";
    const out = normalizeH2Headings(body);
    expect(out).toContain("# a top-level heading");
    expect(out).toContain("## A sub heading");
  });
});

describe("normalizeArticleCasing", () => {
  it("normalises title, description, faq questions and H2 headings on a {data, body} article", () => {
    const article = {
      data: {
        title: "lpp buy-in in switzerland: a practical guide",
        description: "avs and lpp coordination for new residents moving from the united kingdom.",
        faq: [
          { q: "what is the lpp buy-in?", a: "an explanation." },
          { q: "How does AVS work?", a: "an explanation." },
        ],
      },
      body: "Intro.\n\n## avs contributions explained\n\nMore text.\n\n## how we help\n\nLink.",
    };
    normalizeArticleCasing(article);
    expect(article.data.title).toBe("LPP buy-in in Switzerland: a practical guide");
    expect(article.data.description).toBe("AVS and LPP coordination for new residents moving from the United Kingdom.");
    expect(article.data.faq[0].q).toBe("What is the LPP buy-in?");
    expect(article.data.faq[1].q).toBe("How does AVS work?");
    expect(article.body).toContain("## AVS contributions explained");
    expect(article.body).toContain("## How we help");
  });

  it("is a no-op on a non-object", () => {
    expect(normalizeArticleCasing(null)).toBe(null);
  });
});

describe("startsWithLowercase", () => {
  it("flags a lowercase leading letter", () => {
    expect(startsWithLowercase("pension fund buy-in")).toBe(true);
  });

  it("does not flag an uppercase leading letter", () => {
    expect(startsWithLowercase("Pension fund buy-in")).toBe(false);
  });

  it("skips leading digits/punctuation to find the first letter", () => {
    // Leading non-letters are skipped entirely; the check is on the first *letter*.
    expect(startsWithLowercase("7× Rent rule explained")).toBe(false);
    expect(startsWithLowercase("7× rent rule explained")).toBe(true);
    expect(startsWithLowercase('"Quoted" title')).toBe(false);
  });

  it("is false for empty/non-string input", () => {
    expect(startsWithLowercase("")).toBe(false);
    expect(startsWithLowercase(undefined)).toBe(false);
  });
});
