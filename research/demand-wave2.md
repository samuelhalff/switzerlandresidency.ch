# switzerlandresidency.ch: demand research and wave 2 content plan

_Prepared 2026-09-30. Builds on `research/seo-topics.md` §1–§4 and the 49 live EN pages. No legal or tax facts in this file: every fact on a new page must come from `research/legal-facts.md`._

---

## 0. Sources and limitations (read first)

| Source | Result | How it is used |
|---|---|---|
| GSC ark-fid.ch (`gseo`, 2026-03-01 → 09-29, query and query×page, plus a 12-month pull) | 3,842 queries. Relocation terms are almost absent: `forfait fiscal suisse` (1 impr, pos 1), `geneva residence permit` (1, pos 38), `permis de séjour suisse genève` (8, pos 59), `accompagnement installation suisse` (12–13, pos 22), `geneva immigration` (2), `wealth tax geneva` / `geneva wealth tax` (2 each, pos 40–52), `umzug kantonswechsel` (2, pos 2). Adjacent signals: `wealth preservation strategies for entrepreneurs in switzerland` (659 impr, pos 4.3), `swiss salary certificate school fees paid by employer…` (≈1,000 impr across variants, pos 5–10), `family office services switzerland` (183), `anobag` (≈600) | Real but thin. Confirms ark-fid is **not** ranking for relocation. Good news for cannibalisation, but little first-party demand data |
| GSC ridger.ch | 82 rows, all ≤9 impressions. Themes: family office / MFO, Nachlassplanung, consolidated reporting, custodian banks, Korrespondenzadresse, Geneva permits, Geneva schooling, household staff | Used only to map ridger's territory (§5) |
| switzerlandresidency.ch GSC | **Not in the service account's properties.** The site is new or unverified | Add the property now so wave 2 can be measured |
| Google autocomplete (suggestqueries), ~190 seeds across en-GB/US/AE/SG/IN/HK, fr-FR/CH/BE, de-DE/CH/AT, it-IT, nl-NL, sv-SE, es-ES, pt-BR, zh-CN | Worked. Raw output in session scratch (`ac.txt`, `ac2.txt`) | Main demand signal. **Autocomplete shows that people type a phrase, not how often** |
| Forums (Reddit, English Forum Switzerland) | **Blocked.** Reddit returns 403 to our agent and refuses via robots. englishforum.ch refused the connection. Only EFS thread titles came back through search (e.g. "Lowest lump-sum tax canton") | Forum questions in §1.3 come from EFS titles, Reddit-flagged autocomplete ("… reddit" suffixes), and PAA-style questions in competitor FAQs found with WebSearch. Treat them as **indicative** |
| Ahrefs | Plan still insufficient (see seo-topics §0) | No volumes. All volume words below are **estimates** |

**Key finding on audience B (advisers):** adviser-phrased seeds return **empty autocomplete** in every market: "swiss tax advisors for …", "cross border tax adviser switzerland", "relocating clients to switzerland", "swiss trust uk resident", "private client lawyer switzerland", "swiss relocation for executives", "where to move after non dom", "forfait fiscal suisse avis", "berater auswandern schweiz", "cgp expatriation suisse". Advisers do not search as advisers. They search the **technical sub-question** their client raises: treaty articles, TRF, exit-tax deferral, IHT treaty, pension transfer, "steuerberater schweiz für deutsche", "fiscaliste suisse france". So:
- Adviser pages should rank on technical cross-border terms and then convert with an adviser-specific CTA.
- The `/for-advisers/` hub is a **conversion and outreach asset** (LinkedIn, email, STEP-type events, GEO answers to "who can help my client relocate to Switzerland"). It is not a traffic page.

---

## 1. Top real queries found

Legend: Aud. A = prospective client, B = adviser/introducer. Source AC = autocomplete (market), GSC = Search Console, SEC = secondary (competitor FAQ / PAA via WebSearch / EFS thread title).

### 1.1 Queries (autocomplete and GSC)

