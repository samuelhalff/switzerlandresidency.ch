# Translation guide — FR / DE (Swiss)

Translate from `content/en/<collection>/<slug>.md` to `content/fr/…` and `content/de/…`
with the **same file name/slug and translationKey**. Also follow docs/CONTENT-GUIDE.md.

## Principles
- Native, idiomatic Swiss French / Swiss High German — rewrite sentences so they read as if
  written in that language; never word-for-word. Keep the warm, calm, reassuring tone.
- Facts, numbers, dates, sources and structure stay identical (same sections, tables, FAQ count).
  Do not add or remove facts. Keep `sources` URLs; translate only the `label` text.
  Where an official source exists in FR/DE (fedlex, admin.ch, cantonal sites), prefer the
  FR/DE URL of the same page if you can confirm it exists; otherwise keep the original URL.
- Titles ≤ 60 chars, descriptions 140–155 chars, written for FR/DE search intent
  (research/seo-topics.md §1.2 FR keywords, §1.3 DE keywords) — e.g. FR "forfait fiscal suisse",
  "s'installer en Suisse", "permis B sans activité lucrative"; DE "Pauschalbesteuerung Schweiz",
  "Auswandern Schweiz", "Wohnsitz Schweiz", "Aufenthaltsbewilligung ohne Erwerbstätigkeit".
- Internal links: replace `/en/` with `/fr/` or `/de/` (paths otherwise unchanged).
- Remove any existing `draft: true` placeholder file in the target folder whose slug is not in
  the EN set (e.g. old placeholder files), and overwrite placeholders with the same slug.
- Frontmatter `updated` stays "2026-09-30"; `draft: false`.

## Formatting conventions
- FR: "CHF 435 000" (narrow/normal space thousands), « guillemets » optional, typographic
  apostrophe ok. Space before ":" ";" "?" "!" per French typography.
- DE (Swiss): no "ß" — always "ss"; "CHF 435'000" (apostrophe thousands). Formal "Sie".
- Dates: FR "30 septembre 2026", DE "30. September 2026". Keep ISO in frontmatter.

## Terminology (use consistently)
| EN | FR | DE |
|---|---|---|
| lump-sum taxation | imposition d'après la dépense (forfait fiscal) | Besteuerung nach dem Aufwand (Pauschalbesteuerung) |
| control calculation | calcul de contrôle | Kontrollrechnung |
| tax ruling | ruling fiscal / décision anticipée | Steuerruling / Vorbescheid |
| residence permit B / C / L | permis B / C / L (autorisation de séjour / d'établissement / de courte durée) | Ausweis B / C / L (Aufenthalts- / Niederlassungs- / Kurzaufenthaltsbewilligung) |
| gainful activity | activité lucrative | Erwerbstätigkeit |
| important fiscal interests (art. 30 AIG) | intérêts fiscaux importants (art. 30 al. 1 let. b LEI) | wichtige öffentliche (fiskalische) Interessen (Art. 30 Abs. 1 Bst. b AIG) |
| AIG / FNIA | LEI (loi fédérale sur les étrangers et l'intégration) | AIG (Ausländer- und Integrationsgesetz) |
| AFMP / FZA | ALCP (accord sur la libre circulation des personnes) | FZA (Freizügigkeitsabkommen) |
| DBG / StHG | LIFD / LHID | DBG / StHG |
| ESTV (federal tax administration) | AFC (Administration fédérale des contributions) | ESTV (Eidgenössische Steuerverwaltung) |
| SEM | SEM (Secrétariat d'État aux migrations) | SEM (Staatssekretariat für Migration) |
| Lex Koller | Lex Koller (LFAIE) | Lex Koller (BewG) |
| second-home law (Lex Weber) | loi sur les résidences secondaires (Lex Weber) | Zweitwohnungsgesetz (Lex Weber) |
| health insurance (KVG) | assurance maladie obligatoire (LAMal) | obligatorische Krankenversicherung (KVG) |
| AHV contributions for non-employed | cotisations AVS des personnes sans activité lucrative | AHV-Beiträge für Nichterwerbstätige |
| wealth tax | impôt sur la fortune | Vermögenssteuer |
| inheritance / gift tax | impôt sur les successions / donations | Erbschafts- / Schenkungssteuer |
| imputed rental value | valeur locative | Eigenmietwert |
| property transfer tax | droits de mutation | Handänderungssteuer |
| eligibility check | test d'éligibilité | Eignungscheck |
| canton names | Genève, Vaud, Valais, Tessin, Grisons, Zoug, Schwytz, Lucerne, Berne, Fribourg, Zurich | Genf, Waadt, Wallis, Tessin, Graubünden, Zug, Schwyz, Luzern, Bern, Freiburg, Zürich |
