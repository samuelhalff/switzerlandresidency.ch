import { describe, expect, it } from "vitest";
import { frenchTypography, typeset } from "./typography";

const N = " ";

describe("frenchTypography", () => {
  it("binds high punctuation and guillemets", () => {
    expect(frenchTypography("Pourquoi ? Voici : « oui »")).toBe(`Pourquoi${N}? Voici${N}: «${N}oui${N}»`);
  });
  it("binds thousands groups", () => {
    expect(frenchTypography("CHF 435 000 et 1 250 000")).toBe(`CHF 435${N}000 et 1${N}250${N}000`);
  });
  it("leaves URLs and table alignment rows alone", () => {
    const s = "[AFC](https://www.estv.admin.ch/x?y=1)\n| :--- | ---: |";
    expect(frenchTypography(s)).toBe(s);
  });
  it("does not touch other locales", () => {
    expect(typeset("de", "CHF 435 000 ?")).toBe("CHF 435 000 ?");
  });
});
