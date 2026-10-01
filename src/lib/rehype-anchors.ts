import type { Element, ElementContent, Root, RootContent } from "hast";
import { createSlugger, rowLabel } from "../../scripts/lib/heading-id.mjs";

/** Visible text of a hast node. */
function text(node: Root | RootContent | ElementContent): string {
  if (node.type === "text") return node.value;
  if ("children" in node) return (node.children as ElementContent[]).map(text).join("");
  return "";
}

/** Number of columns of a hast <table> (cells of its widest row, colspan included). 0 if unknown. */
export function tableColumnCount(table: Element | undefined): number {
  let max = 0;
  const walk = (node: Element) => {
    for (const child of node.children) {
      if (child.type !== "element") continue;
      if (child.tagName === "tr") {
        let cells = 0;
        for (const cell of child.children) {
          if (cell.type === "element" && (cell.tagName === "th" || cell.tagName === "td")) {
            cells += Number(cell.properties.colSpan) || 1;
          }
        }
        max = Math.max(max, cells);
      } else {
        walk(child);
      }
    }
  };
  if (table) walk(table);
  return max;
}

/**
 * Tiny rehype plugin: stable ids for H1–H3 and table body rows (first cell), so guides can be
 * deep-linked (e.g. /en/guides/lump-sum-taxation-by-canton/#geneva). Id rule: scripts/lib/heading-id.mjs.
 */
export default function rehypeAnchors() {
  return (tree: Root) => {
    const slug = createSlugger();
    const walk = (node: Root | Element, inBody: boolean) => {
      for (const child of node.children) {
        if (child.type !== "element") continue;
        const tag = child.tagName;
        if ((tag === "h1" || tag === "h2" || tag === "h3") && !child.properties.id) {
          const id = slug(text(child));
          if (id) child.properties.id = id;
          continue;
        }
        if (tag === "tr" && inBody && !child.properties.id) {
          const cell = child.children.find((c): c is Element => c.type === "element");
          const id = cell ? slug(rowLabel(text(cell))) : "";
          if (id) child.properties.id = id;
          continue;
        }
        walk(child, tag === "tbody" ? true : tag === "thead" ? false : inBody);
      }
    };
    walk(tree, false);
  };
}
