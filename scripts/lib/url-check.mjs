/**
 * Reachability check for cited sources and external links.
 *
 * A URL passes when HEAD or GET (redirects followed) returns 2xx/3xx. Anything else — HTTP
 * errors, timeouts, DNS failures, refused connections — is retried twice with backoff and then
 * counts as a failure. 404/410 are definitive and not retried. The only tolerated error is a 403
 * on BOTH HEAD and GET from a known bot-blocking official site (allowlist below, extendable with
 * LINK_CHECK_403_OK_DOMAINS="a.gov,b.gov"); it is reported as a warning.
 */
import { hostnameOf, parseDomainList } from "./source-policy.mjs";

/** Official sites whose WAF answers automated requests with 403 while the page is fine in a browser. */
export const BOT_BLOCKING_DOMAINS = [
  "legifrance.gouv.fr",
  "service-public.fr",
  "impots.gouv.fr",
  "economie.gouv.fr",
  "irs.gov",
  "agenziaentrate.gov.it",
  "canada.ca",
  "ato.gov.au",
  "tax.gov.ae",
  "u.ae",
  "gov.il",
];

const UA = "Mozilla/5.0 (compatible; switzerlandresidency-link-check/1.0; +https://switzerlandresidency.ch)";
const okStatus = (s) => s >= 200 && s < 400;

function errorKind(err) {
  const code = err?.cause?.code ?? err?.code ?? "";
  if (err?.name === "AbortError" || err?.name === "TimeoutError" || /ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT|UND_ERR_HEADERS_TIMEOUT/.test(code)) return "timeout";
  if (/ENOTFOUND|EAI_AGAIN|EAI_NONAME/.test(code)) return "dns";
  return `network${code ? ` (${code})` : ""}`;
}

async function request(fetchImpl, url, method, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { method, redirect: "follow", signal: controller.signal, headers: { "User-Agent": UA, Accept: "text/html,application/pdf,*/*" } });
    try {
      await res.body?.cancel?.();
    } catch {
      /* ignore */
    }
    return { status: res.status };
  } catch (err) {
    return { status: 0, error: errorKind(err) };
  } finally {
    clearTimeout(timer);
  }
}

export function isBotBlockingHost(url, extra = parseDomainList(process.env.LINK_CHECK_403_OK_DOMAINS)) {
  const host = hostnameOf(url);
  return !!host && [...BOT_BLOCKING_DOMAINS, ...extra].some((d) => host === d || host.endsWith(`.${d}`));
}

/**
 * @param {string} url
 * @param {{ fetchImpl?: typeof fetch, retries?: number, timeoutMs?: number, sleep?: (ms: number) => Promise<void>, allow403?: (url: string) => boolean }} [opts]
 * @returns {Promise<{ ok: boolean, status: number, reason?: string, warning?: string }>}
 */
export async function checkUrl(url, opts = {}) {
  const {
    fetchImpl = fetch,
    retries = 2,
    timeoutMs = 12000,
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
    allow403 = (u) => isBotBlockingHost(u),
  } = opts;
  let last = { status: 0, error: "not tried" };
  let headGet403 = false;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(1000 * 2 ** (attempt - 1));
    const head = await request(fetchImpl, url, "HEAD", timeoutMs);
    if (okStatus(head.status)) return { ok: true, status: head.status };
    // Many servers mishandle HEAD (403/404/405/501, resets): always confirm with GET.
    const get = await request(fetchImpl, url, "GET", timeoutMs);
    if (okStatus(get.status)) return { ok: true, status: get.status };
    last = get;
    headGet403 = head.status === 403 && get.status === 403;
    if (get.status === 404 || get.status === 410) break;
  }
  if (headGet403 && allow403(url)) {
    return { ok: true, status: 403, warning: `${url} answers 403 to HEAD and GET (known bot-blocking official site) — accepted` };
  }
  const reason = last.status ? `HTTP ${last.status}` : last.error;
  return { ok: false, status: last.status, reason: `${reason} after ${retries + 1} attempt(s)` };
}

/**
 * Check several URLs (deduplicated, small concurrency).
 * @returns {Promise<{ errors: string[], warnings: string[] }>}
 */
export async function checkUrls(urls, opts = {}) {
  const unique = [...new Set(urls.map((u) => String(u).trim()).filter(Boolean))];
  const errors = [];
  const warnings = [];
  const queue = [...unique];
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      const r = await checkUrl(url, opts);
      if (!r.ok) errors.push(`${url} is unreachable: ${r.reason}`);
      else if (r.warning) warnings.push(r.warning);
    }
  };
  await Promise.all(Array.from({ length: Math.min(opts.concurrency ?? 4, unique.length) }, worker));
  return { errors: errors.sort(), warnings: warnings.sort() };
}
