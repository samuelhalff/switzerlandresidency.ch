import { notFound } from "next/navigation";
import EntryPage from "@/components/EntryPage";
import { entryMetadata, entryStaticParams, resolveEntry, type EntryParams } from "@/lib/entry-route";

export const dynamicParams = false;
export const generateStaticParams = entryStaticParams("guides");
export const generateMetadata = entryMetadata("guides");

export default async function Page({ params }: { params: EntryParams }) {
  const r = await resolveEntry("guides", params);
  if (!r) notFound();
  return <EntryPage locale={r.locale} entry={r.entry} collection="guides" />;
}
