import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Empty, PageTitle, SearchForm } from "@/components/ui";
import type { Topic } from "@/lib/types";

export const metadata = { title: "Regras" };
export default async function Regras({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const sb = await createClient();
  let query = sb.from("rule_topics").select("*").is("campaign_id", null).eq("status", "published").order("sort_order").order("title");
  if (q) query = query.or(`title.ilike.%${q.replace(/[%,]/g, " ")}%,body_md.ilike.%${q.replace(/[%,]/g, " ")}%`);
  const { data } = await query;
  const topics = (data ?? []) as Topic[];
  return (
    <>
      <PageTitle sub="Tópicos publicados do sistema Arcano">Regras de Arkhavel</PageTitle>
      <SearchForm q={q} placeholder="Pesquisar nas regras…" />
      {topics.length === 0 ? <Empty>{q ? "Nenhum tópico encontrado." : "Nenhum tópico publicado ainda. O Mestre publica os tópicos pelo painel “Gerenciar sistema”."}</Empty> : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {topics.map((t) => <li key={t.id}><Link href={`/regras/${t.slug}`} className="card block no-underline hover:border-gold-400"><h2 className="text-lg">{t.title}</h2></Link></li>)}
        </ul>
      )}
    </>
  );
}
