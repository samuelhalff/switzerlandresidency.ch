import { describe, expect, it } from "vitest";
import { ADS_CONSENT_KEY, CONSENT_KEY, OPT_IN_REGIONS, consentBootstrapScript } from "./consent";

function run(stored: string | null, ads: string | null = stored) {
  const appended: { src?: string }[] = [];
  const win: { dataLayer?: IArguments[]; gtag?: unknown; localStorage: { getItem: (k: string) => string | null } } = {
    localStorage: { getItem: (k: string) => (k === CONSENT_KEY ? stored : k === ADS_CONSENT_KEY ? ads : null) },
  };
  const doc = { createElement: () => ({}) as { src?: string }, head: { appendChild: (el: { src?: string }) => appended.push(el) } };
  new Function("window", "document", consentBootstrapScript("G-TEST123"))(win, doc);
  const calls = (win.dataLayer ?? []).map((a) => Array.from(a));
  return { calls, appended, win };
}

describe("consentBootstrapScript", () => {
  it("sets region defaults, then config, then loads gtag.js", () => {
    const { calls, appended, win } = run(null);
    expect(typeof win.gtag).toBe("function");
    expect(calls[0]).toEqual([
      "consent",
      "default",
      { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied", region: [...OPT_IN_REGIONS] },
    ]);
    expect(calls[1]).toEqual([
      "consent",
      "default",
      { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted", region: ["CH"] },
    ]);
    expect(calls[2]).toEqual(["consent", "default", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" }]);
    expect(calls[3]?.[0]).toBe("js");
    expect(calls[4]).toEqual(["config", "G-TEST123"]);
    expect(calls).toHaveLength(5);
    expect(appended[0]?.src).toBe("https://www.googletagmanager.com/gtag/js?id=G-TEST123");
  });

  it("covers the EEA and the UK but not Switzerland in the opt-in list", () => {
    expect(OPT_IN_REGIONS).toHaveLength(31);
    expect(OPT_IN_REGIONS).toContain("GB");
    expect(OPT_IN_REGIONS).not.toContain("CH" as never);
  });

  it.each(["granted", "denied"])("applies a saved %s choice before config", (value) => {
    const { calls } = run(value);
    expect(calls[3]).toEqual([
      "consent",
      "update",
      { ad_storage: value, ad_user_data: value, ad_personalization: value, analytics_storage: value },
    ]);
    expect(calls[4]?.[0]).toBe("js");
    expect(calls[5]).toEqual(["config", "G-TEST123"]);
  });

  it("treats a legacy analytics-only grant as analytics only", () => {
    const { calls } = run("granted", null);
    expect(calls[3]).toEqual(["consent", "update", { analytics_storage: "granted" }]);
  });

  it("treats a legacy refusal as a refusal of all four keys", () => {
    const { calls } = run("denied", null);
    expect(calls[3]).toEqual([
      "consent",
      "update",
      { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" },
    ]);
  });

  it("ignores unknown stored values", () => {
    const { calls } = run("yes");
    expect(calls.some((c) => c[1] === "update")).toBe(false);
  });
});
