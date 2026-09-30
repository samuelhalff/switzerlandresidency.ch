import { notFound } from "next/navigation";
import EntryPage from "@/components/EntryPage";
import { entryMetadata, entryStaticParams, resolveEntry, type EntryParams } from "@/lib/entry-route";

export const dynamicParams = false;
export const generateStaticParams = entryStaticParams("cantons");
export const generateMetadata = entryMetadata("cantons");

export default async function Page({ params }: { params: EntryParams }) {
  const r = await resolveEntry("cantons", params);
  if (!r) notFound();
  return <EntryPage locale={r.locale} entry={r.entry} collection="cantons" />;
}
