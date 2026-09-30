import { describe, expect, it } from "vitest";
import en from "@/i18n/en.json";
import fr from "@/i18n/fr.json";
import { getMessages, t } from "./i18n";

/** Every string leaf of a message tree. */
function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}

describe("getMessages", () => {
  it("applies French typography to nested list strings", () => {
    const summaries = Object.values(getMessages("fr").services.items).map((i) => i.summary);
    const eu = summaries.find((s) => s.includes("UE"));
    expect(eu).toContain("l’UE");
    expect(eu).not.toContain("l'UE");
  });

  it("leaves no straight apostrophe between letters anywhere in fr", () => {
    for (const s of strings(getMessages("fr"))) expect(s).not.toMatch(/\p{L}'\p{L}/u);
  });

  it("agrees with t() for plain keys", () => {
    expect(getMessages("fr").contact.channelsTitle).toBe(t("fr", "contact.channelsTitle"));
  });

  it("does not mutate the source dictionary and memoises per locale", () => {
    expect(getMessages("fr")).toBe(getMessages("fr"));
    expect(strings(fr).some((s) => /\p{L}'\p{L}/u.test(s))).toBe(true);
  });

  it("returns en unchanged", () => {
    expect(getMessages("en")).toEqual(en);
  });
});
