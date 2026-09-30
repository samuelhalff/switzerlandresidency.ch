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
| `NEXT_PUBLIC_FORMSPARK_ID` | – | Formspark form ID. All written enquiries go through Formspark — the site publishes no email address (the build validator rejects one in UI strings) |
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
deploy-script tests → build → `python3 scripts/deploy-ftp.py --dry-run` (logs the plan) →
`python3 scripts/deploy-ftp.py` over explicit FTPS → smoke test (`/en/`, `/fr/`, `/de/` = 200,
`/_archive-2026-09-30/index.php` = 403, `/.deploy-manifest.json` = 403).

How `scripts/deploy-ftp.py` works (details in its docstring):

- It hashes `out/` into a manifest and diffs it against `.deploy-manifest.json` from the previous
  deploy, so only changed files are uploaded.
- Phase 1 uploads changed build assets (`_next/`, `images/`, fonts) in place — they are new names,
  so live pages are unaffected. Phase 2 uploads every other changed file to `<path>.deploy-tmp`
  and renames it over the live file (atomic per file, no 404 window); `.htaccess` goes last.
- It then writes the new manifest and deletes only files listed in the old manifest that are no
  longer built, plus their emptied directories. It never lists or deletes anything else.
- A `.deploy-journal.json` makes a crashed run recoverable: the next run cleans its tmp files and
  orphans. `public/.htaccess` denies web access to all `.deploy-*` files.
- Protected paths (`_archive-*`, `.ftpquota`, `.well-known/`, `cgi-bin/`) are asserted before every
  upload, rename, delete and rmdir; a violation aborts the run.
- **Bootstrap:** the first run finds no manifest on the server, so it uploads everything once and
  deletes nothing. Files that only the old lftp mirror knew about are never cleaned up by the script.
- Local use: `set -a; . ./.env.deploy; set +a; python3 scripts/deploy-ftp.py --dry-run`
  (`--old-manifest none|FILE` plans offline without connecting). Tests:
  `python3 -m pytest scripts/tests` or `python3 scripts/tests/test_deploy_plan.py`.

Repository secrets: `FTP_HOST`, `FTP_PORT`, `FTP_USER`, `FTP_PASS` (passed as `DEPLOY_*`).
Repository variables: `NEXT_PUBLIC_*` (see above), optional `FTP_DIR` (web root relative to the FTP login).

When HTTPS is live: set `NEXT_PUBLIC_NOINDEX=false`, switch the smoke test to `https://`, and
uncomment HSTS in `public/.htaccess`.

## Automated guides

`.github/workflows/ai-articles.yml` writes one new guide in EN, FR and DE every 3 days
(`0 5 */3 * *`, 05:00 UTC) and can be run by hand (Actions → "AI guides" → Run workflow, with
`dry_run` and an optional backlog `slug`). The pipeline is modelled on ark-fid.ch's ressources job.

How a run works (`scripts/ai-article.mjs`):

1. **Topic** — from `content/backlog.json`: the highest-priority (`1` first, then file order) item
   with `status: "todo"` whose slug is not yet in `content/en/guides/`. It never picks the same
   category as the previous generated guide (tracked in `history`) unless only that category is
   left. A `slug` input bypasses priority and diversity.
2. **Keywords and trends** (best effort, never fails the run) — Google autocomplete for the backlog
   keywords and question forms in en-GB/US/AE/SG, fr-CH/FR/BE, de-CH/DE/AT, plus Google "trending
   now" for CH/GB/FR/DE/AE. Candidates become a primary and 5–10 secondary keywords per language.
   All of this third-party text is sanitised (control characters and markup stripped, length
   capped) and fenced in an "untrusted data" block the model is told never to take instructions from.
3. **Facts** — `research/legal-facts.md` (read whole at run time) plus the verified sections of
   every `research/audit-*.md`, with every UNVERIFIED sentence removed. If a research model is
   configured, a fact is kept only when its verbatim evidence quote is found on the fetched official
   page (whitespace/typography normalised) and contains the fact's key terms and numbers; only
   those quotes enter the prompt and the grounding corpus. Nothing is written to `legal-facts.md`.
4. **Writing** — Azure OpenAI chat completions: outline → EN draft (following
   `docs/CONTENT-GUIDE.md`, with the internal-link list generated from the content files) → FR and
   DE in one pass each (following `docs/TRANSLATION-GUIDE.md`). Each step is repaired up to
   3 times with the failed checks fed back.
