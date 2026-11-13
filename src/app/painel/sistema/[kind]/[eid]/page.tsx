import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMaster } from "@/lib/data";
import { PageTitle } from "@/components/ui";
import { ContentEditor } from "@/components/ContentEditor";
import { KIND_DEFS } from "@/lib/content-config";

export default async function Editor({ params }: { params: Promise<{ kind: string; eid: string }> }) {
  const { kind, eid } = await params;
  const { sb, user } = await requireMaster();
  const def = KIND_DEFS[kind]; if (!def) notFound();
  let row = null;
  if (eid !== "novo") {
    const { data } = await sb.from(def.table).select("*").eq("id", eid).is("campaign_id", null).maybeSingle();
    if (!data) notFound(); row = data;
  }
  const { data: regs } = kind === "criaturas" ? await sb.from("regions").select("id,name").neq("status", "archived").order("name") : { data: [] };
  const lookups = { regions: ((regs ?? []) as { id: string; name: string }[]).map((r) => [r.id, r.name] as [string, string]) };
  return (
    <>
      <p className="mb-2 text-sm"><Link href={`/painel/sistema/${kind}`}>← {def.label}</Link></p>
      <PageTitle>{row ? String((row as Record<string, unknown>)[def.nameKey]) : `Novo ${def.singular}`}</PageTitle>
      <ContentEditor kind={kind} base={`/painel/sistema/${kind}`} userId={user.id} row={row} lookups={lookups} />
    </>
  );
}
