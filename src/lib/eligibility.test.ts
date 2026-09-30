import { describe, expect, it } from "vitest";
import {
  evaluate,
  lumpSumStatus,
  originFlags,
  permitRoutes,
  serializeAnswers,
  suggestCantons,
  type Answers,
  type TaxResidence,
} from "./eligibility";

const base: Answers = {
  citizenships: ["UK"],
  taxResidence: "UK",
  activity: "NONE",
  household: "SINGLE",
  children: false,
  age: "UNDER_55",
  livedInChLast10y: false,
  spending: "600K_1M",
  region: "LAKE_GENEVA",
  timeline: "6_12M",
};
const a = (over: Partial<Answers>): Answers => ({ ...base, ...over });

describe("permitRoutes", () => {
  it("Swiss citizen → R0, even with other citizenships", () => {
    expect(permitRoutes(a({ citizenships: ["CH", "EU", "US"] }))).toEqual(["R0"]);
  });
  it("EU/EFTA → R1 variant by activity", () => {
    expect(permitRoutes(a({ citizenships: ["EU", "UK"], activity: "NONE" }))).toEqual(["R1_NONE"]);
    expect(permitRoutes(a({ citizenships: ["EU"], activity: "ACTIVE" }))).toEqual(["R1_ACTIVE"]);
    expect(permitRoutes(a({ citizenships: ["EU"], activity: "UNSURE" }))).toEqual(["R1_UNSURE"]);
  });
  it("non-EU working → R2", () => {
    for (const c of ["UK", "US", "OTHER"] as const) {
      expect(permitRoutes(a({ citizenships: [c], activity: "ACTIVE" }))).toEqual(["R2"]);
    }
  });
  it("non-EU unsure → R2 and R4", () => {
    expect(permitRoutes(a({ activity: "UNSURE" }))).toEqual(["R2", "R4"]);
  });
  it("non-EU not working, 55+ → R3 (with R4), or R4 first with high spending", () => {
    expect(permitRoutes(a({ age: "55_PLUS", spending: "300_600K" }))).toEqual(["R3", "R4"]);
    expect(permitRoutes(a({ age: "55_PLUS", spending: "LT_300K" }))).toEqual(["R3", "R4"]);
    expect(permitRoutes(a({ age: "55_PLUS", spending: "NA" }))).toEqual(["R3", "R4"]);
    expect(permitRoutes(a({ age: "55_PLUS", spending: "600K_1M" }))).toEqual(["R4", "R3"]);
    expect(permitRoutes(a({ age: "55_PLUS", spending: "GT_1M" }))).toEqual(["R4", "R3"]);
  });
  it("non-EU not working, under 55 → R4", () => {
    expect(permitRoutes(a({ citizenships: ["US"], age: "UNDER_55" }))).toEqual(["R4"]);
  });
});

describe("lumpSumStatus", () => {
  it("not available for Swiss, active, or recent Swiss residence", () => {
    expect(lumpSumStatus(a({ citizenships: ["CH"] }))).toBe("NOT_AVAILABLE");
    expect(lumpSumStatus(a({ activity: "ACTIVE" }))).toBe("NOT_AVAILABLE");
    expect(lumpSumStatus(a({ livedInChLast10y: true }))).toBe("NOT_AVAILABLE");
    // not-available wins over "to be assessed"
    expect(lumpSumStatus(a({ livedInChLast10y: true, activity: "UNSURE", spending: "NA" }))).toBe("NOT_AVAILABLE");
  });
  it("to be assessed when unsure or spending not given", () => {
    expect(lumpSumStatus(a({ activity: "UNSURE" }))).toBe("TO_ASSESS");
    expect(lumpSumStatus(a({ spending: "NA" }))).toBe("TO_ASSESS");
  });
  it("unlikely below CHF 300k", () => {
    expect(lumpSumStatus(a({ spending: "LT_300K" }))).toBe("UNLIKELY");
  });
  it("may be eligible from 300k up", () => {
    for (const s of ["300_600K", "600K_1M", "GT_1M"] as const) {
      expect(lumpSumStatus(a({ spending: s }))).toBe("MAY_BE_ELIGIBLE");
    }
  });
  it("EU citizens can be eligible too", () => {
    expect(lumpSumStatus(a({ citizenships: ["EU"] }))).toBe("MAY_BE_ELIGIBLE");
  });
});

describe("originFlags", () => {
  const cases: [TaxResidence, string[]][] = [
    ["UK", ["UK"]],
    ["FR", ["FR"]],
    ["DE", ["DE"]],
    ["IT", ["MODIFIED"]],
    ["BE", ["MODIFIED"]],
    ["AT", ["MODIFIED"]],
    ["CA", ["MODIFIED"]],
    ["US", ["MODIFIED"]],
    ["GULF", ["PLAN_EARLY"]],
    ["SG_HK", ["PLAN_EARLY"]],
    ["IN", ["PLAN_EARLY"]],
    ["EU_OTHER", []],
    ["OTHER", []],
    ["CH", []],
  ];
  it.each(cases)("tax residence %s", (taxResidence, expected) => {
    expect(originFlags({ citizenships: ["OTHER"], taxResidence })).toEqual(expected);
  });
  it("adds the US citizen flag from citizenship", () => {
    expect(originFlags({ citizenships: ["US"], taxResidence: "US" })).toEqual(["MODIFIED", "US_CITIZEN"]);
    expect(originFlags({ citizenships: ["EU", "US"], taxResidence: "GULF" })).toEqual(["PLAN_EARLY", "US_CITIZEN"]);
  });
});

