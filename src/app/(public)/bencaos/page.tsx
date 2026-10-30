import { createClient } from "@/lib/supabase/server";
import { Card, Empty, PageTitle, SearchForm } from "@/components/ui";
import type { Blessing } from "@/lib/types";

export const metadata = { title: "Bênçãos" };
export default async function Bencaos({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const sb = await createClient();
  let query = sb.from("blessings").select("*").is("campaign_id", null).eq("status", "published").order("grp").order("is_extra").order("name");
  if (q) query = query.ilike("name", `%${q.replace(/[%,]/g, " ")}%`);
  const { data } = await query;
  const list = (data ?? []) as Blessing[];
  const order = ["I", "II", "III", "IV", "V", "VI"];
  const groups = order.map((g) => ({ g, items: list.filter((b) => b.grp === g) })).filter((x) => x.items.length);
  return (
    <>
      <PageTitle sub="Níveis especiais 3, 5, 8, 13 e 21 concedem o direito a uma bênção (máx. 5 comuns). A bênção extra de cada grupo não conta no limite.">As 22 Bênçãos</PageTitle>
      <SearchForm q={q} placeholder="Pesquisar bênção…" />
      {groups.length === 0 ? <Empty>Nenhuma bênção encontrada.</Empty> : groups.map(({ g, items }) => (
        <section key={g} className="mb-6">
          <h2 className="mb-2 text-2xl">Grupo {g}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((b) => (
              <Card key={b.id} title={b.name} actions={b.is_extra ? <span className="badge border-gold-400 text-gold-300">✦ Extra do grupo</span> : undefined}>
                <p className="text-sm text-parch-300">{b.effect || b.description}</p>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
