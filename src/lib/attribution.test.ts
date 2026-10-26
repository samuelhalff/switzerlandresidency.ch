import { describe, expect, it } from "vitest";
import { attributionFields, mergeVisit, referrerOrigin, type Attribution } from "./attribution";

const empty: Attribution = { pages: [] };

describe("attribution", () => {
  it("keeps first touch and allowlisted campaign tags only", () => {
    let a = mergeVisit(empty, {
      pathname: "/en/lump-sum/",
      search: "?utm_source=google&utm_medium=cpc&gclid=abc&email=x@y.z&fbclid=1",
      referrer: "https://www.google.com",
    });
    a = mergeVisit(a, { pathname: "/en/contact/", search: "?utm_source=newsletter" });
    expect(a.landing).toBe("/en/lump-sum/");
    expect(a.referrer).toBe("https://www.google.com");
    expect(a.utm_source).toBe("google");
    expect(attributionFields(a)).toEqual({
      attr_landing_page: "/en/lump-sum/",
      attr_referrer: "https://www.google.com",
      attr_utm_source: "google",
      attr_utm_medium: "cpc",
      attr_gclid: "abc",
      attr_pages: "/en/lump-sum/ > /en/contact/",
    });
  });

  it("dedupes and caps the page trail at 20", () => {
    let a = empty;
    for (let i = 0; i < 30; i++) a = mergeVisit(a, { pathname: `/p${i % 25}/`, search: "" });
    expect(a.pages).toHaveLength(20);
    expect(new Set(a.pages).size).toBe(20);
  });

  it("bounds value lengths", () => {
    const a = mergeVisit(empty, { pathname: "/x/", search: `?utm_campaign=${"a".repeat(500)}` });
    expect(a.utm_campaign).toHaveLength(150);
  });

  it("keeps only the origin of external referrers", () => {
    expect(referrerOrigin("https://news.example.com/a?b=c#d", "https://switzerlandresidency.ch")).toBe("https://news.example.com");
    expect(referrerOrigin("https://switzerlandresidency.ch/en/", "https://switzerlandresidency.ch")).toBeUndefined();
    expect(referrerOrigin("", "https://switzerlandresidency.ch")).toBeUndefined();
  });
});
