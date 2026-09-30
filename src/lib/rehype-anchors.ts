import type { Element, ElementContent, Root, RootContent } from "hast";
import { createSlugger, rowLabel } from "../../scripts/lib/heading-id.mjs";

/** Visible text of a hast node. */
function text(node: Root | RootContent | ElementContent): string {
  if (node.type === "text") return node.value;
  if ("children" in node) return (node.children as ElementContent[]).map(text).join("");
  return "";
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
