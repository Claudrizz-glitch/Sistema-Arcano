"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendly } from "@/lib/errors";
import { Msg } from "./client";
import { Markdown } from "./Markdown";
import type { DayNote } from "@/lib/types";

/** Editor de uma anotação de dia (pública ou privada). O RLS do banco decide quem pode gravar. */
export function DayNoteEditor({ campaignId, year, seasonIndex, day, visibility, note, hint }: {
  campaignId: string; year: number; seasonIndex: number; day: number; visibility: "publica" | "privada"; note: DayNote | null; hint: string;
}) {
  const sb = useMemo(() => createClient(), []); const router = useRouter();
  const [editing, setEditing] = useState(false); const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "erro"; text: string } | null>(null);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const content = String(new FormData(e.currentTarget).get("content") ?? "");
    const { error } = await sb.from("day_notes").upsert(
      { campaign_id: campaignId, year, season_index: seasonIndex, day, visibility, content },
      { onConflict: "campaign_id,year,season_index,day,visibility" });
    setBusy(false);
    if (error) return setMsg({ kind: "erro", text: friendly(error.message) });
    setMsg({ kind: "ok", text: "Anotação salva." }); setEditing(false); router.refresh();
  }

  if (editing) return (
    <form onSubmit={save} className="space-y-2">
      <textarea name="content" className="input" rows={14} defaultValue={note?.content ?? ""} aria-label="Texto do dia" />
      <p className="text-xs text-parch-500">{hint}</p>
      <div className="flex gap-2"><button className="btn btn-primary" disabled={busy}>Salvar</button><button type="button" className="btn" onClick={() => setEditing(false)}>Cancelar</button></div>
      <Msg m={msg} />
    </form>
  );
  return (
    <div className="space-y-2">
      {note?.content ? <Markdown source={note.content} /> : <p className="text-sm text-parch-500">Vazio.</p>}
      <div className="flex items-center gap-3"><button className="btn btn-sm" onClick={() => setEditing(true)}>{note?.content ? "Editar" : "Escrever"}</button>
        {note && <span className="text-xs text-parch-500">Atualizado em {new Date(note.updated_at).toLocaleString("pt-BR")}</span>}</div>
      <Msg m={msg} />
    </div>
  );
}
