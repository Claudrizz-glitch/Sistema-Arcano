"use client";
import { useState } from "react";
import { Msg, useRpc } from "./client";
import { Markdown } from "./Markdown";
import { Collapsible } from "./Collapsible";
import type { Sheet } from "@/lib/types";

type Field = "description" | "inventory_text" | "narrative_notes";
const META: Record<Field, { title: string; empty: string; hint: string }> = {
  description: { title: "Descrição", empty: "Sem descrição.", hint: "Aparência, personalidade, história." },
  inventory_text: { title: "Inventário (mochila livre)", empty: "Mochila vazia.", hint: "Itens comuns e anotações de carga." },
  narrative_notes: { title: "Anotações narrativas", empty: "Sem anotações narrativas.", hint: "Passado, segredos e ganchos do personagem." },
};
const grow = (s: string) => Math.min(30, Math.max(4, s.split("\n").length + Math.ceil(s.length / 90)));

/** Um card por campo de texto da ficha: mostra o texto COMPLETO e edita no próprio card. O Mestre edita os três; o jogador edita descrição e inventário. */
export function SheetTextCard({ sheet, field, canEdit, gm }: { sheet: Sheet; field: Field; canEdit: boolean; gm: boolean }) {
  const { run, busy, msg } = useRpc();
  const [editing, setEditing] = useState(false);
  const m = META[field]; const value = (sheet as unknown as Record<string, string>)[field] ?? "";
  async function save(text: string) {
    const r = gm ? await run("gm_edit_sheet", { p_char: sheet.id, p_fields: { [field]: text } }, "Salvo.")
      : await run("update_my_sheet", { p_char: sheet.id, ...(field === "description" ? { p_description: text } : { p_inventory_text: text }) }, "Salvo.");
    if (r.ok) setEditing(false);
  }
  return (
    <section className="card">
      <h2 className="card-title">{m.title}</h2>
      {editing ? (
        <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); void save(String(new FormData(e.currentTarget).get("t") ?? "")); }}>
          <textarea name="t" className="input" rows={grow(value)} defaultValue={value} aria-label={m.title} autoFocus />
          <p className="text-xs text-parch-500">{m.hint} Aceita **negrito**, - listas e imagens numa linha própria: ![legenda](/img/…).</p>
          <div className="flex gap-2"><button className="btn btn-primary" disabled={busy}>Salvar</button><button type="button" className="btn" onClick={() => setEditing(false)}>Cancelar</button></div>
        </form>
      ) : (
        <div className="space-y-2">
          {value ? <Collapsible><div className="text-sm text-parch-100/90"><Markdown source={value} /></div></Collapsible> : <p className="text-sm text-parch-500">{m.empty}</p>}
          {canEdit && <button className="btn btn-sm" onClick={() => setEditing(true)}>{value ? "Editar" : "Escrever"}</button>}
        </div>
      )}
      <Msg m={msg} />
    </section>
  );
}
