import type { ReactNode } from "react";

/**
 * Renders a headline with one emphasised word (Fraunces italic, accent colour).
 * Either pass `accent` (a word or phrase contained in `text`) or use inline markup: "Make Switzerland {em}home{/em}".
 */
export default function AccentText({ text, accent }: { text: string; accent?: string }): ReactNode {
  const marked = /\{em\}(.+?)\{\/em\}/.exec(text);
  if (marked) {
    const [whole, word] = marked;
    return (
      <>
        {text.slice(0, marked.index)}
        <em className="accent-em">{word}</em>
        {text.slice(marked.index + whole.length)}
      </>
    );
  }
  const i = accent ? text.indexOf(accent) : -1;
  if (!accent || i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <em className="accent-em">{accent}</em>
      {text.slice(i + accent.length)}
    </>
  );
}