describe("suggestCantons", () => {
  it("maps regions", () => {
    expect(suggestCantons(a({ region: "LAKE_GENEVA" }), "MAY_BE_ELIGIBLE")).toEqual(["GE", "VD", "VS"]);
    expect(suggestCantons(a({ region: "ALPS" }), "MAY_BE_ELIGIBLE")).toEqual(["VS", "GR", "BE"]);
    expect(suggestCantons(a({ region: "CENTRAL" }), "MAY_BE_ELIGIBLE")).toEqual(["ZG", "SZ", "NW"]);
    expect(suggestCantons(a({ region: "TICINO" }), "MAY_BE_ELIGIBLE")).toEqual(["TI"]);
  });
  it("Zurich/Basel: nearby lump-sum cantons unless lump sum is not available", () => {
    expect(suggestCantons(a({ region: "ZURICH_BASEL" }), "MAY_BE_ELIGIBLE")).toEqual(["ZG", "SZ"]);
    expect(suggestCantons(a({ region: "ZURICH_BASEL" }), "TO_ASSESS")).toEqual(["ZG", "SZ"]);
    expect(suggestCantons(a({ region: "ZURICH_BASEL" }), "UNLIKELY")).toEqual(["ZG", "SZ"]);
    expect(suggestCantons(a({ region: "ZURICH_BASEL" }), "NOT_AVAILABLE")).toEqual(["ZH", "BS"]);
  });
  it("open: children first, then spending band, ordinary taxation otherwise", () => {
    expect(suggestCantons(a({ region: "OPEN", children: true }), "MAY_BE_ELIGIBLE")).toEqual(["GE", "VD", "ZG"]);
    expect(suggestCantons(a({ region: "OPEN", children: true }), "NOT_AVAILABLE")).toEqual(["GE", "VD", "ZG"]);
    expect(suggestCantons(a({ region: "OPEN", spending: "300_600K" }), "MAY_BE_ELIGIBLE")).toEqual(["VS", "TI", "GR"]);
    expect(suggestCantons(a({ region: "OPEN", spending: "LT_300K" }), "UNLIKELY")).toEqual(["VS", "TI", "GR"]);
    expect(suggestCantons(a({ region: "OPEN", spending: "GT_1M" }), "MAY_BE_ELIGIBLE")).toEqual(["VD", "ZG", "GE"]);
    expect(suggestCantons(a({ region: "OPEN", spending: "NA" }), "TO_ASSESS")).toEqual(["VD", "ZG", "GE"]);
    expect(suggestCantons(a({ region: "OPEN" }), "NOT_AVAILABLE")).toEqual(["ZH", "GE", "VD"]);
  });
  it("never suggests a no-lump-sum canton while lump sum is in play, and max 3", () => {
    for (const region of ["LAKE_GENEVA", "ALPS", "CENTRAL", "TICINO", "ZURICH_BASEL", "OPEN"] as const) {
      for (const children of [true, false]) {
        const list = suggestCantons(a({ region, children }), "MAY_BE_ELIGIBLE");
        expect(list.length).toBeLessThanOrEqual(3);
        expect(list.some((c) => ["ZH", "BS", "BL", "SH", "AR"].includes(c))).toBe(false);
      }
    }
  });
});

describe("evaluate", () => {
  it("UK wealth manager under 55 → R4, may be eligible, UK flag, no R4 flag", () => {
    const r = evaluate(base);
    expect(r).toEqual({
      routes: ["R4"],
      lumpSum: "MAY_BE_ELIGIBLE",
      coupleNote: false,
      r4Flag: false,
      flags: ["UK"],
      cantons: ["GE", "VD", "VS"],
    });
  });
  it("couple note only when may be eligible and a couple", () => {
    expect(evaluate(a({ household: "COUPLE" })).coupleNote).toBe(true);
    expect(evaluate(a({ household: "COUPLE", spending: "LT_300K" })).coupleNote).toBe(false);
    expect(evaluate(a({ household: "SINGLE" })).coupleNote).toBe(false);
  });
  it("R4 flag when R4 leads without a lump-sum fit", () => {
    expect(evaluate(a({ spending: "LT_300K" })).r4Flag).toBe(true);
    expect(evaluate(a({ livedInChLast10y: true })).r4Flag).toBe(true);
    expect(evaluate(a({ activity: "UNSURE" })).r4Flag).toBe(true);
    expect(evaluate(a({ age: "55_PLUS", spending: "GT_1M", livedInChLast10y: true })).r4Flag).toBe(true);
  });
  it("no R4 flag when R3 leads or R4 is absent", () => {
    expect(evaluate(a({ age: "55_PLUS", spending: "LT_300K" })).r4Flag).toBe(false);
    expect(evaluate(a({ citizenships: ["EU"], spending: "LT_300K" })).r4Flag).toBe(false);
    expect(evaluate(a({ activity: "ACTIVE" })).r4Flag).toBe(false);
  });
  it("Swiss citizen working in Zurich → R0, not available, ordinary cantons", () => {
    const r = evaluate(a({ citizenships: ["CH"], activity: "ACTIVE", region: "ZURICH_BASEL", taxResidence: "CH" }));
    expect(r.routes).toEqual(["R0"]);
    expect(r.lumpSum).toBe("NOT_AVAILABLE");
    expect(r.cantons).toEqual(["ZH", "BS"]);
    expect(r.flags).toEqual([]);
  });
});

describe("serializeAnswers", () => {
  it("produces codes only", () => {
    expect(serializeAnswers(a({ citizenships: ["OTHER"], otherRegion: "GULF" }))).toBe(
      "citizenship=OTHER(GULF); tax_residence=UK; activity=NONE; household=SINGLE; children=N; age=UNDER_55; lived_ch_10y=N; spending=600K_1M; region=LAKE_GENEVA; timeline=6_12M",
    );
  });
});
