import { describe, expect, it } from "vitest";
import type { Entry } from "./content";
import { articleLd } from "./jsonld";

const entry: Entry = {
  collection: "guides",
  locale: "fr",
  slug: "x",
  title: "Titre",
  description: "Description",
  translationKey: "x",
  updated: "2026-09-30",
  category: "tax-and-wealth",
  draft: false,
  faq: [],
  sources: [{ label: "Fedlex", url: "https://www.fedlex.admin.ch/" }],
  body: "",
};

describe("articleLd", () => {
  it("emits keywords and about from frontmatter keywords", () => {
    const ld = articleLd({ ...entry, keywords: { primary: "résidence fiscale suisse", secondary: ["domicile fiscal suisse", "permis B"] } }, "https://example.ch/fr/guides/x/");
    expect(ld).toMatchObject({
      inLanguage: "fr",
      dateModified: "2026-09-30",
      keywords: "résidence fiscale suisse, domicile fiscal suisse, permis B",
      about: { "@type": "Thing", name: "résidence fiscale suisse" },
    });
  });

  it("omits keywords when the guide has none", () => {
    const ld = articleLd(entry, "https://example.ch/fr/guides/x/");
    expect(ld).not.toHaveProperty("keywords");
    expect(ld).not.toHaveProperty("about");
  });
});