| # | Query (verbatim) | Lang / market | Source | Aud. | Intent | Covered today? |
|---|---|---|---|---|---|---|
| 1 | swiss lump sum taxation calculator / cantons / program / for eu citizens / visa / reddit | EN-GB | AC | A | Commercial | Partly (no "EU citizens" or "calculator" section) |
| 2 | swiss forfait tax regime / switzerland forfait tax | EN-GB | AC | A/B | Commercial | Synonym missing from titles |
| 3 | switzerland lump sum tax residency · swiss lump sum tax residency | EN-GB/SG | AC | A | Commercial | Partly |
| 4 | switzerland tax residency rules / certificate / requirements · tax residency switzerland 183 days · how many days in switzerland to be tax resident · how to become a swiss tax resident | EN-GB/SG/US | AC | A/B | Info | **Gap** |
| 5 | swiss residence permit for non eu citizens / for uk citizens / for us citizens / for spouse | EN-AE | AC | A/B | Info/Comm. | Partly (no spouse/family page) |
| 6 | how to get swiss residency (by investment / as an american / as eu citizen) · how long to get swiss residency · how long to get swiss permanent residence | EN-GB/AE | AC | A | Info | **Gap: timeline** |
| 7 | swiss residency for uk citizens / canadians / indians / retirees | EN-GB/SG/IN | AC | A | Info | Canada and India **gaps** |
| 8 | switzerland golden visa price / requirements / for indian / amount / reddit · switzerland investor visa (for indian / cost) · does switzerland have investor visa · switzerland citizenship by investment | EN-AE/IN | AC | A | Commercial | Golden-visa page exists; H2s missing |
| 9 | can i move to switzerland from uk / us / canada / india · can americans live in switzerland · can a retired american live in switzerland | EN-GB/US | AC | A | Info | Partly |
| 10 | how much to retire in switzerland · is it expensive to retire in switzerland · how much to immigrate to switzerland · what is considered rich in switzerland · auswandern schweiz voraussetzungen vermögen | EN-US / DE-AT | AC | A | Info | **Gap** |
| 11 | uk pension transfer to switzerland · can i transfer my uk pension to switzerland · switzerland uk pension agreement · uk switzerland double tax treaty pensions | EN-GB | AC | A/B | Info | **Gap** |
| 12 | uk swiss double tax treaty iht · uk switzerland double tax treaty inheritance tax · uk inheritance tax after leaving uk | EN-GB | AC | **B**/A | Info | Weak (only a general inheritance page) |
| 13 | temporary repatriation facility (hmrc / rates / conditions / mixed funds) | EN-GB | AC | **B** | Info | **Gap**. Adviser-heavy term |
| 14 | where are uk non doms moving to · non dom switzerland · switzerland non dom regime | EN-GB | AC | A/B | Comm. | Covered |
| 15 | switzerland vs dubai tax / which is better · switzerland vs monaco tax · switzerland or monaco | EN-GB | AC | A | Comparison | Partly (inside the UK non-dom comparison) |
| 16 | swiss wealth tax rates by canton / calculator / for non residents · impôt sur la fortune suisse par canton / genève barème / à partir de combien · wealth tax geneva | EN-GB / FR-FR/CH / GSC ark | AC + GSC | A | Info | **Gap** |
| 17 | swiss bank account for us citizens / uk citizens / eu citizens · can a us citizen open a bank account in switzerland | EN-US | AC | A | Commercial | **Gap** |
| 18 | us citizen in switzerland taxes · does switzerland have a tax treaty with the us · fatca switzerland | EN-US | AC | A/B | Info | Partly (moving-from-usa) |
| 19 | buying property in switzerland with b permit / as an american / from uk / and get residency | EN-GB | AC | A | Commercial | Partly (H2s missing) |
| 20 | relocation agent switzerland · relocation services switzerland · agence relocation genève · relocation zug | EN-GB / FR-CH / DE-CH | AC | **B** (partners) / A | Commercial | **Gap** (partner page) |
| 21 | forfait fiscal suisse exemple / conditions / pour français / cantons / genève · calcul forfait fiscal suisse | FR-FR | AC | A | Commercial | FR twin of pillar |
| 22 | forfait fiscal vaud minimum · forfait fiscal minimum valais · imposition d'après la dépense genève / vaud / circulaire | FR-CH | AC | A/B | Commercial | Canton table (needs FR anchors) |
| 23 | ruling fiscal genève / vaud / valais / fribourg / exemple · steuerruling kanton zürich / luzern / bern / st. gallen | FR-CH / DE-CH | AC | **B**/A | Commercial | Ruling guide (needs canton H2s) |
| 24 | exit tax suisse sursis · exit tax sursis automatique suisse · exit tax france suisse | FR-FR | AC | **B**/A | Info | Partly (moving-from-france) |
| 25 | convention fiscale france suisse donation / succession / assurance vie / dividendes / plus value mobilière | FR-FR | AC | **B** | Info | **Gap** |
| 26 | succession france suisse double imposition · donation france vers suisse · droit de succession france suisse | FR-FR | AC | A/B | Info | **Gap** |
| 27 | fiscaliste suisse france · avocat fiscaliste suisse france · conseiller fiscal suisse france · conseiller en gestion de patrimoine suisse | FR-FR | AC | A (seeking a provider) | Commercial | **Gap**. Service-seeking |
| 28 | s'installer en suisse pour un français / pour la retraite / avec des enfants / sans travail / avec un titre de séjour français · quitter la france pour la suisse démarches | FR-FR | AC | A | Info | Partly (EN only today) |
| 29 | permis b suisse regroupement familial · permis b sans activité lucrative vaud / genève · ocpm permis b sans activité lucrative | FR-FR/CH | AC | A | Info | Partly |
| 30 | pauschalbesteuerung schweiz voraussetzungen / beispiel / welche kantone / einfach erklärt / berechnung · modifizierte pauschalbesteuerung | DE-DE/AT | AC | A/B | Commercial | DE twins |
| 31 | pauschalbesteuerung zug (voraussetzungen) / luzern / thurgau / bern / tessin / schwyz / graubünden · aufwandbesteuerung kreisschreiben | DE-CH | AC | **B**/A | Commercial | Thurgau has no page; "Kreisschreiben" is adviser language |
| 32 | wegzugsbesteuerung schweiz 5 jahre / stundung / dba / privatpersonen · erweiterte beschränkte steuerpflicht schweiz | DE-DE | AC | **B** | Info | Partly (moving-from-germany) |
| 33 | steuerberater schweiz für deutsche · steuerberater für schweiz und deutschland · steuerberater für schweizer steuerrecht | DE-DE | AC | A (seeking a provider) / B | Commercial | **Gap**. Service-seeking |
| 34 | erbschaftssteuer deutschland wohnsitz schweiz · dba erbschaftsteuer schweiz deutschland | DE-DE | AC | **B**/A | Info | **Gap** |
| 35 | wohnsitz schweiz rente aus deutschland steuer / immobilie deutschland steuer / zweitwohnsitz deutschland | DE-DE | AC | A | Info | Partly |
| 36 | als rentner in die schweiz auswandern (voraussetzungen / krankenversicherung) · umzug in die schweiz checkliste / zoll / mit hund | DE-DE | AC | A | Info | Partly |
| 37 | trasferirsi in svizzera da pensionato / con la famiglia · residenza fiscale svizzera requisiti · spostare residenza fiscale in svizzera | IT-IT | AC | A | Info | **Gap** (no IT market page) |
| 38 | emigreren naar zwitserland fiscaal / als gepensioneerde / pensioen · verhuizen naar zwitserland als belg · flytta till schweiz som pensionär / skatt | NL-NL / SV-SE | AC | A | Info | **Gap** |
| 39 | 瑞士移民条件 / 门槛 · 瑞士居留证申请 | ZH-CN | AC | A | Info | Gap (no ZH content planned; note only) |
| 40 | wealth preservation strategies for entrepreneurs in switzerland · business succession switzerland | EN | GSC ark (659 impr, pos 4) | A (owners pre-exit) | Info | **Gap** on the relocation side (ark-fid owns the corporate side) |
| 41 | accompagnement installation suisse · geneva immigration · permis de séjour suisse genève | FR/EN | GSC ark | A | Commercial | Covered by services (FR twin needed) |

