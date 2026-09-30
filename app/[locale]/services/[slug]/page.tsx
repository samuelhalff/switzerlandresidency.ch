import { notFound } from "next/navigation";
import EntryPage from "@/components/EntryPage";
import { entryMetadata, entryStaticParams, resolveEntry, type EntryParams } from "@/lib/entry-route";

export const dynamicParams = false;
export const generateStaticParams = entryStaticParams("services");
export const generateMetadata = entryMetadata("services");

export default async function Page({ params }: { params: EntryParams }) {
  const r = await resolveEntry("services", params);
  if (!r) notFound();
  return <EntryPage locale={r.locale} entry={r.entry} collection="services" />;
}
