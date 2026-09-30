/** Canton page slugs are the lower-case English names, e.g. /cantons/geneva/. */
import type { CantonCode } from "./eligibility";

export const cantonSlugs: Record<CantonCode, string> = {
  AG: "aargau", AI: "appenzell-innerrhoden", AR: "appenzell-ausserrhoden", BE: "bern", BL: "basel-landschaft",
  BS: "basel-stadt", FR: "fribourg", GE: "geneva", GL: "glarus", GR: "graubunden", JU: "jura", LU: "lucerne",
  NE: "neuchatel", NW: "nidwalden", OW: "obwalden", SG: "st-gallen", SH: "schaffhausen", SO: "solothurn",
  SZ: "schwyz", TG: "thurgau", TI: "ticino", UR: "uri", VD: "vaud", VS: "valais", ZG: "zug", ZH: "zurich",
};