### 1.2 Adviser (B) phrasings tested with no autocomplete

"swiss tax advisors for / consultants for", "cross border tax adviser switzerland", "relocating clients to switzerland", "advising clients moving to switzerland", "leaving uk for switzerland tax", "statutory residence test switzerland", "non dom regime alternatives", "swiss trust uk resident", "private client lawyer switzerland", "swiss relocation for executives", "destination services switzerland", "forfait fiscal suisse avis / montant", "cgp expatriation suisse", "berater auswandern schweiz", "pauschalbesteuerung schweiz dba deutschland", "unternehmensverkauf auswandern", "hong kong family office switzerland". "refer client to" and "introducer agreement" autocomplete only to generic, non-Swiss terms.

→ Adviser demand is **real but not typed as such**. It is captured through technical cross-border terms (rows 11–13, 23–25, 31–34) and through relationships and referrals.

### 1.3 Recurring client questions (indicative; forums blocked, see §0)

- "Which is the lowest lump-sum tax canton?" (EFS thread title; also the `welche kantone` / `cantons` autocomplete modifiers)
- "Can I get Swiss residency if I'm rich?" / "Is it true you must be rich?" (TheLocal PAA-style headline)
- "How much money do you need to move to / retire in Switzerland?"
- "Is there a Swiss golden visa or investor visa? How much does it cost?" ("reddit" suffix on golden visa and investment-visa seeds)
- "Can I work remotely for a foreign company or manage my own wealth under the forfait?" (competitor FAQs)
- "Does my spouse qualify / what if one of us works?" (competitor FAQs)
- "Can I buy a house with a B permit?" (autocomplete)
- "Can I transfer my UK pension?" / "Will the UK still charge IHT after I leave?" (autocomplete)
- "Switzerland or Dubai / Monaco / Italy: which is better for tax?" (autocomplete)
- "How long does the whole process take?" (autocomplete)
- "Moving to Switzerland from X, reddit" (UK, US, Canada, Singapore, India): people want lived experience and a realistic process

### 1.4 What intermediaries need (synthesis: competitor adviser offers from PwC, Richmond Chambers, Goldblum and PCD, plus referral-behaviour research)

- **Formats they forward:** one-page briefs (PDF), comparison tables (canton, route, origin country), process timelines with owner per step, document checklists, and an intake questionnaire ("questions to ask your client").
- **What makes them refer:** (1) the client relationship stays with them: we do not poach the banking, legal or asset-management mandate; (2) a clear written scope: what we do, what stays with the existing adviser; (3) speed: named contact and response time; (4) discretion: NDA on request, no marketing to the client; (5) credibility: dated, sourced content and a named Swiss-qualified reviewer; (6) proactive status updates to the referrer (the STRATMOR referral research: the adviser "cannot control the external experience").
- **What they fear:** being blamed for a failed permit or ruling, and fee surprises for the client. Answer with process transparency, not with prices (the site shows no prices).

---

## 2. Wave 2 plan: 25 new pages

