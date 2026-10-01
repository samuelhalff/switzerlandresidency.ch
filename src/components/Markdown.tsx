import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeAnchors, { tableColumnCount } from "@/lib/rehype-anchors";

/** Tables up to this many columns are laid out to fit a phone screen without horizontal scrolling. */
const FIT_MAX_COLUMNS = 3;

const components: Components = {
  // Up to three columns: the table fits the column and wraps (no sideways scroll on phones).
  // Wider tables scroll horizontally inside a focusable wrapper.
  table: ({ children, node }) => {
    const fit = tableColumnCount(node) <= FIT_MAX_COLUMNS;
    return fit ? (
      <div className="table-wrap table-fit">
        <table>{children}</table>
      </div>
    ) : (
      <div className="table-wrap" tabIndex={0}>
        <table>{children}</table>
      </div>
    );
  },
  a: ({ href = "", children }) => {
    const external = /^https?:\/\//.test(href);
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <a href={href}>{children}</a>
    );
  },
  // Page already has an h1 from frontmatter; demote stray h1s in the body.
  h1: ({ children, id }) => <h2 id={id}>{children}</h2>,
};

/**
 * Build-time markdown rendering (server component, no client JS). Raw HTML is not rendered.
 * Headings and table rows get stable ids for deep links (see src/lib/rehype-anchors.ts).
 */
export default function Markdown({ source }: { source: string }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeAnchors]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
