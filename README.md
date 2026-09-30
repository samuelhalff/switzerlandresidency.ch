# switzerlandresidency.ch

Static, trilingual (EN · FR · DE) lead-generation site for families relocating to Switzerland.
Next.js 15 static export (`output: "export"`) deployed over FTPS to Apache shared hosting.
See `docs/PLAN.md` for the decisions behind it.

## Commands

Use Node 20 (`nvm use`).

| Command | What it does |
|---|---|
| `npm ci` | Install dependencies |
| `npm run dev` | Dev server on http://localhost:3100/en/ |
| `npm run validate` | Content + i18n validator (also runs automatically before `build`) |
| `npm run lint` | ESLint (Next config) |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Vitest unit tests (eligibility-check logic) |
| `npm run build` | Validate, then export the static site to `out/` |
| `npm run serve` | Serve `out/` on http://localhost:4600 (after a build) |

`.htaccess` rules (root language redirect, headers, 404) only apply on Apache; locally `/` falls back
to a meta-refresh + JS redirect.

### Environment (build time, all optional)

Copy `.env.example` to `.env.local`. In CI these come from repository variables/secrets.

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://switzerlandresidency.ch` | Canonical/hreflang/sitemap base |
| `NEXT_PUBLIC_NOINDEX` | – | `true` → `noindex, nofollow` on every page and `Disallow: /` in robots.txt. Keep `true` until HTTPS works |
| `NEXT_PUBLIC_GA_ID` | – | GA4 ID. Loaded only after cookie consent (Consent Mode v2, denied by default). No ID → no banner, no analytics |
| `NEXT_PUBLIC_FORMSPARK_ID` | – | Formspark form ID. Missing → the contact page shows a mailto link instead |
| `NEXT_PUBLIC_WHATSAPP` | – | WhatsApp number, digits only (`41791234567`). Empty → WhatsApp buttons are hidden |

## Structure

```
app/
  (root)/            "/" fallback redirect page (Apache normally 302s by Accept-Language)
  [locale]/          all pages, per locale: home, how-it-works, services, cantons, moving-from,
                     guides (+ category/[category]), eligibility-check, about, contact, privacy, legal-notice
  global-not-found.tsx   → out/404.html (trilingual)
  sitemap.ts · robots.ts · llms.txt/route.ts   (force-static)
content/<locale>/<collection>/<slug>.md       guides · services · cantons · origins
src/i18n/{en,fr,de}.json                       UI strings (en is the source of truth)
src/lib/                                        i18n, content loader, SEO/JSON-LD, eligibility logic, images map
src/components/                                 UI (server components; client only where interactive)
scripts/validate-content.mjs                    prebuild validator
public/.htaccess                                redirects, security headers, caching, 404
public/images/                                  self-hosted photos (see src/lib/images.ts)
```

## Adding content

Everything is picked up at build time: routes, hub listings, sitemap, hreflang and llms.txt.
You only add Markdown files.

### Add a guide in three languages

1. Choose a slug (lower-case-kebab, e.g. `lump-sum-taxation-2026`). Use the **same slug** in all three
   languages so the language switcher keeps the reader on the same page.
2. Create one file per language:

   - `content/en/guides/lump-sum-taxation-2026.md`
   - `content/fr/guides/lump-sum-taxation-2026.md`
   - `content/de/guides/lump-sum-taxation-2026.md`

3. Frontmatter (translate `title`, `description`, `faq`, source labels; keep `translationKey`,
   `slug` and `category` identical across languages):

   ```yaml
   ---
   title: "Swiss lump-sum taxation in 2026: who qualifies"
   description: "One or two sentences that answer the question directly. Under 155 characters."
   translationKey: "guide-lump-sum-2026"
   slug: "lump-sum-taxation-2026"
   updated: "2026-10-15"          # ISO date, shown on the page and used as dateModified
   published: "2026-10-15"        # optional, datePublished (defaults to updated)
   category: "lump-sum-taxation"  # one of the keys in guides.categories (src/i18n/en.json)
   draft: true                    # remove (or set false) when reviewed and ready
   faq:                           # optional; rendered on the page + FAQPage schema
     - q: "Can a Swiss national use lump-sum taxation?"
       a: "No. …"
   sources:                       # official sources, shown as a list
     - label: "Federal Tax Administration – lump-sum taxation"
       url: "https://www.estv.admin.ch/…"
   ---
   ```

4. Write the body in Markdown (GitHub tables are supported and scroll on mobile).
   Internal links must be absolute and locale-prefixed, with a trailing slash:
   `[eligibility check](/en/eligibility-check/)`, `[Geneva](/fr/cantons/geneva/)`.
5. Run `npm run validate`. It fails on broken internal links, missing frontmatter, unknown categories,
   and `TODO`/`lorem` in non-draft files; it warns when a published item is missing in a language.

Drafts (`draft: true`) are built and viewable at their URL, but are `noindex`, left out of listings,
the sitemap and llms.txt. Only publish content whose facts are verified (see `research/`).

Services, cantons and origins work the same way (`content/<locale>/services/…`, `…/cantons/…`,
`…/origins/…`, served under `/services/`, `/cantons/`, `/moving-from/`). The service and origin cards
on the hubs come from `src/i18n/*.json`; a card becomes a link once a published page with the same
slug exists. Canton slugs follow `src/lib/cantons.ts` (e.g. `geneva`, `graubunden`).

### UI strings

Edit `src/i18n/en.json` first, then the same key in `fr.json` and `de.json`. Use
`t(locale, "section.key")` in components (keys are type-checked). The validator fails the build if a
key is missing in any language or if code references a key that does not exist.

### Images

Put optimised `.webp` files in `public/images/` using the names in `src/lib/images.ts`
(`hero.webp`, `lake-*.webp`, `mountain-*.webp`, `city-*.webp`). Alt text lives in
`imageAlt` in the i18n files. Missing images fall back to a warm gradient.

## Deploy

`.github/workflows/deploy.yml` runs on push to `main` (or manually): lint → typecheck → test →
build → `lftp mirror --reverse --delete` of `out/` over explicit FTPS → smoke test
(`/en/`, `/fr/`, `/de/` = 200, `/_archive-2026-09-30/index.php` = 403).

Repository secrets: `FTP_HOST`, `FTP_PORT`, `FTP_USER`, `FTP_PASS`.
Repository variables: `NEXT_PUBLIC_*` (see above), optional `FTP_DIR` (web root relative to the FTP login).
The mirror never deletes `_archive-*`, `.ftpquota`, `.well-known/`, `cgi-bin/` or `.htaccess.bak*`.

When HTTPS is live: set `NEXT_PUBLIC_NOINDEX=false`, switch the smoke test to `https://`, and
uncomment HSTS in `public/.htaccess`.
