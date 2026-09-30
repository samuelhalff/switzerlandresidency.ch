# switzerlandresidency.ch — build plan (2026-09-30)

## Goal
Lead-generation site for wealthy individuals/families who want to settle in Switzerland
(from UK, EU, Gulf, Americas, Asia). Warm, welcoming, not corporate. Operated discreetly
by Ark Fiduciaire SA (Geneva) — subtle "part of the Ark group" mention + backlink, like Ridger.
No prices shown. Leads = contact form + WhatsApp + an interactive eligibility & cost check.

## Decisions (made by Claude, user delegated)
- **Hosting:** GoDaddy shared hosting, FTP(S) only (no SSH/Node) → **fully static site**.
  Old hacked WordPress moved to `/_archive-2026-09-30/` (deny-all .htaccess, verified 403).
  Deploy must never delete `_archive-*`, `.ftpquota`, `.well-known/`, `cgi-bin`.
- **HTTPS:** origin cert expired 2022 → user must enable SSL (cPanel AutoSSL) or we front
  with Cloudflare. Until then: `NEXT_PUBLIC_NOINDEX=true` (noindex + robots disallow).
- **Stack:** Next.js 15 (`output: "export"`, `trailingSlash: true`), React 18, TypeScript,
  Tailwind 3.4 — same versions as ridger.ch for familiarity; fresh minimal codebase (ridger
  relies on middleware/nonce/API routes which static export can't use).
  Node 20 in CI.
- **i18n:** EN canonical + FR + DE. Routes `/en/…`, `/fr/…`, `/de/…` via `generateStaticParams`.
  Root `/` → Apache `.htaccess` 302 to best Accept-Language locale (fallback `/en/`),
  plus a static `index.html` meta-refresh fallback. UI strings in `src/i18n/<locale>.json`;
  articles as Markdown with frontmatter in `content/<locale>/<slug>.md`
  (shared `translationKey` frontmatter links language versions for hreflang).
  Build-time validator: UI key parity across locales + every article has all 3 locales
  (or is explicitly flagged) + no internal link to a non-existent route.
- **Design — quiet, photo-led, warm (revised 2026-09-30):** ivory `#F5F0E8`, warm charcoal `#2A2622`,
  ONE accent: deep umber `#7A4A2E` (clay `#D9A27E` in dark); warm espresso dark mode `#1A1714`.
  Light/dark/system toggle (localStorage `sr-theme`, `[data-theme]` on <html>, inline head script
  against flash). Light Fraunces headlines with one italic accent word, Inter 17px body.
  Full-bleed photography with plain captions, hairline rows, photo-led tiles, small radii
  (pill only for buttons), one primary button per view with ark-fid.ch's wave hover.
  Components in `src/components/ui/`; home photo slots in `homeImages` (`src/lib/images.ts`).
- **Pages:** Home · How it works · Services (Residence permit & lump-sum taxation ·
  Tax rulings · Home search & purchase · Settling in · Ongoing tax & wealth) ·
  Cantons hub + canton pages (lump-sum cantons first; all 26 listed incl. abolished ones) ·
  Moving from… (UK · EU · Gulf · US/Americas · Asia) · Eligibility check · Guides (articles) ·
  About (Ark group link) · Contact · Privacy · Legal notice.
- **Eligibility & cost check:** client-only, deterministic rules from research/seo-topics.md §4
  (nationality → EU/non-EU route; employment intent; lump-sum eligibility; canton fit;
  family/schools; property). Output = indicative route + next steps + pre-filled contact form.
  Conservative wording, no prices, "indicative, not advice". No data leaves the browser
  unless the user submits the form.
- **Forms:** Formspark (`NEXT_PUBLIC_FORMSPARK_ID`), honeypot + Botpoison-free; no public email
  address (owner decision 2026-09-30: everything goes through Formspark). WhatsApp link (same number as Ark? → user).
- **Analytics/ads:** GA4 (`NEXT_PUBLIC_GA_ID`) consent-gated via cookie banner (Consent Mode v2),
  events: check_start, check_complete, generate_lead (method=form|check), contact_channel_click.
- **SEO/GEO:** per-page metadata, canonical, hreflang (en/fr/de/x-default), static sitemap.xml,
  robots.txt, llms.txt, JSON-LD (Organization with parentOrganization Ark Fiduciaire SA,
  WebSite, Service, Article, FAQPage, BreadcrumbList). Fact boxes + dated official citations
  in every article (GEO citability). OG image per section.
- **Security headers** via `.htaccess` (CSP without nonces: scripts 'self' + GA + Formspark,
  HSTS once HTTPS works, X-Content-Type-Options, Referrer-Policy, Permissions-Policy,
  frame-ancestors 'none'). Static site = no PHP executed from our deploy.
- **Content:** facts from research/legal-facts.md only (each number cited to an official source,
  "verified <date>"). ~24 EN articles at launch (P1 topics from research/seo-topics.md),
  FR/DE natively translated. Service/canton/origin pages written from the same facts.
  Legal-accuracy review of all tax/permit content (Codex + second model) before publish.
- **CI/CD:** private GitHub repo samuelhalff/switzerlandresidency.ch. Actions: install → lint →
  typecheck → validate content/i18n → build → lftp mirror (FTPS) `out/` → web root with
  `--delete` excluding protected paths. Secrets: FTP_HOST/PORT/USER/PASS.
  Post-deploy smoke test (home 200 per locale, archive 403).

## Order of work
1. Scaffold + design system + layout/nav/footer + i18n + validator.
2. Core pages + eligibility check + contact.
3. SEO plumbing (metadata, JSON-LD, sitemap, hreflang, llms.txt, .htaccess).
4. Content: services/cantons/origins → articles (agents, parallel) → FR/DE.
5. Reviews (Codex diff review; legal-accuracy review) → CI → deploy (noindex until HTTPS).

## User actions (blockers)
- Enable HTTPS (GoDaddy AutoSSL) or approve Cloudflare in front.
- Formspark form ID; WhatsApp number.
- GA4 property + GSC property; rotate FTP/cPanel password (shared in chat, account was hacked);
  drop the old WordPress database in cPanel.

## Research inputs
- research/seo-topics.md — 43 topics / 7 clusters, eligibility-check spec (§4), schema patterns.
  Ahrefs API unavailable on plan → volumes are estimates.
- research/legal-facts.md — cited fact base (in progress).
- Cannibalisation check (GSC, 2026-09-30): ark-fid.ch's "#1 for forfait fiscal suisse" was a
  single impression on an unrelated VAT article — no real ranking. FR pages target
  "forfait fiscal suisse" fully; the ark link stays in footer/about only.

## Codex plan review — resolutions (2026-09-30)
- Routing: **/en/, /fr/, /de/ prefixes everywhere**; `/` → 302 by Accept-Language (fallback /en/);
  hreflang x-default = /en/. (Overrides research/seo-topics.md root-EN suggestion.)
- Eligibility-check spec lives in research/seo-topics.md **§5**.
- Analytics events follow research spec: `eligibility_start`, `eligibility_step_{n}`,
  `eligibility_result`, plus `generate_lead` (method=form|check), `contact_channel_click`.
- CSP: static export needs inline bootstrap scripts → `script-src 'self' 'unsafe-inline'`
  + GA/GTM hosts (no 'unsafe-eval'); everything else strict. Revisit with hashes later.
- Content work starts only after research/legal-facts.md lands; UNVERIFIED items are not published.
- Deploy workflow encodes protected-path excludes and a post-deploy smoke test
  (locale homes 200, `/_archive-2026-09-30/` 403).
- .env stays local-only (gitignored, chmod 600); rotation is a user action.
