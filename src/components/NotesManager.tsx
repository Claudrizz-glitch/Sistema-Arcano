"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendly } from "@/lib/errors";
import { Msg } from "./client";
import type { Note } from "@/lib/types";

// Acesso direto à tabela master_notes: protegido por RLS (somente o Mestre da campanha lê/escreve).
export function NotesManager({ campaignId, userId, notes }: { campaignId: string; userId: string; notes: Note[] }) {
  const sb = useMemo(() => createClient(), []); const router = useRouter();
  const [editing, setEditing] = useState<Note | "novo" | null>(null); const [q, setQ] = useState(""); const [arch, setArch] = useState(false);
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ kind: "ok" | "erro"; text: string } | null>(null);
  const shown = notes.filter((n) => n.archived === arch && (n.title + n.content + n.tags.join(" ")).toLowerCase().includes(q.toLowerCase()));

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true); setMsg(null);
    const row = { title: String(f.get("title")).trim(), content: String(f.get("content")), tags: String(f.get("tags")).split(",").map((t) => t.trim()).filter(Boolean) };
    const res = editing === "novo" ? await sb.from("master_notes").insert({ ...row, campaign_id: campaignId, author_id: userId }) : await sb.from("master_notes").update(row).eq("id", (editing as Note).id);
    setBusy(false);
    if (res.error) return setMsg({ kind: "erro", text: friendly(res.error.message) });
    setMsg({ kind: "ok", text: "Anotação salva." }); setEditing(null); router.refresh();
  }
  async function toggleArchive(n: Note) { const { error } = await sb.from("master_notes").update({ archived: !n.archived }).eq("id", n.id); if (error) setMsg({ kind: "erro", text: friendly(error.message) }); else router.refresh(); }
  async function del(n: Note) { if (!window.confirm(`Excluir “${n.title || "sem título"}” definitivamente?`)) return; const { error } = await sb.from("master_notes").delete().eq("id", n.id); if (error) setMsg({ kind: "erro", text: friendly(error.message) }); else router.refresh(); }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-1">
        <div className="flex gap-2"><button className="btn btn-primary" onClick={() => setEditing("novo")}>+ Nova anotação</button>
          <button className="btn" onClick={() => setArch(!arch)}>{arch ? "Ver ativas" : "Ver arquivadas"}</button></div>
        <input className="input" type="search" placeholder="Pesquisar título, texto ou etiqueta…" aria-label="Pesquisar anotações" value={q} onChange={(e) => setQ(e.target.value)} />
        {shown.length === 0 ? <p className="rounded-md border border-dashed border-ink-600 p-4 text-center text-sm text-parch-500">Nenhuma anotação. Use este espaço para planejar sessões, segredos, pistas e antagonistas — só você pode ler.</p> : (
          <ul className="space-y-2">{shown.map((n) => (
            <li key={n.id} className="card !p-3"><button className="w-full text-left" onClick={() => setEditing(n)}><b className="font-display text-gold-300">{n.title || "(sem título)"}</b>
              <p className="line-clamp-2 text-sm text-parch-300">{n.content}</p>
              <p className="mt-1 flex flex-wrap gap-1">{n.tags.map((t) => <span key={t} className="badge border-ink-600">{t}</span>)}</p></button>
              <div className="mt-2 flex gap-1"><button className="btn btn-sm" onClick={() => toggleArchive(n)}>{n.archived ? "Desarquivar" : "Arquivar"}</button><button className="btn btn-sm btn-danger" onClick={() => del(n)}>Excluir</button></div></li>))}</ul>)}
      </div>
      <div className="lg:col-span-2">
        {editing ? (
          <form key={editing === "novo" ? "novo" : editing.id} onSubmit={save} className="card space-y-3">
            <h2 className="card-title">{editing === "novo" ? "Nova anotação" : "Editar anotação"} <span className="badge ml-2 border-wine-400 text-xs">🔒 privada</span></h2>
            <div><label className="label" htmlFor="nt">Título</label><input id="nt" name="title" className="input" defaultValue={editing === "novo" ? "" : editing.title} required /></div>
            <div><label className="label" htmlFor="nc">Conteúdo</label><textarea id="nc" name="content" className="input" rows={14} defaultValue={editing === "novo" ? "" : editing.content} /></div>
            <div><label className="label" htmlFor="ng">Etiquetas (separadas por vírgula)</label><input id="ng" name="tags" className="input" defaultValue={editing === "novo" ? "" : editing.tags.join(", ")} /></div>
            <div className="flex gap-2"><button className="btn btn-primary" disabled={busy}>Salvar</button><button type="button" className="btn" onClick={() => setEditing(null)}>Cancelar</button></div>
          </form>
        ) : <p className="rounded-md border border-dashed border-ink-600 p-8 text-center text-sm text-parch-500">Selecione uma anotação ou crie uma nova.</p>}
        <div className="mt-2"><Msg m={msg} /></div>
      </div>
    </div>
  );
}