Routes follow the live structure (`/guides/`, `/moving-from/`, `/cantons/`, `/services/`) plus a new `/for-advisers/` section. FR/DE slugs are localised as in seo-topics §3.1. "EC" = eligibility check. Every adviser page carries a **B CTA** ("Introduce a client" form variant, §4) and a **secondary A CTA** (EC).

### P1: build first (10)

| # | Working title (EN) | Slug | Aud. | Keywords EN / FR / DE | Intent | Format | Lead hook and CTA | Why (data) |
|---|---|---|---|---|---|---|---|---|
| 1 | For advisers and partners: relocating a client to Switzerland | `/for-advisers/` | B | swiss relocation partner for advisers, lump-sum taxation adviser switzerland / partenaire relocation suisse pour conseillers, forfait fiscal accompagnement conseiller / Partner Zuzug Schweiz für Berater, Pauschalbesteuerung Begleitung Steuerberater | Commercial | Landing page: scope table (we do / you keep), how an introduction works in 4 steps, discretion commitments, named contact, downloadable briefs, FAQ | "Introduce a client" form (partner variant) + "Get the adviser pack" (gated PDF bundle) | Owner brief. Adviser searches have no autocomplete (§1.2), so this page converts outreach, LinkedIn and GEO traffic ("who helps advisers relocate clients to Switzerland") |
| 2 | Referring a client to Switzerland: what we handle and what stays with you | `/for-advisers/referring-a-client/` | B | refer client switzerland relocation, working with a client's existing advisers / référer un client suisse relocation / Mandanten in die Schweiz begleiten | Commercial | Adviser brief with a RACI-style table (permit, ruling, property, schools, banking intro, filings × Us / You / Client) | "Introduce a client" + "Download as PDF" | Referral-trust drivers (§1.4). Keep the angle relocation scope only, because ridger owns "working with existing advisers" at family-office level (§5) |
| 3 | Swiss lump-sum taxation: a briefing for UK private-client advisers | `/for-advisers/uk-private-client-briefing/` | B | non dom switzerland, uk swiss double tax treaty iht, temporary repatriation facility, uk inheritance tax after leaving uk, swiss forfait | Info → Commercial | Adviser brief (2 pages + PDF): client profiles it fits and does not fit, sequencing UK exit vs Swiss arrival, questions for UK counsel | Gated PDF "UK adviser brief" + "Introduce a client" | AC rows 12–14. TRF and IHT-treaty terms are adviser-typed. The UK is the highest-value origin (seo-topics §1.5) |
| 4 | Swiss residence for non-EU clients: an adviser checklist | `/for-advisers/non-eu-client-checklist/` | B | swiss residence permit for non eu citizens, switzerland residency for indians, residence by investment switzerland / permis B état tiers sans activité / Aufenthaltsbewilligung Drittstaat ohne Erwerbstätigkeit | Commercial | Checklist (document list, profile screen, canton-choice factors, timeline) | Gated printable checklist + "Pre-screen a client anonymously" form | AC rows 5, 7, 8. Gulf, India and LatAm introducers need a forwardable document |
| 5 | Note pour conseillers : le forfait fiscal suisse pour vos clients français (FR-first) | `/fr/conseillers/forfait-fiscal-clients-francais/` (EN twin `/for-advisers/french-clients-briefing/`) | B | forfait fiscal suisse pour français, convention fiscale france suisse succession / donation / assurance vie, exit tax suisse sursis, fiscaliste suisse france, conseiller en gestion de patrimoine suisse | Info → Commercial | Adviser brief for CGP, notaires and avocats fiscalistes | Gated PDF + partner form (FR) | AC rows 24–27 are the deepest adviser-flavoured autocomplete of any market |
| 6 | Pauschalbesteuerung Schweiz: Briefing für Steuerberater deutscher Mandanten (DE-first) | `/de/berater/pauschalbesteuerung-deutsche-mandanten/` (EN twin `/for-advisers/german-clients-briefing/`) | B | steuerberater schweiz für deutsche, wegzugsbesteuerung schweiz stundung / 5 jahre, erweiterte beschränkte steuerpflicht schweiz, modifizierte pauschalbesteuerung, aufwandbesteuerung kreisschreiben | Info → Commercial | Adviser brief | Gated PDF + partner form (DE) | AC rows 30–34 |
| 7 | How long does it take to move to Switzerland? A realistic timeline | `/guides/swiss-residence-timeline/` | A + B | how long to get swiss residency, how long swiss residence permit / délai permis de séjour suisse / Dauer Aufenthaltsbewilligung Schweiz | Info | Process timeline (Gantt-style graphic, phase owners, printable) | "Get your timeline" → EC; PDF timeline "to share with your adviser" | AC row 6. seo-topics B6 is still unbuilt. Advisers forward timelines |
| 8 | Swiss tax residency: when you become (and stop being) tax-resident | `/guides/swiss-tax-residency/` | A/B | switzerland tax residency rules / certificate / 183 days, how to become a swiss tax resident / résidence fiscale suisse critères, résidence fiscale suisse ou france / steuerlicher Wohnsitz Schweiz, Wohnsitz Schweiz Steuern / IT: residenza fiscale svizzera requisiti | Info | Guide + FAQ (question-shaped H2s) | EC; link to ruling service | AC row 4, the broadest multi-market tax query set. seo-topics G1 is unbuilt |
| 9 | How much wealth do you need to live in Switzerland? | `/guides/how-much-wealth-to-move-to-switzerland/` | A | how much to retire in switzerland, can I move to switzerland if I'm rich, what is considered rich in switzerland / combien faut-il pour vivre en suisse / auswandern schweiz voraussetzungen vermögen | Info | Guide by route (EU vs non-EU vs 55+ vs lump sum), no invented numbers, figures only from legal-facts | EC: "see which route your profile fits" | AC row 10 + §1.3 (the highest-volume TOFU question with wealth intent) |
| 10 | Swiss wealth tax by canton: what new residents should know | `/guides/swiss-wealth-tax-by-canton/` | A | swiss wealth tax rates by canton, swiss wealth tax calculator / impôt sur la fortune suisse par canton, à partir de combien / Vermögenssteuer Schweiz Kantone | Info | Comparison table (sourced, dated) + CSV download | Gated CSV "wealth tax by canton" + EC | AC row 16 + GSC ark (`wealth tax geneva`). seo-topics G2 is unbuilt. Linkable data asset |

