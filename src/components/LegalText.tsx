import type { ReactNode } from "react";

const LINK_RE = /\[([^\]]+)\]\((\/[^)\s]*|https:\/\/[^)\s]+)\)/g;

/** Render "[label](/internal/path/)" and "[label](https://…)" markers inside a paragraph as links; everything else stays plain text. */
function withLinks(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    out.push(
      <a key={i} href={m[2]} className="link" {...(m[2].startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {m[1]}
      </a>,
    );
    last = i + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Simple sectioned text for privacy / legal notice. Supports "[label](/path/)" and external https links. */
export default function LegalText({ sections }: { sections: { h: string; p: string[] }[] }) {
  return (
    <div className="prose">
      {sections.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.p.map((p) => (
            <p key={p} className="mt-3">
              {withLinks(p)}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
