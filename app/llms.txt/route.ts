import { collections, getPublishedEntries } from "@/lib/content";
import { t } from "@/lib/i18n";
import { absoluteUrl, collectionBase, localePath } from "@/lib/paths";

export const dynamic = "force-static";

const sectionTitle = { services: "Services", cantons: "Cantons", origins: "Moving from", guides: "Guides", advisers: "For advisers" } as const;

export function GET() {
  const en = "en" as const;
  const link = (path: string, title: string, desc?: string) =>
    `- [${title}](${absoluteUrl(localePath(en, path))})${desc ? `: ${desc}` : ""}`;

  const lines = [
    "# Switzerland Residency",
    "",
    `> ${t(en, "meta.homeDescription")}`,
    "",
    "Switzerland Residency helps international families and private individuals settle in Switzerland: residence permits, lump-sum taxation, tax rulings, the choice of canton, property and settling in. It is based in Geneva and works with a partner law firm of around 40 lawyers on legal and permit matters. Content is available in English (/en/), French (/fr/) and German (/de/). Information is general and not legal or tax advice; permits and lump-sum taxation are decided by the cantonal authorities.",
    "",
    "## Main pages",
    link("/", "Home"),
    link("/how-it-works/", t(en, "howItWorks.title"), t(en, "howItWorks.description")),
    link("/eligibility-check/", t(en, "check.title"), t(en, "check.description")),
    link("/services/", t(en, "services.title"), t(en, "services.description")),
    link("/cantons/", t(en, "cantons.title"), t(en, "cantons.description")),
    link("/moving-from/", t(en, "origins.title"), t(en, "origins.description")),
    link("/guides/", t(en, "guides.title"), t(en, "guides.description")),
    link("/for-advisers/", t(en, "advisers.title"), t(en, "advisers.description")),
    link("/about/", t(en, "about.title"), t(en, "about.description")),
    link("/contact/", t(en, "contact.title"), t(en, "contact.description")),
  ];

  for (const c of collections) {
    const entries = getPublishedEntries(en, c);
    if (!entries.length) continue;
    lines.push("", `## ${sectionTitle[c]}`);
    for (const e of entries) lines.push(link(`/${collectionBase[c]}/${e.slug}/`, e.title, e.description));
  }

  lines.push("", "## Optional", link("/privacy/", t(en, "privacy.title")), link("/legal-notice/", t(en, "legal.title")), "");

  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
