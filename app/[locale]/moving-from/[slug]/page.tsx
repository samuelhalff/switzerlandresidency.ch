import { notFound } from "next/navigation";
import EntryPage from "@/components/EntryPage";
import { entryMetadata, entryStaticParams, resolveEntry, type EntryParams } from "@/lib/entry-route";

export const dynamicParams = false;
export const generateStaticParams = entryStaticParams("origins");
export const generateMetadata = entryMetadata("origins");

export default async function Page({ params }: { params: EntryParams }) {
  const r = await resolveEntry("origins", params);
  if (!r) notFound();
  return <EntryPage locale={r.locale} entry={r.entry} collection="origins" />;
}
