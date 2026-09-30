/** Test helper: a synthetic EN/FR/DE guide that satisfies every guardrail. Not used at run time. */

const pad = (text, len) => {
  let out = text;
  const filler = [" Rules differ", " by canton", " and by case", " so check early", " with the canton"];
  let i = 0;
  while (out.length < len) out += filler[i++ % filler.length];
  return `${out.slice(0, len - 1).trimEnd().padEnd(len - 1, "s")}.`;
};

const LANG = {
  en: {
    title: "Swiss tax residency: domicile and stay rules",
    primary: "swiss tax residency",
    secondary: ["swiss tax domicile", "how to become a swiss tax resident", "tax residency switzerland rules", "swiss tax resident", "leaving switzerland tax"],
    desc: "Swiss tax residency depends on domicile or a qualifying stay. How it starts, how it ends and what the federal minimum base of CHF 435,000 means",
    open: "Swiss tax residency starts when you take up domicile in Switzerland or stay for a qualifying period. The canton then taxes you on your worldwide income and wealth, and the federal minimum lump-sum base for 2026 is CHF 435,000.",
    keyFacts: "**Key facts (as of September 2026)**",
    facts: ["| Federal minimum base | CHF 435,000 for 2026 |", "| Who decides | The canton of residence |"],
    h2: ["## When does Swiss tax residency start?", "## When does it end?", "## What does the canton look at?", "## How we help"],
    filler: "Cantonal practice varies, so the canton decides how the rules apply to your own situation and your family.",
    links: "See our [guide to Swiss permits](/en/guides/swiss-permits-explained/) and the [tax ruling service](/en/services/tax-ruling/).",
    help: "We prepare the file with you and speak to the canton early. Start with our [eligibility check](/en/eligibility-check/).",
    disclaimer: "*This guide is general information as of 30 September 2026 and is not tax or legal advice.*",
    faq: (i) => ({ q: `Question ${i} about Swiss tax residency?`, a: "The canton decides, based on your domicile and stay." }),
    source: "Source",
  },
  fr: {
    title: "Résidence fiscale suisse : domicile et séjour",
    primary: "résidence fiscale suisse",
    secondary: ["domicile fiscal suisse", "devenir résident fiscal suisse", "résidence fiscale suisse critères", "résident fiscal suisse", "quitter la suisse impôts"],
    desc: "La résidence fiscale suisse dépend du domicile ou d'un séjour qualifié. Début, fin et ce que signifie la base minimale fédérale de CHF 435 000",
    open: "La résidence fiscale suisse commence lorsque vous prenez domicile en Suisse ou y séjournez pendant une durée qualifiée. Le canton vous impose alors sur vos revenus et votre fortune mondiaux, et la base minimale fédérale du forfait pour 2026 est de CHF 435 000.",
    keyFacts: "**Points clés (septembre 2026)**",
    facts: ["| Base minimale fédérale | CHF 435 000 pour 2026 |", "| Qui décide | Le canton de résidence |"],
    h2: ["## Quand commence la résidence fiscale suisse ?", "## Quand prend-elle fin ?", "## Qu'examine le canton ?", "## Comment nous vous aidons"],
    filler: "La pratique cantonale varie, et le canton décide comment les règles s'appliquent à votre situation et à votre famille.",
    links: "Voir notre [guide des permis suisses](/fr/guides/swiss-permits-explained/) et le [service de ruling fiscal](/fr/services/tax-ruling/).",
    help: "Nous préparons le dossier avec vous et parlons tôt au canton. Commencez par notre [test d'éligibilité](/fr/eligibility-check/).",
    disclaimer: "*Ce guide est une information générale au 30 septembre 2026 et ne constitue pas un conseil fiscal ou juridique.*",
    faq: (i) => ({ q: `Question ${i} sur la résidence fiscale suisse ?`, a: "Le canton décide, selon votre domicile et votre séjour." }),
    source: "Source",
  },
  de: {
    title: "Steuerlicher Wohnsitz Schweiz: Wohnsitz und Aufenthalt",
    primary: "steuerlicher wohnsitz schweiz",
    secondary: ["steuerwohnsitz schweiz", "steuerpflicht schweiz zuzug", "wohnsitz schweiz steuern", "steuerlich ansässig schweiz", "wegzug schweiz steuern"],
    desc: "Der steuerliche Wohnsitz Schweiz hängt vom Wohnsitz oder einem qualifizierten Aufenthalt ab. Beginn, Ende und die Mindestbemessung CHF 435'000",
    open: "Der steuerliche Wohnsitz in der Schweiz beginnt, wenn Sie in der Schweiz Wohnsitz nehmen oder sich während einer qualifizierten Dauer aufhalten. Der Kanton besteuert dann Ihr weltweites Einkommen und Vermögen, und die bundesrechtliche Mindestbemessungsgrundlage der Pauschalbesteuerung beträgt 2026 CHF 435'000.",
    keyFacts: "**Das Wichtigste in Kürze (Stand September 2026)**",
    facts: ["| Bundesrechtliche Mindestbemessung | CHF 435'000 für 2026 |", "| Wer entscheidet | Der Wohnsitzkanton |"],
    h2: ["## Wann beginnt der steuerliche Wohnsitz in der Schweiz?", "## Wann endet er?", "## Was prüft der Kanton?", "## Wie wir helfen"],
    filler: "Die kantonale Praxis ist unterschiedlich, und der Kanton entscheidet, wie die Regeln auf Ihre Situation und Ihre Familie anwendbar sind.",
    links: "Siehe unseren [Ratgeber zu Schweizer Bewilligungen](/de/guides/swiss-permits-explained/) und den [Steuerruling-Service](/de/services/tax-ruling/).",
    help: "Wir bereiten das Dossier mit Ihnen vor und sprechen früh mit dem Kanton. Beginnen Sie mit unserem [Eignungscheck](/de/eligibility-check/).",
    disclaimer: "*Dieser Ratgeber ist eine allgemeine Information mit Stand 30. September 2026 und keine Steuer- oder Rechtsberatung.*",
    faq: (i) => ({ q: `Frage ${i} zum steuerlichen Wohnsitz Schweiz?`, a: "Der Kanton entscheidet anhand von Wohnsitz und Aufenthalt." }),
    source: "Quelle",
  },
};

