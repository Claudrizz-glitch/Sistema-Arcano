import { requireMaster } from "@/lib/data";
import { PageTitle } from "@/components/ui";
import { RaceAdmin } from "@/components/RacesAdmin";
import type { ProgRow, ProgTable, Race, Variant } from "@/lib/types";

export const metadata = { title: "Raças" };
export default async function RacasAdmin() {
  const { sb } = await requireMaster();
  const [{ data: rs }, { data: vs }, { data: tabs }, { data: rows }, { data: used }] = await Promise.all([
    sb.from("races").select("*").order("name"), sb.from("race_variants").select("*").order("name"),
    sb.from("progression_tables").select("*"), sb.from("progression_rows").select("*").order("level"), sb.from("characters").select("progression_slug")]);
  const usage: Record<string, number> = {};
  (used ?? []).forEach((u: { progression_slug: string }) => { usage[u.progression_slug] = (usage[u.progression_slug] ?? 0) + 1; });
  // Druída Puro é variante do Druída: a tabela dele aparece junto com a do Druída.
  const races = ((rs ?? []) as Race[]).filter((r) => r.slug !== "druida_puro");
  const allTabs = (tabs ?? []) as ProgTable[];
  return (
    <>
      <PageTitle sub="Edite o texto, as variantes e a tabela de cada raça. Alterar texto nunca muda Vida, Mana ou regras de magia.">Raças</PageTitle>
      <nav aria-label="Raças" className="mb-4 flex flex-wrap gap-2 text-sm">{races.map((r) => <a key={r.slug} href={`#${r.slug}`} className="badge border-ink-600 no-underline hover:border-gold-400">{r.name}</a>)}</nav>
      <div className="space-y-6">{races.map((r) => {
        const slugs = r.slug === "druida" ? [r.default_progression, "druida_puro"] : [r.default_progression];
        return <RaceAdmin key={r.slug} race={r} variants={((vs ?? []) as Variant[]).filter((v) => v.race_slug === r.slug)}
          tables={slugs.map((s) => allTabs.find((t) => t.slug === s)).filter(Boolean) as ProgTable[]} rows={(rows ?? []) as ProgRow[]} usage={usage} />;
      })}</div>
    </>
  );
}
