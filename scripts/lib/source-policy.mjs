/**
 * Reference-source policy for published guides (port of ark-fid.ch's referenceValidator idea).
 *
 * Public `sources` must point to official authorities. A small second tier ("institutional":
 * tourism boards, schools) is tolerated for lifestyle facts but never counts towards the
 * minimum number of official sources. Anything else — law firms, fiduciaries, Big 4, relocation
 * agencies, press, competitors, our own group sites — is rejected.
 *
 * Runtime additions: REFERENCE_ALLOWED_DOMAINS="example.gov,other.gov" (comma-separated).
 * The blocklist always wins over runtime additions.
 */

/** Official sources. A domain matches itself and any subdomain (admin.ch covers fedlex.admin.ch). */
export const OFFICIAL_DOMAINS = [
  // Swiss federal government and portal
  "admin.ch",
  "ch.ch",
  // All 26 cantons
  "ag.ch", "ai.ch", "ar.ch", "be.ch", "bl.ch", "bs.ch", "fr.ch", "ge.ch", "gl.ch", "gr.ch", "ju.ch",
  "lu.ch", "ne.ch", "nw.ch", "ow.ch", "sg.ch", "sh.ch", "so.ch", "sz.ch", "tg.ch", "ti.ch", "ur.ch",
  "vd.ch", "vs.ch", "zg.ch", "zh.ch",
  // Swiss official bodies
  "ahv-iv.ch",
  "finma.ch",
  "snb.ch",
  "zefix.ch",
  // Origin-country and international authorities
  "gov.uk",
  "legislation.gov.uk",
  "irs.gov",
  "treasury.gov",
  "state.gov",
  "legifrance.gouv.fr",
  "impots.gouv.fr",
  "service-public.fr",
  "economie.gouv.fr",
  "gesetze-im-internet.de",
  "bundesfinanzministerium.de",
  "bzst.de",
  "bmf.gv.at",
  "ris.bka.gv.at",
  "agenziaentrate.gov.it",
  "fiscooggi.it",
  "finances.belgium.be",
  "belastingdienst.nl",
  "portaldasfinancas.gov.pt",
  "agenciatributaria.gob.es",
  "skatteetaten.no",
  "skatteverket.se",
  "canada.ca",
  "incometaxindia.gov.in",
  "iras.gov.sg",
  "ird.gov.hk",
  "tax.gov.ae",
  "u.ae",
  "monservicepublic.gouv.mc",
  "gov.mc",
  "sars.gov.za",
  "ato.gov.au",
  "gov.il",
  "oecd.org",
  "europa.eu",
];

/** Tolerated for lifestyle facts (tourism boards, schools); never counted as official. */
export const INSTITUTIONAL_DOMAINS = [
  "myswitzerland.com",
  "geneve.com",
  "region-du-leman.ch",
  "valais.ch",
  "ticino.ch",
  "graubuenden.ch",
  "luzern.com",
  "gstaad.ch",
  "fribourgregion.ch",
  "ecolint.ch",
  "isl.ch",
  "rosey.ch",
  "aiglon.ch",
  "zis.ch",
  "icsz.ch",
  "iszl.ch",
  "isbasel.ch",
  "tasis.ch",
  "stgeorges.ch",
];

/** Never allowed, even via REFERENCE_ALLOWED_DOMAINS: our group sites, firms, competitors, aggregators. */
export const BLOCKED_DOMAINS = [
  "switzerlandresidency.ch",
  "ark-fid.ch",
  "ridger.ch",
  "pwc.ch", "pwc.com", "kpmg.ch", "kpmg.com", "deloitte.com", "ey.com", "bdo.ch", "grantthornton.ch",
  "henleyglobal.com", "richmondchambers.com", "goldblum.ch", "pcd.ch", "lenzstaehelin.com",
  "wikipedia.org", "reddit.com", "quora.com", "medium.com", "linkedin.com", "facebook.com",
];

export function parseDomainList(raw) {
  return String(raw || "")
    .split(/[,\s]+/)
    .map((d) => d.trim().toLowerCase().replace(/^\*\./, ""))
    .filter(Boolean);
}

export function hostnameOf(url) {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return null;
    return u.hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return null;
  }
}

const matches = (host, domain) => host === domain || host.endsWith(`.${domain}`);

/**
 * Classify a source URL: "official" | "institutional" | "blocked" | "disallowed" | "invalid".
 * @param {string} url
 * @param {{ extraAllowed?: string[] }} [opts]
 */
export function classifySource(url, opts = {}) {
  const host = hostnameOf(url);
  if (!host) return "invalid";
  if (BLOCKED_DOMAINS.some((d) => matches(host, d))) return "blocked";
  const extra = opts.extraAllowed ?? parseDomainList(process.env.REFERENCE_ALLOWED_DOMAINS);
  if ([...OFFICIAL_DOMAINS, ...extra].some((d) => matches(host, d))) return "official";
  if (INSTITUTIONAL_DOMAINS.some((d) => matches(host, d))) return "institutional";
  return "disallowed";
}

export function isAllowedSource(url, opts) {
  const c = classifySource(url, opts);
  return c === "official" || c === "institutional";
}
