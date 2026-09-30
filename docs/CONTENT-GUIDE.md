# Content guide — switzerlandresidency.ch

Read fully before writing. Facts: **only** from `research/legal-facts.md`. Audience and angles:
`research/seo-topics.md` (§1 keywords, §2 gaps/GEO, §3 page templates, §4 topics).

## Voice
- Warm, calm, human, reassuring — a knowledgeable friend who has done this many times.
  Not corporate, not salesy, no hype, no exclamation marks, no clichés ("nestled", "look no further").
- "We" = Switzerland Residency (discreetly part of the Ark group, working with Ark Fiduciaire SA,
  Geneva). Mention the Ark link at most once per page and only where natural (e.g. services, about).
- Sentence case headings. Short paragraphs. Plain English (British spelling). Explain jargon once.
- Never show prices or fees. Never guarantee outcomes, permits, tax amounts or timelines.
  Say "indicative", "typically", "the canton decides". Cantonal practice varies — say so.
- No invented testimonials, client counts, years of experience or statistics.

## Accuracy rules (hard)
- Every figure, threshold, date or legal rule must come from `research/legal-facts.md`
  and be cited in `sources` frontmatter (official source preferred). Keep "as of <month year>"
  wording for figures that change (e.g. "CHF 435,000 federal minimum for 2026").
- Anything marked UNVERIFIED in legal-facts.md: do **not** state it as fact. Either omit it
  or phrase as "varies by canton; confirm in a ruling" without numbers.
- Proposals (e.g. the 2026 Lex Koller consultation) must be labelled as proposals, not law.
- Not tax/legal advice: each guide ends with one sentence noting it is general information
  as of the `updated` date and that a ruling/advice is needed for a specific situation.
- No US-person structuring advice; for the US say plainly what complicates things and suggest
  coordinating with a US adviser.

## GEO / SEO structure (every guide)
1. H1 is the title (the page renders it from frontmatter — do **not** repeat an H1 in the body).
2. Opening paragraph answers the core question directly in 2–3 sentences (quotable).
3. A "**Key facts**" box right after: a short bullet list or 2-column Markdown table of the
   5–7 most important cited facts (as of date).
4. H2 sections that match real search questions; use tables for comparisons (cantons, routes).
5. Internal links (3–6): to the eligibility check, the relevant service, canton/origin pages and
   related guides — **only** URLs from the list below.
6. A short "How we help" section (2–4 sentences) ending with a link to `/en/eligibility-check/`
   or `/en/contact/`.
7. 4–6 FAQ items in frontmatter `faq` (concise, factual answers; they become FAQPage schema).
8. Length: guides 1,200–2,000 words; service pages 700–1,100; origin pages 900–1,400;
   canton pages 600–900.

## Frontmatter (YAML) — exact fields
```yaml
---
title: "…"                # ≤ 60 chars ideally, includes main keyword
description: "…"          # 140–155 chars, answers the query, no clickbait
slug: "…"                 # from the list below, identical across locales
translationKey: "…"       # same as slug
collection: guides        # guides | services | cantons | origins | advisers
category: "…"             # guides only: lump-sum-taxation | residence-permits | moving-from |
                          # property | where-to-live | settling-in | tax-and-wealth
updated: "2026-09-30"
draft: false
cta: check                # optional: check | contact | adviser. Default by collection:
                          # guides → check, services/cantons/origins → contact, advisers → adviser
keywords:                 # optional; written by the article pipeline (scripts/ai-article.mjs)
  primary: "…"            # main search phrase in this language (used in title, description, opening)
  secondary: ["…", "…"]   # 5–10 related/question searches; emitted in Article JSON-LD, never shown
faq:
  - q: "…"
    a: "…"
sources:
  - label: "ESTV — Circular 44 (lump-sum taxation)"
    url: "https://…"
---
```
File path: `content/en/<collection>/<slug>.md` (EN). Adviser briefings: `content/<locale>/advisers/<slug>.md`
(no `category`; all three locales required; served at `/<locale>/for-advisers/<slug>/`). FR/DE later at `content/fr/…`, `content/de/…`
with the **same slug**; internal links then use `/fr/…` or `/de/…`.

## Allowed internal URLs (EN; swap /en/ for /fr/ or /de/ in translations)
- `/en/` · `/en/how-it-works/` · `/en/eligibility-check/` · `/en/contact/` · `/en/about/` ·
  `/en/for-advisers/` (+ `/en/for-advisers/<slug>/` once published) · `/en/contact/?type=adviser`
- `/en/services/` + `/en/services/<slug>/` for: residence-permit, lump-sum-taxation, tax-ruling,
  property-search-purchase, settling-in, ongoing-tax-wealth
- `/en/moving-from/` + `/en/moving-from/<slug>/` for: united-kingdom, european-union, gulf,
  americas, asia
- `/en/cantons/` + `/en/cantons/<slug>/` for: geneva, vaud, valais, ticino, graubunden, zug,
  schwyz, lucerne, bern, fribourg, zurich
- `/en/guides/` + `/en/guides/<slug>/` for: swiss-lump-sum-taxation, lump-sum-taxation-by-canton,
  how-lump-sum-tax-is-calculated, tax-ruling-before-moving, modified-lump-sum-tax-treaties,
  lump-sum-or-ordinary-taxation, residence-non-eu-financially-independent,
  switzerland-golden-visa, eu-citizens-b-permit-without-work, retiring-in-switzerland,
  swiss-permits-explained, moving-from-uk-after-non-dom, uk-non-doms-switzerland-italy-uae-monaco,
  moving-from-france, moving-from-germany, moving-from-usa, moving-from-uae-gulf,
  moving-from-asia, buying-property-lex-koller, lex-koller-reform-2026, holiday-homes-alps,
  best-cantons-wealthy-families, geneva-or-vaud, international-schools-switzerland,
  health-insurance-new-residents, first-90-days-checklist, inheritance-gift-tax
- Deep links: `/en/guides/<slug>/#<id>` (or `#<id>` on the same page). H2/H3 headings get an id
  from their text; table body rows get an id from their first cell, up to any "(". Id rule: lower
  case, accents removed, apostrophes dropped, other runs of punctuation/spaces → "-", repeats get
  "-2", "-3". Examples: "## How we help" → `#how-we-help`; row "Geneva (GE)" → `#geneva`
  (FR "Genève (GE)" → `#geneve`, DE "Genf (GE)" → `#genf`). The validator fails on a fragment that
  does not exist, so renaming a heading breaks links to it: search for the old id first.
  Implementation: `scripts/lib/heading-id.mjs` (shared by the renderer and the validator).
- External: official sources freely. No links to ark-fid.ch in content (footer/about handle it).

## Page templates
- **Service page:** what it covers → who it's for → how we work (steps) → what you get →
  typical questions we solve → related guides → CTA. No prices, no promises.
- **Origin page:** why people from X choose Switzerland now (facts) → the permit route for X
  nationals → tax interplay (exit rules at home, treaty, lump-sum flags) → practical settling-in
  notes → common pitfalls → how we help → related guides.
- **Canton page:** at a glance (lump-sum status + cited minimum base, main towns, languages,
  lifestyle) → lump-sum & other taxes (inheritance, wealth — cited only) → property notes →
  living there (schools/areas/lifestyle, factual, no rankings) → how we help. Zurich page:
  explain clearly it abolished lump-sum taxation (cite) and what options remain (ordinary taxation).
