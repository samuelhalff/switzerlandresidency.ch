import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "@/components/Markdown";
import { anchorIds, slugify } from "../../scripts/lib/heading-id.mjs";

const md = `Intro

## Which cantons offer lump-sum taxation in 2026?

| Canton | Offered |
|---|---|
| Geneva (GE) | Yes |
| **Vaud** (VD) | Yes |

### Genève et l'impôt

## How we help

## How we help
`;

describe("heading and row anchors", () => {
  it("slugifies accents, apostrophes and punctuation", () => {
    expect(slugify("Genève et l’impôt ?")).toBe("geneve-et-limpot");
    expect(slugify("Zürich: Grundstückgewinnsteuer")).toBe("zurich-grundstuckgewinnsteuer");
  });

  it("renders ids on headings and table rows, matching the validator", () => {
    const html = renderToStaticMarkup(Markdown({ source: md }));
    const rendered = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(rendered).toEqual([
      "which-cantons-offer-lump-sum-taxation-in-2026",
      "geneva",
      "vaud",
      "geneve-et-limpot",
      "how-we-help",
      "how-we-help-2",
    ]);
    expect([...anchorIds(md)]).toEqual(rendered);
  });
});

describe("table layout", () => {
  it("lets tables of up to three columns fit the screen and keeps scrolling for wider ones", () => {
    const narrow = renderToStaticMarkup(Markdown({ source: "| A | B |\n|---|---|\n| 1 | 2 |\n" }));
    expect(narrow).toContain('class="table-wrap table-fit"');
    expect(narrow).not.toContain("tabindex");

    const three = renderToStaticMarkup(Markdown({ source: "| A | B | C |\n|---|---|---|\n| 1 | 2 | 3 |\n" }));
    expect(three).toContain("table-fit");

    const wide = renderToStaticMarkup(Markdown({ source: "| A | B | C | D |\n|---|---|---|---|\n| 1 | 2 | 3 | 4 |\n" }));
    expect(wide).toContain('class="table-wrap"');
    expect(wide).toContain('tabindex="0"');
  });
});