### P2 (10)

| # | Working title (EN) | Slug | Aud. | Keywords EN / FR / DE | Intent | Format | Lead hook and CTA | Why (data) |
|---|---|---|---|---|---|---|---|---|
| 11 | Leaving the UK for Switzerland: residence test, split year and the IHT tail | `/guides/leaving-uk-residence-iht/` | A (+B) | uk inheritance tax after leaving uk, uk swiss double tax treaty iht, temporary repatriation facility | Info | Guide; links to the UK adviser brief | EC (UK branch) + "Send this to my UK adviser" | AC rows 12–13. seo-topics C2 is unbuilt |
| 12 | UK pensions when you move to Switzerland | `/guides/uk-pension-moving-to-switzerland/` | A | uk pension transfer to switzerland, can i transfer my uk pension to switzerland, uk switzerland double tax treaty pensions | Info | Guide + FAQ | "Send to my adviser" + EC | AC row 11, a dense cluster. Retiree-heavy |
| 13 | Succession et donations France–Suisse : ce qui change quand on s'installe en Suisse (FR-first) | `/fr/guides/succession-donation-france-suisse/` | A/B | succession france suisse double imposition, donation france suisse, convention fiscale france suisse succession | Info | Guide + comparison table | FR notaire/CGP CTA + EC | AC rows 25–26. Distinct from ridger's Swiss-law succession basics (§5) |
| 14 | Erbschaftsteuer Deutschland–Schweiz nach dem Wegzug (DE-first) | `/de/ratgeber/erbschaftsteuer-deutschland-schweiz-wegzug/` | A/B | erbschaftssteuer deutschland wohnsitz schweiz, dba erbschaftsteuer schweiz deutschland | Info | Guide | DE Steuerberater CTA + EC | AC row 34 |
| 15 | US-connected clients moving to Switzerland: notes for advisers | `/for-advisers/us-client-briefing/` | B | us citizen in switzerland taxes, does switzerland have a tax treaty with the us, fatca switzerland, swiss bank account for us citizens | Info | Adviser brief | Gated PDF + partner form | AC rows 17–18. US CPAs and wealth managers need a scope memo |
| 16 | For relocation, destination-services and estate-agent partners | `/for-advisers/relocation-partners/` | B | relocation agent switzerland, relocation services switzerland, agence relocation genève, relocation zug / Relocation Service Schweiz | Commercial | Partner landing: what we add (permit, ruling, Lex Koller file) and how we hand back | Partner form (variant "relocation/property") | AC row 20. Relocation firms and prime agents meet clients before the tax decision |
| 17 | Opening a Swiss bank account as a new resident (including US persons) | `/guides/swiss-bank-account-new-resident/` | A | swiss bank account for us citizens / uk citizens, can a us citizen open a bank account in switzerland / ouvrir un compte en suisse résident / Schweizer Bankkonto eröffnen Zuzug | Commercial | Guide + onboarding document checklist | Checklist download + settling-in service | AC row 17. Stay on onboarding for movers; custodian selection belongs to ridger (§5) |
| 18 | Bringing your family: spouse, children and parents on a Swiss permit | `/guides/family-members-swiss-permit/` | A | swiss residence permit for spouse, permis b regroupement familial, s'installer en suisse avec des enfants / Familiennachzug Schweiz | Info | Guide + FAQ | EC (family branch) | AC rows 5, 28–29 |
| 19 | Switzerland or Dubai? A comparison for wealthy families | `/guides/switzerland-vs-dubai/` | A | switzerland vs dubai tax / which is better / cost of living, dubai vs switzerland reddit | Comparison | Side-by-side table (residence, tax model, schools, lifestyle, travel) with no numeric tax claims unless sourced | EC | AC row 15. Gulf audience plus UK leavers who are weighing Dubai |
| 20 | Selling your business and moving to Switzerland: getting the sequence right | `/guides/selling-business-then-moving-to-switzerland/` | A (owners) + B (M&A / corporate-finance advisers) | wealth preservation strategies for entrepreneurs in switzerland, auswandern schweiz unternehmer, vendre son entreprise et partir en suisse | Info | Guide + timeline (exit ↔ departure ↔ arrival) | "Send to my adviser" + EC | GSC ark: 659 impr, pos 4.3 on the entrepreneur query. Stay on personal relocation sequencing; corporate succession belongs to ark-fid (§5) |

