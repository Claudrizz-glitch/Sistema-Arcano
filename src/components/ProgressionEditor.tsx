"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendly } from "@/lib/errors";
import { Msg } from "./client";
import type { ProgRow, ProgTable } from "@/lib/types";

/** Tabela de progressão editável (Vida, Mana e dado de AA por nível). Alterar uma linha muda o máximo exibido nas fichas,
 *  sem tocar na Vida e Mana atuais. */
export function ProgressionTable({ table, rows, used }: { table: ProgTable; rows: ProgRow[]; used: number }) {
  const sb = useMemo(() => createClient(), []); const router = useRouter();
  const [edit, setEdit] = useState<Record<number, ProgRow>>({}); const [msg, setMsg] = useState<{ kind: "ok" | "erro"; text: string } | null>(null); const [busy, setBusy] = useState(false);
  async function saveRow(r: ProgRow) {
    if (!window.confirm(`Alterar o nível ${r.level} da tabela “${table.name}”?\n\n${used} ficha(s) usam esta tabela. Os máximos exibidos mudam na hora; Vida e Mana ATUAIS não são alteradas.`)) return;
    setBusy(true); setMsg(null);
    const { error } = await sb.from("progression_rows").update({ max_hp: r.max_hp, max_mana: r.max_mana, aa_dice_count: r.aa_dice_count, aa_dice_sides: r.aa_dice_sides }).eq("table_slug", r.table_slug).eq("level", r.level);
    setBusy(false);
    if (error) return setMsg({ kind: "erro", text: friendly(error.message) });
    setMsg({ kind: "ok", text: `Nível ${r.level} atualizado.` }); setEdit((e) => { const n = { ...e }; delete n[r.level]; return n; }); router.refresh();
  }
  const num = (v: string): number | null => (v === "" ? null : Number(v));
  return (
    <div className="space-y-2">
      <p className="text-xs text-parch-500">{used} ficha(s) usam esta tabela. “—” = a raça não possui o recurso.{table.notes ? ` ${table.notes}` : ""}</p>
      <div className="max-h-[28rem] overflow-auto rounded-lg border border-ink-600"><table className="w-full text-sm">
        <thead className="sticky top-0 bg-ink-800 text-left text-gold-300"><tr><th className="px-2 py-2">Nível</th><th className="px-2 py-2">Vida</th><th className="px-2 py-2">Mana</th><th className="px-2 py-2">AA (qtd × lados)</th><th /></tr></thead>
        <tbody>{rows.map((r) => { const e = edit[r.level] ?? r; const dirty = !!edit[r.level];
          return (<tr key={r.level} className="border-t border-ink-700"><td className="px-2 py-1">{r.level}</td>
            {(["max_hp", "max_mana"] as const).map((k) => <td key={k} className="px-2 py-1"><input aria-label={`${k} nível ${r.level}`} className="input !w-20 !py-1" inputMode="numeric" value={e[k] ?? ""} placeholder="—" onChange={(ev) => setEdit((s) => ({ ...s, [r.level]: { ...e, [k]: num(ev.target.value) } }))} /></td>)}
            <td className="px-2 py-1"><span className="inline-flex items-center gap-1"><input aria-label={`dados nível ${r.level}`} className="input !w-14 !py-1" inputMode="numeric" value={e.aa_dice_count} onChange={(ev) => setEdit((s) => ({ ...s, [r.level]: { ...e, aa_dice_count: Number(ev.target.value) } }))} />d<input aria-label={`lados nível ${r.level}`} className="input !w-14 !py-1" inputMode="numeric" value={e.aa_dice_sides} onChange={(ev) => setEdit((s) => ({ ...s, [r.level]: { ...e, aa_dice_sides: Number(ev.target.value) } }))} /></span></td>
            <td className="px-2 py-1">{dirty && <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => saveRow(e)}>Salvar</button>}</td></tr>);
        })}</tbody></table></div>
      <Msg m={msg} />
    </div>
  );
}
