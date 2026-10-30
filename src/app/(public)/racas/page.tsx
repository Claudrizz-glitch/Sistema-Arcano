import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageTitle, Empty } from "@/components/ui";
import type { Race, Variant } from "@/lib/types";

export const metadata = { title: "Raças" };
export default async function Racas() {
  const sb = await createClient();
  const [{ data: races }, { data: vars }] = await Promise.all([sb.from("races").select("*").order("name"), sb.from("race_variants").select("*").order("name")]);
  const rs = (races ?? []) as Race[]; const vs = (vars ?? []) as Variant[];
  return (
    <>
      <PageTitle sub="Cada raça segue a sua própria tabela oficial — nenhuma progressão é compartilhada por suposição.">Raças e variantes</PageTitle>
      {rs.length === 0 ? <Empty>Nenhuma raça cadastrada.</Empty> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rs.map((r) => (
            <Link key={r.slug} href={`/racas/${r.slug}`} className="card no-underline hover:border-gold-400">
              <h2 className="text-xl">{r.name}</h2>
              <p className="mt-1 text-sm text-parch-300">{r.description}</p>
              <p className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="badge border-wine-400">{r.has_hp ? "Possui Vida" : "Sem Vida"}</span>
                <span className="badge border-arcane-500">{r.has_mana ? "Possui Mana" : "Sem Mana"}</span>
                {!r.can_cast && <span className="badge border-parch-500">Não conjura</span>}
                {r.immune_supernatural && <span className="badge border-gold-600/60">Imune a Feitos Mágicos</span>}
                {r.mana_is_life && <span className="badge border-arcane-500">Mana = Vida (barra única)</span>}
              </p>
              {vs.filter((v) => v.race_slug === r.slug).length > 0 && <p className="mt-2 text-xs text-parch-500">Variantes: {vs.filter((v) => v.race_slug === r.slug).map((v) => v.name).join(", ")}</p>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