### P3 (5)

| # | Working title (EN) | Slug | Aud. | Keywords | Intent | Format | Lead hook and CTA | Why (data) |
|---|---|---|---|---|---|---|---|---|
| 21 | Moving to Switzerland from Canada | `/moving-from/canada/` (or a section of `americas`) | A | moving to switzerland from canada (requirements / reddit), retiring in switzerland as a canadian, swiss residency for canadians | Info | Origin page | EC (Americas branch) | AC rows 7, 9 |
| 22 | Swiss residence for Indian families | `/guides/swiss-residence-for-indian-families/` | A (+B: Indian wealth managers) | switzerland residency for indians, switzerland golden visa for indian, investor visa for indian, can indian get pr in switzerland | Info/Comm. | Guide (non-EU route explainer) | EC + adviser checklist link | AC rows 7–8 (the India modifier recurs across 5 seeds). Refocus `moving-from-asia` on SG/HK |
| 23 | Moving to Switzerland from Italy, Belgium or the Netherlands | `/guides/moving-from-italy-benelux/` | A | trasferirsi in svizzera da pensionato, residenza fiscale svizzera requisiti; s'installer en suisse pour un belge; emigreren naar zwitserland fiscaal / pensioen | Info | Origin guide (EN + FR; IT/NL keywords in body and FAQ) | EC | AC rows 37–38 |
| 24 | 15 questions to ask a client before a Swiss move | `/for-advisers/client-intake-questions/` | B | (no search demand; GEO and outreach) | Tool | Downloadable intake questionnaire (fillable PDF) | Gated fillable PDF → "send it back to us" | Adviser format need (§1.4) |
| 25 | Moving to Thurgau: residence and lump-sum tax | `/cantons/thurgau/` | A/B | pauschalbesteuerung thurgau | Commercial | Canton page (template §3.3) | EC with canton pre-select | AC row 31 (Thurgau is the only autocomplete canton with no page) |

---

## 3. Improvements to existing pages (20)