5. **Guardrails** (`scripts/validate-new-article.mjs`, run again as its own workflow step) —
   frontmatter complete incl. `keywords`; title ≤ 60 and description 140–155 characters; 1,100–2,000
   words (EN; 950–2,400 for FR/DE); Key facts box, ≥ 2 question H2s, "How we help", disclaimer;
   ≥ 3 internal links that all resolve plus a CTA to the eligibility check or contact; ≥ 3 sources,
   ≥ 2 official, all on the allowed-domain list (`scripts/lib/source-policy.mjs`); no pricing
   language, email addresses, guarantee/garanti/garantiert or UNVERIFIED; the legal-audit phrases
   ("183 days" as the Swiss test, "5× rent", "residency by investment", "minimum tax of CHF 435,000",
   unqualified "no inheritance/wealth tax"); no testimonials, client counts, years of experience or
   star ratings; no price assertions (multilingual cost/fee/price lexicon near an amount, "from
   CHF …", "per hour"; statutory amounts from the fact base stay allowed); links parsed from the
   Markdown AST (inline, reference-style, autolinks, raw `<a href>`); every number in every locale
   found in the fact base with the same unit (citation numbers such as art./para./SR and dates of
   cited acts excepted), legal thresholds written as digits; no figure that exists only as
   UNVERIFIED; the same numbers — small ones included — in EN, FR and DE (thousands `,` `'` space,
   decimal comma normalised); the full `node scripts/validate-content.mjs`; and every cited source
   and external link reachable (non-2xx/3xx, timeouts and DNS failures fail after 2 retries; only
   known bot-blocking official sites may answer 403, extend with `LINK_CHECK_403_OK_DOMAINS`). Any
   failure deletes the three files, so nothing is committed, and the job fails with the reasons.
6. **Publish** — `npm test` and `npm run build`, then commit
   `content(guides): <title> (EN/FR/DE)` (the three files + `content/backlog.json`, item marked
   `done`) and push to `main`. After every rebase onto a moved `main` the guardrails, `npm test`
   and `npm run build` run again before the push. With `PAT_TOKEN` the push starts "Build and deploy"; without it the
   job starts `deploy.yml` itself. Only when the repository variable `NEXT_PUBLIC_NOINDEX` is not
   `true` (unset counts as `true`), the job waits for the page to go live, pings the sitemap and
   submits the EN/FR/DE URLs to IndexNow.

Local runs: `node scripts/ai-article.mjs --dry-run` prints the topic, keywords and outline and
writes nothing (with Azure credentials exported it asks the model for the outline; without, it
prints a template outline). `--apply` generates and writes; `--offline` skips keyword research.
`node scripts/validate-new-article.mjs --slug <slug>` re-checks a guide. Unit tests live in
`scripts/lib/*.test.mjs` (part of `npm test`).

**Secrets** (Settings → Secrets and variables → Actions):

| Name | Kind | Needed |
|---|---|---|
| `AZURE_OPENAI_ENDPOINT` | secret | yes, e.g. `https://<resource>.openai.azure.com/` |
| `AZURE_OPENAI_API_KEY` | secret | yes |
| `AZURE_OPENAI_DEPLOYMENT` | secret | yes, e.g. `gpt-4.1` or `gpt-5.2` |
| `AZURE_OPENAI_API_VERSION` | secret | yes, e.g. `2025-01-01-preview` |
| `PAT_TOKEN` | secret | optional; fine-grained token with contents write on this repo, so the push itself triggers the deploy |
| `INDEXNOW_KEY` | secret | optional; by default the committed key file `public/<key>.txt` is used. If you set it, deploy a matching `public/<key>.txt` too |
| `AZURE_OPENAI_RESEARCH_ENDPOINT`, `AZURE_OPENAI_RESEARCH_API_KEY` | secret | optional research model (key defaults to the main one) |
| `AZURE_OPENAI_RESEARCH_DEPLOYMENT`, `AZURE_OPENAI_RESEARCH_API_VERSION`, `AZURE_OPENAI_TRANSLATE_DEPLOYMENT` | variable | optional |

**Adding topics:** append an item to `content/backlog.json`:

```json
{
  "slug": "moving-to-basel",
  "title": "Moving to Basel: what new residents should know",
  "audience": "client",
  "category": "where-to-live",
  "keywords": { "en": ["moving to basel"], "fr": ["s'installer à bâle"], "de": ["umzug nach basel"] },
  "intent": "informational",
  "priority": 2,
  "status": "todo",
  "source": "why this topic",
  "notes": "optional guidance for the writer (angle, facts to avoid)"
}
```

`audience` is `client` or `adviser`; `category` is one of the 7 guide categories; `priority` is
1–3; `status` is `todo`, `done` or `skipped`. Put the most important search phrase first in each
`keywords` list and keep the slug keyword-led. `npm test` validates the backlog. Facts the guide
needs must be in `research/legal-facts.md` (or a verified `research/audit-*.md` section) first.

**Pausing:** Actions → "AI guides (every 3 days)" → ⋯ → Disable workflow (or
`gh workflow disable ai-articles.yml`). To skip one topic, set its `status` to `skipped`.
