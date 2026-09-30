import { cn } from "./cn";

/** Quiet text sequence joined by a hairline: small dot, serif title, one paragraph. No numbered circles. */
export default function Timeline({
  items,
  className,
  headingLevel = "h3",
}: {
  items: { title: string; text: string }[];
  className?: string;
  headingLevel?: "h2" | "h3";
}) {
  const H = headingLevel;
  return (
    <ol className={cn("relative border-l border-line pl-8 sm:pl-10", className)}>
      {items.map((s) => (
        <li key={s.title} className="relative pb-10 last:pb-0" data-reveal="">
          <span aria-hidden="true" className="absolute -left-[calc(2rem+4.5px)] top-3 h-2 w-2 rounded-full bg-accent sm:-left-[calc(2.5rem+4.5px)]" />
          <H className="text-[1.5rem] leading-snug sm:text-[1.75rem]">{s.title}</H>
          <p className="mt-2 max-w-xl text-muted">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
