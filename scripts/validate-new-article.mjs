#!/usr/bin/env node
/**
 * Guardrails for a newly generated guide (EN + FR + DE). Run after scripts/ai-article.mjs.
 *
 *   node scripts/validate-new-article.mjs --slug <slug> [--discard-on-fail] [--skip-site-validator]
 *
 * Without --slug it reads the slug from the run state file (AI_ARTICLE_STATE, written by the
 * generator). Checks: frontmatter, meta lengths, word count, structure, internal links, source
 * policy, wording rules (pricing, emails, guarantees, UNVERIFIED, legal-audit phrases), keyword
 * placement, EN/FR/DE number parity, grounded amounts, and finally the full
 * `node scripts/validate-content.mjs`. Exit 1 with the reasons if anything fails; with
 * --discard-on-fail the three article files are deleted so nothing can be committed.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  LOCALES,
  buildAllowedLinks,
  checkArticle,
  checkArticleSet,
  loadCategories,
  loadFactSources,
  readGuide,
  stripUnverified,
  unverifiedOnlyNumbers,
} from "./lib/article-pipeline.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const STATE_FILE = process.env.AI_ARTICLE_STATE || path.join(os.tmpdir(), "ai-article-state.json");

export function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}

export function runSiteValidator(root = ROOT) {
  const r = spawnSync(process.execPath, [path.join(root, "scripts", "validate-content.mjs")], { cwd: root, encoding: "utf8" });
  return { ok: r.status === 0, output: `${r.stdout ?? ""}${r.stderr ?? ""}`.trim() };
}

/**
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateNewArticle(slug, { root = ROOT, researchFacts = [], siteValidator = true } = {}) {
  const errors = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? "")) return { ok: false, errors: [`invalid slug "${slug}"`] };
  const categories = loadCategories(root);
  const articles = {};
  for (const locale of LOCALES) {
    const a = readGuide(root, locale, slug);
    if (!a) {
      errors.push(`${locale}: content/${locale}/guides/${slug}.md is missing`);
      continue;
    }
    articles[locale] = a;
  }
  if (!articles.en) return { ok: false, errors };
  const category = articles.en.data.category;
  for (const locale of Object.keys(articles)) {
    const allowedLinks = new Set(buildAllowedLinks(root, locale).map((l) => l.url));
    errors.push(...checkArticle(articles[locale], { locale, slug, category, categories, allowedLinks }));
  }
  const legalFacts = loadFactSources(root); // legal-facts.md + verified audit sections
  const factsCorpus = `${stripUnverified(legalFacts)}\n${researchFacts.map((f) => f.claim).join("\n")}`;
  errors.push(...checkArticleSet(articles, { factsCorpus, unverifiedNumbers: unverifiedOnlyNumbers(legalFacts) }));

  if (siteValidator) {
    const site = runSiteValidator(root);
    if (!site.ok) errors.push(`validate-content.mjs failed:\n${site.output}`);
  }
  return { ok: errors.length === 0, errors };
}

export function discardArticle(slug, root = ROOT) {
  for (const locale of LOCALES) {
    const file = path.join(root, "content", locale, "guides", `${slug}.md`);
    if (fs.existsSync(file)) fs.rmSync(file);
  }
}

function main() {
  const args = process.argv.slice(2);
  const arg = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const state = readState();
  const slug = arg("--slug") || state?.slug;
  if (!slug) {
    console.error("❌ No slug given (--slug) and no run state found.");
    process.exit(1);
  }
  const researchFacts = state?.slug === slug ? (state.researchFacts ?? []) : [];
  const { ok, errors } = validateNewArticle(slug, { researchFacts, siteValidator: !args.includes("--skip-site-validator") });
  if (ok) {
    console.log(`✅ ${slug}: all guardrails passed (EN/FR/DE)`);
    return;
  }
  console.error(`❌ ${slug}: ${errors.length} guardrail failure(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  if (args.includes("--discard-on-fail")) {
    discardArticle(slug);
    console.error(`🗑️  Discarded content/{en,fr,de}/guides/${slug}.md`);
  }
  process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
