/**
 * Stable anchor ids for long-form content (shared by the site renderer and the content validator).
 *
 * Rule (docs/CONTENT-GUIDE.md "Deep links"):
 *  - H2/H3 headings (and body H1s, rendered as H2) get an id from their visible text.
 *  - Table body rows get an id from the text of their first cell, ignoring anything from the first
 *    "(" on — so the row "Geneva (GE)" is `#geneva`, FR "Genève (GE)" is `#geneve`, DE "Genf (GE)" is `#genf`.
 *  - slug: lower case, accents removed, apostrophes dropped, every other run of non [a-z0-9]
 *    characters becomes one "-", no leading/trailing "-".
 *  - Ids are unique per page in document order: a repeat gets "-2", "-3", …
 */

/** @param {string} text */
export function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/['’‘`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Text used for a table row id: the first cell up to any parenthesis. */
export function rowLabel(text) {
  return text.split("(")[0];
}

/** Returns a function that hands out unique ids for a page, in document order. */
export function createSlugger() {
  const used = new Map();
  return (/** @type {string} */ text) => {
    const base = slugify(text);
    if (!base) return "";
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    return n ? `${base}-${n + 1}` : base;
  };
}

/** Strip inline markdown (links, emphasis, code) to approximate the rendered text. */
function plain(md) {
  return md
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
}

/**
 * All anchor ids a markdown body will render with, in document order (used by the validator
 * to check `/…/page/#anchor` links without rendering the page).
 * @param {string} body
 * @returns {Set<string>}
 */
export function anchorIds(body) {
  const slug = createSlugger();
  const ids = new Set();
  let tableRow = -1; // -1 outside a table; 0 = header row (no id), then body rows
  let inFence = false;
  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const h = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) {
      tableRow = -1;
      const id = slug(plain(h[2]));
      if (id) ids.add(id);
      continue;
    }
    if (!/^\s*\|/.test(line)) {
      tableRow = -1;
      continue;
    }
    if (/^\s*\|?\s*:?-{2,}/.test(line)) continue; // delimiter row
    tableRow++;
    if (tableRow === 0) continue; // header row: rows in <thead> get no id
    const first = line.replace(/^\s*\|/, "").split("|")[0] ?? "";
    const id = slug(rowLabel(plain(first)));
    if (id) ids.add(id);
  }
  return ids;
}
