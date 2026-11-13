"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendly } from "@/lib/errors";
import { Msg } from "./client";
import { ProgressionTable } from "./ProgressionEditor";
import type { ProgRow, ProgTable, Race, Variant } from "@/lib/types";

/** Uma raça em uma página: textos (nome, descrição, observações), variantes e tabela(s) de progressão.
 *  Os parâmetros mecânicos (imunidades, quem conjura etc.) não mudam ao editar o texto. */
export function RaceAdmin({ race, variants, tables, rows, usage }: { race: Race; variants: Variant[]; tables: ProgTable[]; rows: ProgRow[]; usage: Record<string, number> }) {
  const sb = useMemo(() => createClient(), []); const router = useRouter();
  const [msg, setMsg] = useState<{ kind: "ok" | "erro"; text: string } | null>(null); const [busy, setBusy] = useState(false);
  async function saveRace(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true);
    const { error } = await sb.from("races").update({ name: String(f.get("name")), description: String(f.get("description")), notes: String(f.get("notes")) }).eq("slug", race.slug);
    setBusy(false); if (error) return setMsg({ kind: "erro", text: friendly(error.message) });
    setMsg({ kind: "ok", text: "Texto da raça salvo." }); router.refresh();
  }
  async function saveVariant(e: React.FormEvent<HTMLFormElement>, v: Variant) {
    e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true);
    const { error } = await sb.from("race_variants").update({ name: String(f.get("name")), description: String(f.get("description")) }).eq("race_slug", v.race_slug).eq("slug", v.slug);
    setBusy(false); if (error) return setMsg({ kind: "erro", text: friendly(error.message) });
    setMsg({ kind: "ok", text: `Variante “${String(f.get("name"))}” salva.` }); router.refresh();
  }
  return (
    <section id={race.slug} className="card scroll-mt-4 space-y-4">
      <form onSubmit={saveRace} className="space-y-2">
        <h2 className="card-title">{race.name}</h2>
        <div className="flex flex-wrap gap-2 text-xs"><span className="badge border-wine-400">{race.has_hp ? "Possui Vida" : "Sem Vida"}</span><span className="badge border-arcane-500">{race.has_mana ? "Possui Mana" : "Sem Mana"}</span>{!race.can_cast && <span className="badge border-parch-500">Não conjura</span>}{race.immune_supernatural && <span className="badge border-gold-600/60">Imune a Feitos Mágicos</span>}{race.feat_bonus > 0 && <span className="badge border-gold-600/60">+{race.feat_bonus} em Feitos Mágicos</span>}</div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div><label className="label" htmlFor={`n-${race.slug}`}>Nome</label><input id={`n-${race.slug}`} name="name" className="input" defaultValue={race.name} required /></div>
        </div>
        <div><label className="label" htmlFor={`d-${race.slug}`}>Descrição</label><textarea id={`d-${race.slug}`} name="description" className="input" rows={4} defaultValue={race.description} /></div>
        <div><label className="label" htmlFor={`o-${race.slug}`}>Características e observações</label><textarea id={`o-${race.slug}`} name="notes" className="input" rows={3} defaultValue={race.notes} /></div>
        <button className="btn btn-primary" disabled={busy}>Salvar texto da raça</button>
      </form>
      {variants.length > 0 && (
        <details className="rounded-md border border-ink-600 p-3" open={variants.length <= 3}>
          <summary className="cursor-pointer text-gold-300">Variantes ({variants.length})</summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">{variants.map((v) => (
            <form key={v.slug} onSubmit={(e) => saveVariant(e, v)} className="space-y-2 rounded-md border border-ink-700 p-3">
              <input name="name" aria-label={`Nome da variante ${v.name}`} className="input" defaultValue={v.name} required />
              <textarea name="description" aria-label={`Descrição da variante ${v.name}`} className="input" rows={5} defaultValue={v.description} />
              <button className="btn btn-sm" disabled={busy}>Salvar variante</button>
            </form>))}</div>
        </details>)}
      {tables.map((t) => (
        <details key={t.slug} className="rounded-md border border-ink-600 p-3">
          <summary className="cursor-pointer text-gold-300">Tabela de progressão — {t.name}</summary>
          <div className="mt-3"><ProgressionTable table={t} rows={rows.filter((r) => r.table_slug === t.slug)} used={usage[t.slug] ?? 0} /></div>
        </details>))}
      <Msg m={msg} />
    </section>
  );
}
