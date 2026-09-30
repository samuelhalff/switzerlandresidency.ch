#!/usr/bin/env node
/**
 * Pre-research keywords for every todo backlog item and store them in content/backlog.json as
 * `researchedKeywords: { date, perLocale: { <locale>: { primary, secondary[], questions[] } } }`.
 *
 * Run from a normal (non-datacenter) machine: Google autocomplete blocks GitHub Actions runners,
 * so the article pipeline falls back to these stored results when live research comes back empty.
 *
 *   npm run keywords:refresh                       # all todo items
 *   npm run keywords:refresh -- --missing-only     # only items without researchedKeywords
 *   npm run keywords:refresh -- --slug <slug>      # one item
 *   options: --max-minutes 20 (runtime cap), --interval-ms 300 (min spacing between requests)
 *
 * The backlog is re-read and saved after every item, so an interrupted run keeps its progress and
 * concurrent edits to other fields are kept. Locales where
 * live research returned no candidates keep their previous stored value.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existingGuideSlugs, loadBacklog, saveBacklog } from "./lib/article-pipeline.mjs";
import { researchKeywords } from "./lib/keyword-research.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const maxMinutes = Number(opt("--max-minutes", "20")) || 20;
const intervalMs = Number(opt("--interval-ms", "300")) || 300;
const onlySlug = opt("--slug", null);
const missingOnly = argv.includes("--missing-only");

/** Pure: merge one research result into the item's stored keywords. Returns the locales updated. */
export function applyResearch(item, research, date) {
  const perLocale = { ...(item.researchedKeywords?.perLocale ?? {}) };
  const updated = [];
  for (const [locale, k] of Object.entries(research.locales)) {
    if (!String(research.sources?.[locale] ?? "").startsWith("live:") || !k.candidates.length) continue;
    perLocale[locale] = { primary: k.primary, secondary: k.secondary, questions: k.questions.slice(0, 10) };
    updated.push(locale);
  }
  if (updated.length) item.researchedKeywords = { date, perLocale };
  return updated;
}

async function main() {
  const backlog = loadBacklog(ROOT);
  const existing = existingGuideSlugs(ROOT);
  const todo = backlog.items
    .filter((i) => i.status === "todo" && !existing.has(i.slug))
    .filter((i) => !onlySlug || i.slug === onlySlug)
    .filter((i) => !missingOnly || !i.researchedKeywords)
    .sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9));
  const deadline = Date.now() + maxMinutes * 60_000;
  const date = new Date().toISOString().slice(0, 10);
  console.log(`[refresh-keywords] ${todo.length} todo items, cap ${maxMinutes} min, ≥${intervalMs} ms between requests`);
  let done = 0;
  for (const item of todo) {
    if (Date.now() > deadline) {
      console.log(`[refresh-keywords] runtime cap reached — ${todo.length - done} items left (rerun with --missing-only)`);
      break;
    }
    const research = await researchKeywords(item, {
      useStored: false,
      trends: false,
      concurrency: 2,
      minIntervalMs: intervalMs,
      log: (m) => (/failed/.test(m) ? console.log(`  ${m}`) : undefined),
    });
    const updated = applyResearch(item, research, date);
    if (updated.length) {
      // Re-read so edits made to the backlog meanwhile (e.g. by the pipeline) are not clobbered.
      const fresh = loadBacklog(ROOT);
      const target = fresh.items.find((i) => i.slug === item.slug);
      if (target) {
        target.researchedKeywords = item.researchedKeywords;
        saveBacklog(ROOT, fresh);
      }
    }
    done++;
    const summary = Object.entries(research.sources).map(([l, s]) => `${l}=${s}/${research.locales[l].candidates.length}`).join(" ");
    console.log(`[${done}/${todo.length}] ${item.slug}: ${summary}${updated.length ? "" : " — nothing stored"}`);
  }
  console.log(`[refresh-keywords] refreshed ${done} item(s)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
