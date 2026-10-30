import Link from "next/link";
import { requireGm } from "@/lib/data";
import { Card, PageTitle } from "@/components/ui";
import { KIND_DEFS } from "@/lib/content-config";

export const metadata = { title: "Gerenciar sistema" };
export default async function Sistema({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, profile } = await requireGm(id);
  const counts: Record<string, { pub: number; draft: number }> = {};
  for (const d of Object.values(KIND_DEFS)) {
    const [{ count: pub }, { count: draft }] = await Promise.all([
      sb.from(d.table).select("id", { count: "exact", head: true }).eq("status", "published"), sb.from(d.table).select("id", { count: "exact", head: true }).eq("status", "draft")]);
    counts[d.kind] = { pub: pub ?? 0, draft: draft ?? 0 };
  }
  return (
    <>
      <PageTitle sub={profile.is_master ? "Você administra o conteúdo oficial (público) e o desta campanha." : "Você administra o conteúdo desta campanha. O conteúdo oficial só pode ser alterado por um Mestre autorizado da plataforma."}>Gerenciar sistema</PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(KIND_DEFS).map((d) => (
          <Link key={d.kind} href={`/campanha/${id}/sistema/${d.kind}`} className="card no-underline hover:border-gold-400">
            <h2 className="text-xl">{d.label}</h2><p className="mt-2 text-sm text-parch-300">{counts[d.kind].pub} publicado(s) · {counts[d.kind].draft} rascunho(s)</p></Link>))}
        {profile.is_master && <Link href={`/campanha/${id}/sistema/importar`} className="card no-underline hover:border-gold-400"><h2 className="text-xl">Importar conteúdo oficial</h2><p className="mt-2 text-sm text-parch-300">Bestiário (77 entradas) e os 16 itens arcanos, com o texto original do PDF.</p></Link>}
        <Link href={`/campanha/${id}/sistema/racas`} className="card no-underline hover:border-gold-400"><h2 className="text-xl">Raças e variantes (textos)</h2><p className="mt-2 text-sm text-parch-300">Descrições e características narrativas, separadas dos parâmetros mecânicos.</p></Link>
        <Link href={`/campanha/${id}/sistema/progressoes`} className="card no-underline hover:border-gold-400"><h2 className="text-xl">Raças e progressões</h2><p className="mt-2 text-sm text-parch-300">Tabelas de Vida, Mana e dado de AA por nível.</p></Link>
      </div>
    </>
  );
}
