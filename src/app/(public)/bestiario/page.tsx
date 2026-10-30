import { createClient } from "@/lib/supabase/server";
import { Empty, PageTitle, SearchForm } from "@/components/ui";
import type { Creature, Region } from "@/lib/types";

export const metadata = { title: "Bestiário" };
const ROMAN = ["", "I", "II", "III", "IV", "V"];
const CAT: Record<string, string> = { fauna_flora: "Fauna e Flora", profano: "Profanos", outra: "Outras" };
/** O texto original começa com o nome da criatura: mostramos o nome no título e removemos a repetição só na exibição. */
function body(c: { name: string; description: string }) { return c.description.startsWith(c.name) ? c.description.slice(c.name.length).replace(/^[\s\-–]+/, "") : c.description; }

export default async function Bestiario({ searchParams }: { searchParams: Promise<{ q?: string; c?: string; p?: string; r?: string }> }) {
  const { q, c, p, r } = await searchParams;
  const sb = await createClient();
  const [{ data: rs }, { data: cs }] = await Promise.all([
    sb.from("regions").select("*").eq("status", "published").order("name"),
    (() => { let qy = sb.from("creatures").select("*").eq("status", "published").order("periculosidade", { nullsFirst: true }).order("name");
      if (q) qy = qy.or(`name.ilike.%${q.replace(/[%,]/g, " ")}%,description.ilike.%${q.replace(/[%,]/g, " ")}%`);
      if (c) qy = qy.eq("category", c); if (p) qy = qy.eq("periculosidade", Number(p)); if (r) qy = qy.eq("region_id", r); return qy; })(),
  ]);
  const regions = (rs ?? []) as Region[]; const list = (cs ?? []) as Creature[];
  const link = (k: string, v: string) => { const u = new URLSearchParams({ ...(q ? { q } : {}), ...(c ? { c } : {}), ...(p ? { p } : {}), ...(r ? { r } : {}) }); if (v) u.set(k, v); else u.delete(k); return `/bestiario?${u}`; };
  const chip = (active: boolean) => `badge no-underline ${active ? "border-gold-400" : "border-ink-600"}`;
  return (
    <>
      <PageTitle sub="Texto fiel ao material original. Periculosidade só aparece quando a fonte a informa; nenhuma estatística de combate foi inventada.">Bestiário</PageTitle>
      <SearchForm q={q} placeholder="Pesquisar criatura…" />
      <div className="mb-4 space-y-2 text-sm">
        <p className="flex flex-wrap gap-2"><span className="text-parch-500">Categoria:</span><a className={chip(!c)} href={link("c", "")}>Todas</a>{Object.entries(CAT).map(([k, l]) => <a key={k} className={chip(c === k)} href={link("c", k)}>{l}</a>)}</p>
        <p className="flex flex-wrap gap-2"><span className="text-parch-500">Periculosidade:</span><a className={chip(!p)} href={link("p", "")}>Todas</a>{[1, 2, 3, 4, 5].map((n) => <a key={n} className={chip(p === String(n))} href={link("p", String(n))}>{ROMAN[n]}</a>)}</p>
        {regions.length > 0 && <p className="flex flex-wrap gap-2"><span className="text-parch-500">Região / bioma:</span><a className={chip(!r)} href={link("r", "")}>Todas</a>{regions.map((g) => <a key={g.id} className={chip(r === g.id)} href={link("r", g.id)}>{g.name}</a>)}</p>}
      </div>
      {!c && !p && !q && !r && regions.length > 0 && (
        <section className="mb-8"><h2 className="mb-2 text-2xl">Regiões e biomas</h2>
          <div className="space-y-2">{regions.map((g) => (<details key={g.id} className="card"><summary className="cursor-pointer font-display text-lg text-gold-300">{g.name}</summary><p className="mt-2 whitespace-pre-line text-sm text-parch-300">{g.description.startsWith(g.name.split(" (")[0]) ? g.description.slice(g.name.split(" (")[0].length).replace(/^[\s\-–]+/, "") : g.description}</p></details>))}</div></section>)}
      <h2 className="mb-2 text-2xl">Criaturas ({list.length})</h2>
      {list.length === 0 ? <Empty>Nenhuma criatura encontrada. O Mestre pode importar o conteúdo oficial em “Gerenciar sistema → Importar conteúdo oficial”.</Empty> : (
        <div className="space-y-2">{list.map((cr) => (
          <details key={cr.id} className="card">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2"><span className="font-display text-lg text-gold-300">{cr.name}</span>
              <span className="badge border-ink-600">{CAT[cr.category]}</span>{cr.periculosidade && <span className="badge border-wine-400">Periculosidade {ROMAN[cr.periculosidade]}</span>}
              {cr.region_id && <span className="badge border-emerald-600/50">{regions.find((g) => g.id === cr.region_id)?.name}</span>}</summary>
            <p className="mt-2 whitespace-pre-line text-sm text-parch-300">{body(cr)}</p>
            {[["Características", cr.traits], ["Habilidades", cr.abilities], ["Fraquezas", cr.weaknesses], ["Habitat", cr.habitat], ["Comportamento", cr.behavior], ["Observações", cr.notes]].filter(([, v]) => v).map(([k, v]) => <p key={k} className="mt-2 text-sm"><b className="text-gold-300">{k}:</b> {v}</p>)}
          </details>))}</div>)}
    </>
  );
}
