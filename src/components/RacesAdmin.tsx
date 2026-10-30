"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendly } from "@/lib/errors";
import { Msg } from "./client";
import type { Race, Variant } from "@/lib/types";

/** Edita APENAS textos narrativos (nome, descrição, observações). Os parâmetros mecânicos (Vida, Mana, imunidades, restrições de magia)
 *  vivem em colunas/tabelas separadas e não mudam ao editar o texto. */
export function RacesAdmin({ races, variants, canEdit }: { races: Race[]; variants: Variant[]; canEdit: boolean }) {
  const sb = useMemo(() => createClient(), []); const router = useRouter();
  const [msg, setMsg] = useState<{ kind: "ok" | "erro"; text: string } | null>(null); const [busy, setBusy] = useState(false);
  async function saveRace(e: React.FormEvent<HTMLFormElement>, slug: string) {
    e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true);
    const { error } = await sb.from("races").update({ name: String(f.get("name")), description: String(f.get("description")), notes: String(f.get("notes")) }).eq("slug", slug);
    setBusy(false); if (error) return setMsg({ kind: "erro", text: friendly(error.message) });
    setMsg({ kind: "ok", text: "Texto da raça salvo." }); router.refresh();
  }
  async function saveVariant(e: React.FormEvent<HTMLFormElement>, v: Variant) {
    e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true);
    const { error } = await sb.from("race_variants").update({ name: String(f.get("name")), description: String(f.get("description")) }).eq("race_slug", v.race_slug).eq("slug", v.slug);
    setBusy(false); if (error) return setMsg({ kind: "erro", text: friendly(error.message) });
    setMsg({ kind: "ok", text: "Texto da variante salvo." }); router.refresh();
  }
  return (
    <div className="space-y-4">
      {!canEdit && <p className="card text-sm text-parch-300">Somente um Mestre autorizado da plataforma pode editar as raças oficiais.</p>}
      <Msg m={msg} />
      {races.map((r) => (
        <section key={r.slug} className="card">
          <form onSubmit={(e) => saveRace(e, r.slug)} className="space-y-2">
            <h2 className="card-title">{r.name}</h2>
            <div className="flex flex-wrap gap-2 text-xs"><span className="badge border-wine-400">{r.has_hp ? "Possui Vida" : "Sem Vida"}</span><span className="badge border-arcane-500">{r.has_mana ? "Possui Mana" : "Sem Mana"}</span>{!r.can_cast && <span className="badge border-parch-500">Não conjura</span>}{r.immune_supernatural && <span className="badge border-gold-600/60">Imune a Feitos Mágicos</span>}{r.feat_bonus > 0 && <span className="badge border-gold-600/60">+{r.feat_bonus} em Feitos Mágicos</span>}<span className="text-parch-500">(parâmetros mecânicos: não editáveis por texto)</span></div>
            <div><label className="label" htmlFor={`n-${r.slug}`}>Nome</label><input id={`n-${r.slug}`} name="name" className="input" defaultValue={r.name} disabled={!canEdit} required /></div>
            <div><label className="label" htmlFor={`d-${r.slug}`}>Descrição</label><textarea id={`d-${r.slug}`} name="description" className="input" rows={5} defaultValue={r.description} disabled={!canEdit} /></div>
            <div><label className="label" htmlFor={`o-${r.slug}`}>Características e observações</label><textarea id={`o-${r.slug}`} name="notes" className="input" rows={4} defaultValue={r.notes} disabled={!canEdit} /></div>
            {canEdit && <button className="btn btn-primary" disabled={busy}>Salvar texto</button>}
          </form>
          {variants.filter((v) => v.race_slug === r.slug).map((v) => (
            <form key={v.slug} onSubmit={(e) => saveVariant(e, v)} className="mt-3 space-y-2 rounded-md border border-ink-600 p-3">
              <p className="text-xs uppercase tracking-wider text-parch-500">Variante</p>
              <input name="name" aria-label={`Nome da variante ${v.name}`} className="input" defaultValue={v.name} disabled={!canEdit} required />
              <textarea name="description" aria-label={`Descrição da variante ${v.name}`} className="input" rows={4} defaultValue={v.description} disabled={!canEdit} />
              {canEdit && <button className="btn btn-sm" disabled={busy}>Salvar variante</button>}
            </form>))}
        </section>))}
    </div>
  );
}
