import { createClient } from "@/lib/supabase/server";
import { Card, Empty, PageTitle, SearchForm } from "@/components/ui";
import type { Item } from "@/lib/types";
import { describeItem, ITEM_KIND as KIND } from "@/lib/format";

export const metadata = { title: "Itens" };
export default async function Itens({ searchParams }: { searchParams: Promise<{ q?: string; k?: string }> }) {
  const { q, k } = await searchParams;
  const sb = await createClient();
  let query = sb.from("items").select("*").is("campaign_id", null).eq("status", "published").order("kind").order("name");
  if (q) query = query.ilike("name", `%${q.replace(/[%,]/g, " ")}%`);
  if (k) query = query.eq("kind", k);
  const { data } = await query;
  const list = (data ?? []) as Item[];
  return (
    <>
      <PageTitle sub="“AA” é o dado de ataque básico do portador: 3AA = rola o AA 3 vezes e soma.">Equipamentos e itens arcanos</PageTitle>
      <SearchForm q={q} placeholder="Pesquisar item…" />
      <p className="mb-4 flex flex-wrap gap-2 text-sm">
        <a className={`badge no-underline ${!k ? "border-gold-400" : "border-ink-600"}`} href="/itens">Todos</a>
        {Object.entries(KIND).map(([key, label]) => <a key={key} className={`badge no-underline ${k === key ? "border-gold-400" : "border-ink-600"}`} href={`/itens?k=${key}`}>{label}</a>)}
      </p>
      {list.length === 0 ? <Empty>Nenhum item encontrado. Itens arcanos são cadastrados pelo Mestre em “Gerenciar sistema”.</Empty> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((i) => (
            <Card key={i.id} title={i.name}>
              <p className="mb-1 text-xs"><span className="badge border-gold-600/50">{KIND[i.kind] ?? i.kind}</span></p>
              {describeItem(i).map((l) => <p key={l} className="text-sm">{l}</p>)}
              {i.description && <p className="mt-1 text-sm text-parch-300">{i.description}</p>}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
