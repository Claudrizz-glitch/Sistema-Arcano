import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGm } from "@/lib/data";
import { Empty, PageTitle, SearchForm, StatusBadge } from "@/components/ui";
import { KIND_DEFS } from "@/lib/content-config";
import { ProgressionEditor } from "@/components/ProgressionEditor";
import { RacesAdmin } from "@/components/RacesAdmin";
import type { ProgRow, ProgTable } from "@/lib/types";

export default async function Lista({ params, searchParams }: { params: Promise<{ id: string; kind: string }>; searchParams: Promise<{ q?: string; s?: string; t?: string }> }) {
  const { id, kind } = await params; const { q, s, t } = await searchParams;
  const { sb, profile } = await requireGm(id);
  if (kind === "progressoes") {
    const [{ data: tabs }, { data: rows }, { data: used }] = await Promise.all([sb.from("progression_tables").select("*").order("name"), sb.from("progression_rows").select("*").order("level"), sb.from("characters").select("progression_slug")]);
    const count: Record<string, number> = {}; (used ?? []).forEach((u: { progression_slug: string }) => { count[u.progression_slug] = (count[u.progression_slug] ?? 0) + 1; });
    return (<><PageTitle sub="Valores oficiais extraídos do PDF. Máximos de Vida/Mana são derivados: alterar uma linha muda o máximo exibido nas fichas, sem tocar nos valores atuais.">Raças e progressões</PageTitle>
      <ProgressionEditor tables={(tabs ?? []) as ProgTable[]} rows={(rows ?? []) as ProgRow[]} canEdit={profile.is_master} usage={count} selected={t} base={`/campanha/${id}/sistema/progressoes`} /></>);
  }
  if (kind === "racas") {
    const [{ data: rs }, { data: vs }] = await Promise.all([sb.from("races").select("*").order("name"), sb.from("race_variants").select("*").order("name")]);
    return (<><PageTitle sub="Edite os textos narrativos das raças e variantes. Alterar o texto nunca muda Vida, Mana, dado de ataque ou restrições — esses parâmetros são separados.">Raças e variantes (textos)</PageTitle>
      <RacesAdmin races={(rs ?? []) as import("@/lib/types").Race[]} variants={(vs ?? []) as import("@/lib/types").Variant[]} canEdit={profile.is_master} /></>);
  }
  const def = KIND_DEFS[kind]; if (!def) notFound();
  let query = sb.from(def.table).select("*").order(def.nameKey);
  if (q) query = query.ilike(def.nameKey, `%${q.replace(/[%,]/g, " ")}%`);
  if (s) query = query.eq("status", s);
  const { data } = await query;
  const rows = (data ?? []) as Record<string, any>[];
  return (
    <>
      <PageTitle sub="Rascunhos nunca aparecem no site público. Registros usados em fichas devem ser arquivados, não excluídos.">{def.label}</PageTitle>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex flex-wrap gap-2 text-sm">{[["", "Todos"], ["draft", "Rascunhos"], ["published", "Publicados"], ["archived", "Arquivados"]].map(([v, l]) => <Link key={v} className={`badge no-underline ${(s ?? "") === v ? "border-gold-400" : "border-ink-600"}`} href={`/campanha/${id}/sistema/${kind}${v ? `?s=${v}` : ""}`}>{l}</Link>)}</p>
        <Link className="btn btn-primary no-underline" href={`/campanha/${id}/sistema/${kind}/novo`}>+ Novo {def.singular}</Link>
      </div>
      <SearchForm q={q} placeholder={`Pesquisar ${def.label.toLowerCase()}…`} />
      {rows.length === 0 ? <Empty>Nada encontrado. Crie o primeiro {def.singular} com o botão acima.</Empty> : (
        <div className="overflow-x-auto rounded-lg border border-ink-600"><table className="w-full text-sm">
          <thead className="bg-ink-800 text-left text-gold-300"><tr><th className="px-3 py-2">Nome</th><th className="px-3 py-2">Escopo</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Atualizado</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-t border-ink-700">
              <td className="px-3 py-2"><Link href={`/campanha/${id}/sistema/${kind}/${r.id}`}>{r[def.nameKey]}</Link></td>
              <td className="px-3 py-2">{r.campaign_id ? "Campanha" : "Oficial"}</td><td className="px-3 py-2"><StatusBadge status={r.status} /></td>
              <td className="px-3 py-2 text-xs text-parch-500">{new Date(r.updated_at).toLocaleDateString("pt-BR")}</td></tr>))}</tbody></table></div>)}
    </>
  );
}