export function fixtureArticle(locale, slug = "swiss-tax-residency", { fillerRepeats = 26 } = {}) {
  const L = LANG[locale];
  const para = Array.from({ length: 4 }, () => L.filler).join(" ");
  const section = (h) => `${h}\n\n${Array.from({ length: Math.ceil(fillerRepeats / 4) }, () => para).join("\n\n")}`;
  const body = [
    L.open,
    `${L.keyFacts}\n\n| | |\n|---|---|\n${L.facts.join("\n")}`,
    section(L.h2[0]),
    `${section(L.h2[1])}\n\n${L.links}`,
    section(L.h2[2]),
    `${L.h2[3]}\n\n${L.help}`,
    L.disclaimer,
  ].join("\n\n");
  return {
    data: {
      title: L.title,
      description: pad(L.desc, 150),
      slug,
      translationKey: slug,
      collection: "guides",
      category: "tax-and-wealth",
      updated: "2026-09-30",
      draft: false,
      keywords: { primary: L.primary, secondary: L.secondary },
      faq: [1, 2, 3, 4].map(L.faq),
      sources: [
        { label: `${L.source} ESTV`, url: "https://www.estv.admin.ch/dam/de/sd-web/pl0PXAcAAxJq/dbst-ks-2018-1-044-d-de.pdf" },
        { label: `${L.source} Fedlex`, url: "https://www.fedlex.admin.ch/eli/cc/1991/1184_1184_1184/de#art_14" },
        { label: `${L.source} SEM`, url: "https://www.sem.admin.ch/dam/sem/de/data/rechtsgrundlagen/weisungen/fza/weisungen-fza-d.pdf.download.pdf/weisungen-fza-d.pdf" },
      ],
    },
    body,
  };
}
