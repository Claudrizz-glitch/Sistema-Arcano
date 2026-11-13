import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireMaster } from "@/lib/data";
import { Empty, PageTitle, SearchForm, StatusBadge } from "@/components/ui";
import { KIND_DEFS } from "@/lib/content-config";

export default async function Lista({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<{ q?: string; s?: string }> }) {
  const { kind } = await params; const { q, s } = await searchParams;
  if (kind === "progressoes") redirect("/painel/sistema/racas");
  const { sb } = await requireMaster();
  const def = KIND_DEFS[kind]; if (!def) notFound();
  const base = `/painel/sistema/${kind}`;
  let query = sb.from(def.table).select("*").is("campaign_id", null).order(kind === "regras" ? "sort_order" : def.nameKey);
  if (q) query = query.ilike(def.nameKey, `%${q.replace(/[%,]/g, " ")}%`);
  if (s) query = query.eq("status", s);
  const { data } = await query;
  const rows = (data ?? []) as Record<string, any>[];
  return (
    <>
      <PageTitle sub={kind === "regras" ? "Cada tópico publicado aparece como um card na página Regras, na ordem de exibição." : "Rascunhos nunca aparecem no site público. Registros usados em fichas devem ser arquivados, não excluídos."}>{def.label}</PageTitle>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex flex-wrap gap-2 text-sm">{[["", "Todos"], ["draft", "Rascunhos"], ["published", "Publicados"], ["archived", "Arquivados"]].map(([v, l]) => <Link key={v} className={`badge no-underline ${(s ?? "") === v ? "border-gold-400" : "border-ink-600"}`} href={`${base}${v ? `?s=${v}` : ""}`}>{l}</Link>)}</p>
        <Link className="btn btn-primary no-underline" href={`${base}/novo`}>+ Novo {def.singular}</Link>
      </div>
      <SearchForm q={q} placeholder={`Pesquisar ${def.label.toLowerCase()}…`} />
      {rows.length === 0 ? <Empty>Nada encontrado. Crie o primeiro {def.singular} com o botão acima.</Empty> : (
        <div className="overflow-x-auto rounded-lg border border-ink-600"><table className="w-full text-sm">
          <thead className="bg-ink-800 text-left text-gold-300"><tr><th className="px-3 py-2">Nome</th>{kind === "regras" && <th className="px-3 py-2">Ordem</th>}<th className="px-3 py-2">Estado</th><th className="px-3 py-2">Atualizado</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-t border-ink-700">
              <td className="px-3 py-2"><Link href={`${base}/${r.id}`}>{r[def.nameKey]}</Link></td>
              {kind === "regras" && <td className="px-3 py-2">{r.sort_order}</td>}
              <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
              <td className="px-3 py-2 text-xs text-parch-500">{new Date(r.updated_at).toLocaleDateString("pt-BR")}</td></tr>))}</tbody></table></div>)}
    </>
  );
}
