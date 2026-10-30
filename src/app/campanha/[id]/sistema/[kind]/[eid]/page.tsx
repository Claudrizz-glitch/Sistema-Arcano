import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGm } from "@/lib/data";
import { PageTitle } from "@/components/ui";
import { ContentEditor } from "@/components/ContentEditor";
import { KIND_DEFS } from "@/lib/content-config";

export default async function Editor({ params }: { params: Promise<{ id: string; kind: string; eid: string }> }) {
  const { id, kind, eid } = await params;
  const { sb, user, profile } = await requireGm(id);
  const def = KIND_DEFS[kind]; if (!def) notFound();
  let row = null;
  if (eid !== "novo") {
    const { data } = await sb.from(def.table).select("*").eq("id", eid).maybeSingle();
    if (!data) notFound(); row = data;
  }
  const { data: regs } = kind === "criaturas" ? await sb.from("regions").select("id,name").neq("status", "archived").order("name") : { data: [] };
  const lookups = { regions: ((regs ?? []) as { id: string; name: string }[]).map((r) => [r.id, r.name] as [string, string]) };
  const readOnly = row && !row.campaign_id && !profile.is_master;
  return (
    <>
      <p className="mb-2 text-sm"><Link href={`/campanha/${id}/sistema/${kind}`}>← {def.label}</Link></p>
      <PageTitle>{row ? String((row as Record<string, unknown>)[def.nameKey]) : `Novo ${def.singular}`}</PageTitle>
      {readOnly ? <p className="card text-sm text-parch-300">Este é conteúdo oficial do sistema; apenas um Mestre autorizado da plataforma pode editá-lo. Você pode criar uma variante da campanha com “+ Novo”.</p>
        : <ContentEditor kind={kind} campaignId={id} userId={user.id} canOfficial={profile.is_master} row={row} lookups={lookups} />}
    </>
  );
}
