import { describe, expect, it } from "vitest";
import en from "@/i18n/en.json";
import fr from "@/i18n/fr.json";
import de from "@/i18n/de.json";
import { centeredScrollTop, errorSummary, isValidEmail, validateField, validateForm, type FieldRule } from "./form-validation";

const rules: FieldRule[] = [
  { name: "name", id: "cf-name", kind: "text", required: "name?" },
  { name: "email", id: "cf-email", kind: "email", required: "email?", invalid: "email format" },
  { name: "role", id: "af-role", kind: "select", required: "role?" },
  { name: "message", id: "cf-message", kind: "text", required: "message?" },
  { name: "consent", id: "cf-consent", kind: "checkbox", required: "tick the box" },
];

describe("isValidEmail", () => {
  it.each(["a@b.ch", "first.last+tag@sub.example.co.uk", "  padded@example.com  ", "jürg@müller.ch"])("accepts %s", (v) => {
    expect(isValidEmail(v)).toBe(true);
  });
  it.each(["", "plain", "a@b", "a@b.", "a@.ch", "@b.ch", "a@@b.ch", "a b@c.ch", "a@b..ch", "a@b.c", "a@b.c0m"])("rejects %j", (v) => {
    expect(isValidEmail(v)).toBe(false);
  });
});

describe("validateField", () => {
  it("requires non-blank text", () => {
    expect(validateField(rules[0], "")).toBe("name?");
    expect(validateField(rules[0], "   ")).toBe("name?");
    expect(validateField(rules[0], undefined)).toBe("name?");
    expect(validateField(rules[0], "Anna")).toBeNull();
  });
  it("distinguishes a missing email from a malformed one", () => {
    expect(validateField(rules[1], "")).toBe("email?");
    expect(validateField(rules[1], "anna@example")).toBe("email format");
    expect(validateField(rules[1], "anna@example.ch")).toBeNull();
  });
  it("requires a select choice", () => {
    expect(validateField(rules[2], "")).toBe("role?");
    expect(validateField(rules[2], "lawyer")).toBeNull();
  });
  it("requires a ticked checkbox (FormData 'on' or boolean)", () => {
    expect(validateField(rules[4], null)).toBe("tick the box");
    expect(validateField(rules[4], false)).toBe("tick the box");
    expect(validateField(rules[4], "")).toBe("tick the box");
    expect(validateField(rules[4], "on")).toBeNull();
    expect(validateField(rules[4], true)).toBeNull();
  });
});

describe("validateForm", () => {
  it("returns every error in field order for an empty form", () => {
    expect(validateForm(rules, {}).map((e) => e.id)).toEqual(["cf-name", "cf-email", "af-role", "cf-message", "cf-consent"]);
  });
  it("returns only the consent error when everything else is filled", () => {
    const errors = validateForm(rules, { name: "Anna", email: "anna@example.ch", role: "lawyer", message: "Hello" });
    expect(errors).toEqual([{ name: "consent", id: "cf-consent", message: "tick the box" }]);
  });
  it("returns nothing for a complete form", () => {
    expect(validateForm(rules, { name: "Anna", email: "anna@example.ch", role: "lawyer", message: "Hello", consent: "on" })).toEqual([]);
  });
});

describe("errorSummary", () => {
  const templates = { one: "1 field needs your attention.", many: "{count} fields need your attention." };
  it("picks singular / plural and fills the count", () => {
    expect(errorSummary(0, templates)).toBe("");
    expect(errorSummary(1, templates)).toBe("1 field needs your attention.");
    expect(errorSummary(4, templates)).toBe("4 fields need your attention.");
  });
  it("has a {count} placeholder in every locale's plural string and a message for every validated field", () => {
    for (const dict of [en, fr, de]) {
      const f = dict.contact.form;
      expect(f.errorSummaryMany).toContain("{count}");
      expect(errorSummary(3, { one: f.errorSummaryOne, many: f.errorSummaryMany })).toMatch(/3/);
      for (const key of ["name", "email", "emailFormat", "message", "consent", "firm", "role", "clientOrigin"] as const) {
        expect(f.errors[key].length).toBeGreaterThan(10);
      }
    }
  });
});

describe("centeredScrollTop", () => {
  const base = { scrollY: 1000, viewportHeight: 664, topInset: 72, bottomInset: 150 };
  it("centres a small element between the sticky header and the cookie banner", () => {
    const top = centeredScrollTop({ ...base, elementTop: 900, elementHeight: 50 });
    // Visible band: 72..514 (442px). Element (50px) centred → its top sits at 72 + 196 = 268.
    expect(1000 + 900 - top).toBe(268);
  });
  it("top-aligns an element taller than the visible band, under the header", () => {
    const top = centeredScrollTop({ ...base, elementTop: -300, elementHeight: 600 });
    expect(1000 - 300 - top).toBe(72 + 16);
  });
  it("clamps to the scrollable range", () => {
    expect(centeredScrollTop({ scrollY: 0, viewportHeight: 800, elementTop: 10, elementHeight: 20 })).toBe(0);
    expect(centeredScrollTop({ ...base, elementTop: 5000, elementHeight: 50, maxScroll: 3000 })).toBe(3000);
  });
});
