import { createClient } from "@/lib/supabase/server";
import { Card, Empty, PageTitle, SearchForm } from "@/components/ui";
import type { Spell } from "@/lib/types";

export const metadata = { title: "Feitiços" };
export default async function Feiticos({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string }> }) {
  const { q, cat } = await searchParams;
  const sb = await createClient();
  let query = sb.from("spells").select("*").is("campaign_id", null).eq("status", "published").eq("kind", "feitico").order("category").order("name");
  if (q) query = query.ilike("name", `%${q.replace(/[%,]/g, " ")}%`);
  if (cat) query = query.eq("category", cat);
  const { data } = await query;
  const list = (data ?? []) as Spell[];
  const { data: cats } = await sb.from("spells").select("category").is("campaign_id", null).eq("status", "published").eq("kind", "feitico");
  const { data: ctr } = await sb.from("spells").select("*").is("campaign_id", null).eq("status", "published").eq("kind", "contrato").order("name");
  const contracts = (ctr ?? []) as Spell[];
  const categories: string[] = Array.from(new Set<string>((cats ?? []).map((c: { category: string }) => c.category).filter((c: string) => c !== ""))).sort();
  return (
    <>
      <PageTitle sub="Custos, CD e alcance aparecem só quando existem no documento oficial.">Feitiços</PageTitle>
      <SearchForm q={q} placeholder="Pesquisar feitiço por nome…" />
      <p className="mb-4 flex flex-wrap gap-2 text-sm">
        <a className={`badge no-underline ${!cat ? "border-gold-400" : "border-ink-600"}`} href="/feiticos">Todos</a>
        {categories.map((c) => <a key={c} className={`badge no-underline ${cat === c ? "border-gold-400" : "border-ink-600"}`} href={`/feiticos?cat=${encodeURIComponent(c)}`}>{c}</a>)}
      </p>
      {list.length === 0 ? <Empty>Nenhum feitiço encontrado.</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((s) => (
            <Card key={s.id} title={s.name}>
              <p className="mb-2 flex flex-wrap gap-2 text-xs">
                <span className="badge border-gold-600/50">{s.category || "Sem categoria"}</span>
                <span className="badge border-arcane-500">Mana: {s.mana_cost ?? "não documentado"}</span>
                {s.cd !== null && <span className="badge border-ink-600">CD {s.cd}</span>}
                {s.range_text && <span className="badge border-ink-600">Alcance {s.range_text}</span>}
                {s.druidic && <span className="badge border-emerald-600/60">Druídico</span>}
                {s.harmonic !== null && <span className="badge border-ink-600">{s.harmonic ? "Harmônico" : "Não harmônico"}</span>}
                {s.passive && <span className="badge border-gold-600/60">Regra passiva (não conjurada)</span>}
              </p>
              <p className="text-sm text-parch-300">{s.description}</p>
            </Card>
          ))}
        </div>
      )}
      {contracts.length > 0 && !q && !cat && (
        <section className="mt-8"><h2 className="mb-3 text-2xl">Contratos gerais</h2><p className="mb-3 text-sm text-parch-500">Contratos têm requisitos, efeitos e restrições próprios e não são conjurados como feitiços.</p>
          <div className="grid gap-4 md:grid-cols-2">{contracts.map((c) => (<Card key={c.id} title={c.name}><p className="mb-2 flex flex-wrap gap-2 text-xs">{c.mana_cost !== null && <span className="badge border-arcane-500">Mana: {c.mana_cost}</span>}{c.cd !== null && <span className="badge border-ink-600">CD {c.cd}</span>}</p><p className="text-sm text-parch-300">{c.description}</p>{c.restrictions && <p className="mt-2 text-xs text-parch-500">Requisitos/restrições: {c.restrictions}</p>}</Card>))}</div></section>)}
    </>
  );
}
