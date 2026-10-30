import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, PageTitle } from "@/components/ui";
import type { ProgRow, ProgTable, Race, Variant } from "@/lib/types";

export default async function Raca({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = await createClient();
  const { data: race } = await sb.from("races").select("*").eq("slug", slug).maybeSingle();
  if (!race) notFound();
  const r = race as Race;
  const tables = r.slug === "druida" ? [r.default_progression, "druida_puro"] : [r.default_progression];
  const [{ data: rows }, { data: vars }, { data: tabs }] = await Promise.all([
    sb.from("progression_rows").select("*").in("table_slug", tables).order("level"),
    sb.from("race_variants").select("*").eq("race_slug", slug),
    sb.from("progression_tables").select("*").in("slug", tables),
  ]);
  const all = (rows ?? []) as ProgRow[]; const info = (tabs ?? []) as ProgTable[];
  return (
    <>
      <PageTitle>{r.name}</PageTitle>
      <Card><p className="text-parch-300">{r.description}</p>{r.notes && <p className="mt-2 whitespace-pre-line text-sm text-parch-500">{r.notes}</p>}</Card>
      {((vars ?? []) as Variant[]).length > 0 && (
        <Card title="Variantes" className="mt-4"><ul className="space-y-3">{((vars ?? []) as Variant[]).map((v) => <li key={v.slug}><h3 className="text-lg">{v.name}</h3><p className="text-sm text-parch-300">{v.description || "Sem descrição cadastrada."}</p></li>)}</ul></Card>
      )}
      {tables.map((t) => {
        const tb = info.find((x) => x.slug === t); const list = all.filter((x) => x.table_slug === t);
        return (
          <Card key={t} title={`Progressão — ${tb?.name ?? t}`} className="mt-4">
            {tb?.notes && <p className="mb-2 text-xs text-parch-500">{tb.notes}</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Vida, Mana e dado de ataque básico por nível</caption>
                <thead><tr className="text-left text-gold-300"><th className="px-2 py-1">Nível</th><th className="px-2 py-1">Vida</th><th className="px-2 py-1">Mana</th><th className="px-2 py-1">Dado de AA</th></tr></thead>
                <tbody>{list.map((x) => (
                  <tr key={x.level} className="border-t border-ink-700">
                    <td className="px-2 py-1">{x.level}</td><td className="px-2 py-1">{x.max_hp ?? "—"}</td><td className="px-2 py-1">{x.max_mana ?? "—"}</td>
                    <td className="px-2 py-1">{x.aa_dice_count}d{x.aa_dice_sides}</td>
                  </tr>))}{list.length === 21 && (() => { const l = list[20]; return (
                  <tr className="border-t border-gold-600/40 bg-ink-900/60"><td className="px-2 py-1 text-gold-300">0 (especial)</td><td className="px-2 py-1">{l.max_hp === null ? "—" : l.max_hp * 2}</td><td className="px-2 py-1">{l.max_mana === null ? "—" : l.max_mana * 2}</td><td className="px-2 py-1">{l.aa_dice_count * 2}d{l.aa_dice_sides}</td></tr>); })()}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-parch-500">“—” significa que a raça não possui o recurso. O nível 0 é uma condição especial: dobra Vida, Mana, dado de ataque, Força de Massa e Velocidade do nível 21. “Dado de AA” é o dano do ataque básico naquele nível.</p>
          </Card>
        );
      })}
      <p className="mt-6"><Link href="/racas">← Todas as raças</Link></p>
    </>
  );
}
