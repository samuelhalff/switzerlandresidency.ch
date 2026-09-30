/**
 * Eligibility & cost check — pure logic, implementing research/seo-topics.md §5.
 * Deterministic and client-side only. Output is an indicative route, never advice.
 */

export type Citizenship = "CH" | "EU" | "UK" | "US" | "OTHER";
export type OtherRegion = "GULF" | "ASIA" | "AMERICAS" | "OTHER";
export type TaxResidence =
  | "UK" | "FR" | "DE" | "IT" | "BE" | "AT" | "NO" | "EU_OTHER"
  | "GULF" | "US" | "CA" | "SG_HK" | "IN" | "OTHER" | "CH";
export type Activity = "NONE" | "ACTIVE" | "UNSURE";
/**
 * Unlimited Swiss tax liability (tax residence) in the last 10 years (art. 14 para. 1 DBG).
 * Previous lump-sum taxpayers may use the regime again (KS 44 §2.3).
 */
export type ChTaxHistory = "NO" | "ORDINARY" | "LUMP_SUM";
export type Household = "SINGLE" | "COUPLE";
export type AgeBand = "UNDER_55" | "55_PLUS";
export type Spending = "LT_300K" | "300_600K" | "600K_1M" | "GT_1M" | "NA";
export type Region = "LAKE_GENEVA" | "ALPS" | "CENTRAL" | "TICINO" | "ZURICH_BASEL" | "OPEN";
export type Timeline = "LT_6M" | "6_12M" | "GT_12M" | "EXPLORING";

export type Answers = {
  citizenships: Citizenship[];
  otherRegion?: OtherRegion;
  taxResidence: TaxResidence;
  activity: Activity;
  household: Household;
  children: boolean;
  age: AgeBand;
  chTaxLast10y: ChTaxHistory;
  spending: Spending;
  region: Region;
  timeline: Timeline;
};

export type RouteCode = "R0" | "R1_NONE" | "R1_ACTIVE" | "R1_UNSURE" | "R2" | "R3" | "R4";
export type LumpSumCode = "MAY_BE_ELIGIBLE" | "UNLIKELY" | "NOT_AVAILABLE" | "TO_ASSESS";
export type FlagCode =
  | "UK" | "FR" | "DE" | "MODIFIED" | "US_CITIZEN"
  /** Tax residence far from the EU: plan the move early (no permit-route statement). */
  | "PLAN_EARLY"
  /** Same, for applicants without Swiss or EU/EFTA citizenship: adds the non-EU route note. */
  | "PLAN_EARLY_NON_EU";
export type CantonCode =
  | "AG" | "AI" | "AR" | "BE" | "BL" | "BS" | "FR" | "GE" | "GL" | "GR" | "JU" | "LU" | "NE"
  | "NW" | "OW" | "SG" | "SH" | "SO" | "SZ" | "TG" | "TI" | "UR" | "VD" | "VS" | "ZG" | "ZH";

export type CheckResult = {
  /** First item is the primary route; further items are "also worth discussing". */
  routes: RouteCode[];
  lumpSum: LumpSumCode;
  /** Married couple + may be eligible: both spouses must meet the conditions (art. 14 para. 2 DBG). */
  coupleNote: boolean;
  /** R4 without a lump-sum fit: residence is usually linked to lump-sum taxation. */
  r4Flag: boolean;
  flags: FlagCode[];
  cantons: CantonCode[];
};

/** Cantons that have abolished lump-sum taxation (research §5.2 step 4 — verify yearly). */
export const NO_LUMP_SUM_CANTONS: CantonCode[] = ["ZH", "BS", "BL", "SH", "AR"];

/** Spending at or above CHF 600k counts as "high" for the 55+ route choice (§5.2 step 1). */
const HIGH_SPENDING: Spending[] = ["600K_1M", "GT_1M"];

export function permitRoutes(a: Pick<Answers, "citizenships" | "activity" | "age" | "spending">): RouteCode[] {
  if (a.citizenships.includes("CH")) return ["R0"];
  if (a.citizenships.includes("EU")) {
    return [a.activity === "NONE" ? "R1_NONE" : a.activity === "ACTIVE" ? "R1_ACTIVE" : "R1_UNSURE"];
  }
  // Non-EU (UK, US, OTHER)
  if (a.activity === "ACTIVE") return ["R2"];
  if (a.activity === "UNSURE") return ["R2", "R4"];
  if (a.age === "55_PLUS") {
    // Retiree route, often combined with the fiscal-interest route; with high spending R4 leads.
    return HIGH_SPENDING.includes(a.spending) ? ["R4", "R3"] : ["R3", "R4"];
  }
  return ["R4"];
}

export function lumpSumStatus(
  a: Pick<Answers, "citizenships" | "activity" | "chTaxLast10y" | "spending">,
): LumpSumCode {
  if (a.citizenships.includes("CH") || a.activity === "ACTIVE" || a.chTaxLast10y === "ORDINARY") return "NOT_AVAILABLE";
  // Returning lump-sum taxpayers are not caught by the 10-year rule, but need a case review.
  if (a.chTaxLast10y === "LUMP_SUM" || a.activity === "UNSURE" || a.spending === "NA") return "TO_ASSESS";
  if (a.spending === "LT_300K") return "UNLIKELY";
  return "MAY_BE_ELIGIBLE";
}