1. **Origin vs guide cannibalisation (4 pairs).** `/moving-from/united-kingdom` vs `/guides/moving-from-uk-after-non-dom`, plus the same pattern for gulf / uae-gulf, americas / usa and asia / asia. Give the **hub** the head term ("Moving to Switzerland from the UK (2026)") and a commercial CTA. Re-title the **guide** to a distinct deep intent, e.g. "UK non-doms moving to Switzerland: the tax steps", and remove overlapping FAQs. Each page of a pair links to the other in its first 150 words.
2. **`services/tax-ruling` vs `guides/tax-ruling-before-moving`.** Near-identical titles and the same FAQ ("What is a Swiss tax ruling?"). Service title → "Tax ruling service for new Swiss residents". Guide → "Swiss tax ruling (ruling fiscal, Steuerruling) before you move", with H2s per canton (Geneva, Vaud, Valais, Fribourg, Zurich, Lucerne, Bern) to match the `ruling fiscal {canton}` / `steuerruling kanton {x}` autocomplete. Drop the duplicate FAQ from the service page.
3. **`services/property-search-purchase` vs `guides/buying-property-lex-koller`.** Identical title. Service → "Property search and Lex Koller authorisation support". Guide: add H2s "…with a B permit", "…as an American", "…as an EU citizen", "…from the UK", "Does buying property give you residency?" (all autocomplete).
4. **De-duplicate the 6 repeated FAQ questions** across pages ("Which cantons do not offer lump-sum taxation?", "Who can be taxed on a lump sum…", "Does lump-sum taxation affect inheritance tax?", "Can I switch back…", "Where are the international schools…", "What is a Swiss tax ruling?"). Keep each question on its canonical page and link to it from the others.
5. **`guides/swiss-lump-sum-taxation`.** Title/H1 → "Swiss lump-sum taxation (forfait) in 2026: who qualifies". Add H2/FAQ items "Lump-sum taxation for EU citizens", "Is there a lump-sum tax calculator?" (link to how-it's-calculated), and "Is the lump sum a visa or programme?" (link to golden-visa).
6. **`guides/lump-sum-taxation-by-canton`.** Add canton anchor IDs (`#vaud`) and a question-shaped FAQ per canton "minimum" (`forfait fiscal vaud minimum`, `forfait fiscal minimum valais`, `pauschalbesteuerung zug voraussetzungen`). Link from every canton page. Offer the table as a gated CSV (§4).
7. **Canton pages (11).** Add a "Tax ruling in {canton}" H2 linking to the ruling guide, and a "Minimum lump-sum base in {canton}" FAQ pointing to the table. Add an adviser footer line: "Adviser? Introduce a client".
8. **`guides/switzerland-golden-visa`.** Add H2s "Is there a Swiss investor visa?", "Golden visa for Indian nationals", "What does it cost?" (route-based, no invented prices) and "Citizenship by investment: does it exist?". Heavy en-AE and en-IN autocomplete.
9. **`guides/residence-non-eu-financially-independent`.** Title → "Swiss residence permit for non-EU citizens without work" (exact autocomplete phrase). Link to the new adviser checklist and the timeline.
10. **`guides/retiring-in-switzerland`.** Add H2s "Retiring in Switzerland as an American / a Canadian / from the UK" and "How much do you need?" (→ new P1 #9). FR twin should target "retraite en suisse pour un français". DE twin should target "als Rentner in die Schweiz auswandern: Voraussetzungen, Krankenversicherung".
11. **`guides/eu-citizens-b-permit-without-work`.** FR twin title should target "permis B sans activité lucrative (Vaud, Genève)". Add FAQs "…avec un titre de séjour français?" and "regroupement familial". DE twin: "Aufenthaltsbewilligung B ohne Erwerbstätigkeit".
12. **`guides/moving-from-france`.** FR twin title: "S'installer en Suisse pour un Français : permis, forfait, exit tax". Add H2s "Exit tax : le sursis", "Convention France–Suisse : succession, donation, assurance vie" (link to P2 #13), and "Vous êtes conseiller ?" (→ FR adviser note).
13. **`guides/moving-from-germany`.** Add H2s "Wegzugsbesteuerung: Stundung und 5-Jahres-Frage", "Erweiterte beschränkte Steuerpflicht", "Rente aus Deutschland", "Immobilie in Deutschland behalten". Link to the DE adviser brief and P2 #14.
14. **`guides/moving-from-usa` / `origins/americas`.** Add FAQs "Can Americans live in Switzerland?", "Can a US citizen open a Swiss bank account?" (→ P2 #17) and "Is there a US–Swiss tax treaty?". Link to the US adviser note.
15. **`guides/inheritance-gift-tax`.** Add H2s "UK–Switzerland IHT treaty", "France–Switzerland" and "Germany–Switzerland", each short and linking to its dedicated page. Add "Is there inheritance tax in Switzerland?" as the first FAQ (autocomplete).
16. **`guides/uk-non-doms-switzerland-italy-uae-monaco`.** H1 variant "Where are UK non-doms moving to? Switzerland vs Italy, UAE, Monaco". Add anchor H2s "Switzerland vs Monaco: tax" and "Switzerland vs Dubai: tax" (→ P2 #19). Add a "Send this comparison to your adviser" share block.
17. **`guides/international-schools-switzerland`.** Add a "Fees and admissions timing" H2 (`école internationale genève prix`, `international school fees`) and city anchors. Keep it national, because ridger has a Geneva schooling article (§5).
18. **`guides/first-90-days-checklist`.** Gate a printable PDF version (§4). DE twin title should target "Umzug in die Schweiz: Checkliste" (+ Zoll). FR twin should target "s'installer en suisse : démarches".
19. **CTAs by intent.** No page sets a CTA field today, so add `cta:` frontmatter. TOFU guides → EC. Canton, service and ruling pages → "Speak to a Swiss tax expert" (contact). Treaty and exit-tax pages (modified-lump-sum, moving-from-france/germany/usa, inheritance) → dual CTA "Check your route" + "Send to your adviser / Adviser? Introduce a client".
20. **Internal linking.** Most pages carry about 5 internal links. Add a **"Related for advisers"** block on the 12 most technical pages, a **For advisers** link in the header and footer (all locales), and hub→spoke links from each canton page to the 3 relevant origin guides. Verify the GSC property for switzerlandresidency.ch so these changes can be measured.

---

## 4. Lead capture on a static site (Formspark)

Shared mechanics: one Formspark form per variant or a hidden `form_variant` field; hidden fields `page_url`, `locale`, `lead_magnet`, `utm_source/medium/campaign` (read from the URL client-side); honeypot `_honeypot`; required `consent` checkbox (privacy link); redirect to `/thanks/?m={magnet}`, which shows the PDF link (soft gate, unguessable path); GA4 `generate_lead` with `method=download|partner|share|check` (extends the existing PLAN.md events). Keep the PDFs free of pricing and of any tax figures not in legal-facts.

| # | Idea | Where | Exact form fields |
|---|---|---|---|
| 1 | **Adviser pack** (gated PDF bundle: UK / FR / DE / US briefs, non-EU checklist, timeline) | `/for-advisers/`, every adviser brief | `name`* · `email`* (work) · `firm`* · `role`* (select: private banker / wealth manager / tax adviser / lawyer / family office / trust company / relocation or destination services / estate agent / school / other) · `country`* · `client_origin` (select: UK / EU / Gulf / Americas / Asia / other) · `newsletter_opt_in` (checkbox: "Send me adviser updates, max. quarterly") · `consent`* · hidden `form_variant=adviser_pack` |
| 2 | **Introduce a client** (partner enquiry) | `/for-advisers/` + every B page | `name`* · `email`* · `phone` · `firm`* · `role`* (select as above) · `client_nationality` (select: EU/EFTA / UK / US / Canada / Gulf / India / other non-EU) · `client_profile` (select: retiring / not working in CH / selling or sold a business / will work in CH / not sure) · `target_timing` (select: <6 months / 6–12 / 12+ / exploring) · `cantons_considered` (multi-select + "open") · `scope_needed` (checkboxes: permit / lump-sum or ordinary tax / tax ruling / property & Lex Koller / schools & settling-in / ongoing tax) · `message` (textarea, placeholder: "No client names needed at this stage") · `preferred_contact` (select: email / phone / video call) · `nda_requested` (checkbox) · `consent`* · hidden `form_variant=partner_intro` |
| 3 | **Anonymous pre-screen** (adviser tests fit without naming the client) | Non-EU checklist, UK brief | `email`* · `role`* · `client_nationality`* · `client_age_band` (select: <55 / 55+) · `gainful_activity_in_ch` (yes / no / unsure) · `family_members_moving` (number) · `cantons_considered` · `timing` · `consent`* · hidden `form_variant=prescreen` → reply within X business days (set internally) |
| 4 | **Client relocation checklist PDF** | first-90-days, timeline, origin hubs | `name` · `email`* · `moving_from` (select) · `timing` (select) · `language` (EN/FR/DE) · `consent`* · hidden `form_variant=checklist` |
| 5 | **Canton data downloads** (lump-sum minimum table, wealth tax by canton, as CSV + PDF) | lump-sum-by-canton, wealth-tax page | `email`* · `i_am` (select: moving myself / adviser / journalist / other) · `consent`* · hidden `form_variant=data_{name}` (link-magnet: data pages also earn citations) |
| 6 | **"Send this to my adviser"** (client → adviser) | treaty, exit-tax, UK/FR/DE guides, EC result | Static: a `mailto:` button with subject "Swiss relocation: page to review" and a body holding the page title, URL and a one-line summary; a "Copy link" button with `?utm_source=share&utm_medium=adviser`. Optional form version: `your_name` · `your_email`* · `adviser_email`* · `note` · `consent`* → Formspark notification to us; send the adviser email manually (Formspark does not email third parties) |
| 7 | **"Send this to my client"** (adviser → client) | adviser pages | The same mailto pattern with client-facing wording ("An overview of Swiss residence options"), pointing to the matching client guide rather than the adviser brief |
| 8 | **Eligibility-check result: email me / copy my adviser** | `/eligibility-check/` result screen | `email`* · `adviser_email` (optional) · `language` · `consent`* · hidden `route_result`, `canton_selected`, `nationality_group` (from the checker state) · hidden `form_variant=check_result` |
| 9 | **Adviser updates list** (quarterly: dated changes, no promotion) | `/for-advisers/`, footer | `email`* · `firm` · `role` · `language` · `consent`* · hidden `form_variant=adviser_updates`. Doubles as the GEO/E-E-A-T freshness signal |

Discretion copy (all B forms): "We never contact your client without your agreement. The relationship stays yours." Response-time promise: set internally, then state it on the page.

---

## 5. Cannibalisation guardrails (ridger.ch, ark-fid.ch)

| Brand | Owns (do not target) | switzerlandresidency.ch angle |
|---|---|---|
| **ridger.ch** (MFO) | family office / multi family office (all langs), MFO vs private bank, family governance charter, consolidated / multi-bank reporting, TWR/MWR, custodian bank selection, Nachlassplanung / planification successorale (Swiss-law basics), holding / foundation / trust structures, working with existing advisers as family-office coordinator, Geneva household staff, Korrespondenzadresse, Geneva schooling, Geneva work/residence permit guide | Cross-border **move** angle only. Succession pages are FR↔CH / DE↔CH treaty questions triggered by the move. Banking = new-resident onboarding, not custodian choice. The referral page covers relocation scope, not ongoing coordination. Don't use "family office" in titles or H1s |
| **ark-fid.ch** (fiduciary) | domiciliation, company formation SA/Sàrl, corporate tax compliance, VAT, payroll, salary certificate / school fees, business succession (corporate), ANOBAG / work permits, "cabinet fiscal genève", "family office services switzerland" impressions | Personal relocation and private-client tax only. P2 #20 (selling a business) stays on the **person's** sequencing and links to ark-fid for the corporate side. Don't target "steuerberater genf" or "cabinet fiscal genève" |

Cross-link policy: link to ridger or ark-fid only where the reader's next need is theirs, never with the same anchor as their target term.

---

## 6. Build order (suggested)

1. `/for-advisers/` + #2 referring + form variants 1–2 (conversion infrastructure first).
2. #3 UK brief, #7 timeline, #4 non-EU checklist (with PDFs).
3. #8 tax residency, #9 how much wealth, #10 wealth tax by canton (the TOFU traffic engines).
4. FR/DE adviser notes #5, #6, then existing-page fixes 1–4 (cannibalisation) and 19–20 (CTAs, links).
5. P2 in order of market priority: UK (#11, #12) → FR/DE (#13, #14) → US (#15, #17) → partners (#16) → rest.
