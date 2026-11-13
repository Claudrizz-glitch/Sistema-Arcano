import Link from "next/link";
import { requireMaster } from "@/lib/data";
import { PageTitle } from "@/components/ui";
import { KIND_DEFS } from "@/lib/content-config";

export const metadata = { title: "Gerenciar sistema" };
const ORDER = ["regras", "feiticos", "bencaos", "itens", "criaturas", "regioes"];
export default async function Sistema() {
  const { sb } = await requireMaster();
  const counts: Record<string, { pub: number; draft: number }> = {};
  await Promise.all(ORDER.map(async (k) => {
    const d = KIND_DEFS[k];
    const [{ count: pub }, { count: draft }] = await Promise.all([
      sb.from(d.table).select("id", { count: "exact", head: true }).is("campaign_id", null).eq("status", "published"),
      sb.from(d.table).select("id", { count: "exact", head: true }).is("campaign_id", null).eq("status", "draft")]);
    counts[k] = { pub: pub ?? 0, draft: draft ?? 0 };
  }));
  return (
    <>
      <PageTitle sub="Conteúdo oficial do Sistema Arcano: vale para todas as campanhas, e o que estiver publicado aparece para todos no site.">Gerenciar sistema</PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/painel/sistema/racas" className="card no-underline hover:border-gold-400"><h2 className="text-xl">Raças</h2><p className="mt-2 text-sm text-parch-300">Textos, variantes e tabelas de progressão de cada raça na mesma página.</p></Link>
        {ORDER.map((k) => { const d = KIND_DEFS[k]; return (
          <Link key={k} href={`/painel/sistema/${k}`} className="card no-underline hover:border-gold-400">
            <h2 className="text-xl">{d.label}</h2><p className="mt-2 text-sm text-parch-300">{counts[k].pub} publicado(s) · {counts[k].draft} rascunho(s)</p></Link>); })}
      </div>
    </>
  );
}
