import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Empty, PageTitle, SearchForm } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import type { Topic } from "@/lib/types";

export const metadata = { title: "Regras" };

/** Cada tópico publicado vira um card completo. O Mestre edita, cria e exclui em Meu painel → Gerenciar sistema → Regras. */
export default async function Regras({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const sb = await createClient();
  let query = sb.from("rule_topics").select("*").is("campaign_id", null).eq("status", "published").order("sort_order").order("title");
  if (q) query = query.or(`title.ilike.%${q.replace(/[%,()]/g, " ")}%,body_md.ilike.%${q.replace(/[%,()]/g, " ")}%`);
  const { data } = await query;
  const topics = (data ?? []) as Topic[];
  return (
    <>
      <PageTitle sub="Regras, lore e referências de Arkhavel">Regras de Arkhavel</PageTitle>
      <SearchForm q={q} placeholder="Pesquisar nas regras…" />
      {topics.length > 1 && !q && (
        <nav aria-label="Tópicos" className="mb-6 flex flex-wrap gap-2 text-sm">
          {topics.map((t) => <a key={t.id} href={`#${t.slug}`} className="badge border-ink-600 no-underline hover:border-gold-400">{t.title}</a>)}
        </nav>
      )}
      {topics.length === 0 ? <Empty>{q ? "Nenhum tópico encontrado." : "Nenhuma regra publicada ainda."}</Empty> : (
        <div className="space-y-6">
          {topics.map((t) => (
            <section key={t.id} id={t.slug} className="card scroll-mt-4">
              <h2 className="card-title flex items-center justify-between gap-2"><span>{t.title}</span><Link href={`/regras/${t.slug}`} className="text-xs font-sans no-underline text-parch-500 hover:text-gold-300">link direto</Link></h2>
              <div className="text-sm text-parch-100/90"><Markdown source={t.body_md} /></div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
