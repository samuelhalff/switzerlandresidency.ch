/** Simple sectioned text for privacy / legal notice. */
export default function LegalText({ sections }: { sections: { h: string; p: string[] }[] }) {
  return (
    <div className="prose">
      {sections.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.p.map((p) => (
            <p key={p} className="mt-3">
              {p}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