/** No Swiss and no EU/EFTA citizenship: the non-EU permit routes apply. */
function isNonEu(citizenships: Citizenship[]): boolean {
  return !citizenships.includes("CH") && !citizenships.includes("EU");
}

export function originFlags(a: Pick<Answers, "citizenships" | "taxResidence">): FlagCode[] {
  const flags: FlagCode[] = [];
  switch (a.taxResidence) {
    case "UK":
      flags.push("UK");
      break;
    case "FR":
      flags.push("FR");
      break;
    case "DE":
      flags.push("DE");
      break;
    case "IT":
    case "BE":
    case "AT":
    case "NO":
    case "CA":
    case "US":
      flags.push("MODIFIED");
      break;
    case "GULF":
    case "SG_HK":
    case "IN":
      // Tax residence says nothing about the permit route; only citizenship does.
      flags.push(isNonEu(a.citizenships) ? "PLAN_EARLY_NON_EU" : "PLAN_EARLY");
      break;
    default:
      break;
  }
  if (a.citizenships.includes("US")) flags.push("US_CITIZEN");
  return flags;
}

const REGION_CANTONS: Record<Exclude<Region, "ZURICH_BASEL" | "OPEN">, CantonCode[]> = {
  LAKE_GENEVA: ["GE", "VD", "VS"],
  ALPS: ["VS", "GR", "BE"],
  CENTRAL: ["ZG", "SZ", "NW"],
  TICINO: ["TI"],
};

/**
 * "Open to advice" without children: rank by spending band. Lower bands point to cantons whose
 * minimum base sits nearer the federal floor. Confirm against the 2026 cantonal table
 * (research/legal-facts.md) before relying on this ordering.
 */
const OPEN_WITH_CHILDREN: CantonCode[] = ["GE", "VD", "ZG"];
const OPEN_LOWER_BANDS: CantonCode[] = ["VS", "TI", "GR"];
const OPEN_HIGHER_BANDS: CantonCode[] = ["VD", "ZG", "GE"];
const OPEN_ORDINARY: CantonCode[] = ["ZH", "GE", "VD"];

export function suggestCantons(
  a: Pick<Answers, "region" | "children" | "spending">,
  lumpSum: LumpSumCode,
): CantonCode[] {
  const lumpSumInPlay = lumpSum !== "NOT_AVAILABLE";
  let list: CantonCode[];
  switch (a.region) {
    case "ZURICH_BASEL":
      list = lumpSumInPlay ? ["ZG", "SZ"] : ["ZH", "BS"];
      break;
    case "OPEN":
      if (a.children) list = OPEN_WITH_CHILDREN;
      else if (!lumpSumInPlay) list = OPEN_ORDINARY;
      else if (a.spending === "LT_300K" || a.spending === "300_600K") list = OPEN_LOWER_BANDS;
      else list = OPEN_HIGHER_BANDS;
      break;
    default:
      list = REGION_CANTONS[a.region];
  }
  if (lumpSumInPlay) list = list.filter((c) => !NO_LUMP_SUM_CANTONS.includes(c));
  return list.slice(0, 3);
}

export function evaluate(a: Answers): CheckResult {
  const routes = permitRoutes(a);
  const lumpSum = lumpSumStatus(a);
  return {
    routes,
    lumpSum,
    coupleNote: lumpSum === "MAY_BE_ELIGIBLE" && a.household === "COUPLE",
    // Only when R4 is a leading option (not merely the add-on to the retiree route).
    r4Flag: routes.includes("R4") && routes[0] !== "R3" && lumpSum !== "MAY_BE_ELIGIBLE",
    flags: originFlags(a),
    cantons: suggestCantons(a, lumpSum),
  };
}

/** Compact, PII-free summary passed to the contact form via sessionStorage. */
export const CHECK_STORAGE_KEY = "sr-check-result";

export type StoredCheck = {
  routes: RouteCode[];
  lumpSum: LumpSumCode;
  cantons: CantonCode[];
  flags: FlagCode[];
  answers: string;
  /** Human-readable lines in the visitor's language, shown on the contact form and sent with it. */
  summary: string[];
};

export function serializeAnswers(a: Answers): string {
  return [
    `citizenship=${a.citizenships.join("+")}${a.otherRegion ? `(${a.otherRegion})` : ""}`,
    `tax_residence=${a.taxResidence}`,
    `activity=${a.activity}`,
    `household=${a.household}`,
    `children=${a.children ? "Y" : "N"}`,
    `age=${a.age}`,
    `ch_tax_10y=${a.chTaxLast10y}`,
    `spending=${a.spending}`,
    `region=${a.region}`,
    `timeline=${a.timeline}`,
  ].join("; ");
}
