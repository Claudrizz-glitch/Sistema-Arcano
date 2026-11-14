"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendly } from "@/lib/errors";
import { Msg } from "./client";
import { Markdown } from "./Markdown";
import type { Note } from "@/lib/types";

type Editing = Note | "novo" | null;

// Acesso direto à tabela plot_notes: protegido por RLS (somente o Mestre autorizado, dono da anotação, lê e escreve).
export function NotesManager({ userId, notes }: { userId: string; notes: Note[] }) {
  const sb = useMemo(() => createClient(), []); const router = useRouter();
  const [editing, setEditing] = useState<Editing>(null); const [q, setQ] = useState(""); const [arch, setArch] = useState(false); const [tag, setTag] = useState("");
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ kind: "ok" | "erro"; text: string } | null>(null);
  const allTags = useMemo(() => [...new Set(notes.flatMap((n) => n.tags))].sort(), [notes]);
  const shown = notes.filter((n) => n.archived === arch && (!tag || n.tags.includes(tag)) && (n.title + n.content + n.tags.join(" ")).toLowerCase().includes(q.toLowerCase()));

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true); setMsg(null);
    const row = { title: String(f.get("title")).trim(), content: String(f.get("content")), tags: String(f.get("tags")).split(",").map((t) => t.trim()).filter(Boolean) };
    const res = editing === "novo" ? await sb.from("plot_notes").insert({ ...row, author_id: userId }) : await sb.from("plot_notes").update(row).eq("id", (editing as Note).id);
    setBusy(false);
    if (res.error) return setMsg({ kind: "erro", text: friendly(res.error.message) });
    setMsg({ kind: "ok", text: "Anotação salva." }); setEditing(null); router.refresh();
  }
  async function toggleArchive(n: Note) { const { error } = await sb.from("plot_notes").update({ archived: !n.archived }).eq("id", n.id); if (error) setMsg({ kind: "erro", text: friendly(error.message) }); else router.refresh(); }
  async function del(n: Note) { if (!window.confirm(`Excluir “${n.title || "sem título"}” definitivamente?`)) return; const { error } = await sb.from("plot_notes").delete().eq("id", n.id); if (error) setMsg({ kind: "erro", text: friendly(error.message) }); else router.refresh(); }

  const form = (n: Note | null) => (
    <form key={n?.id ?? "novo"} onSubmit={save} className="card space-y-3 border-gold-400/60">
      <h2 className="card-title flex items-center justify-between">{n ? "Editar anotação" : "Nova anotação"} <span className="badge border-wine-400 text-xs">🔒 privada</span></h2>
      <div><label className="label" htmlFor={`nt-${n?.id ?? "novo"}`}>Título</label><input id={`nt-${n?.id ?? "novo"}`} name="title" className="input" defaultValue={n?.title ?? ""} required /></div>
      <div><label className="label" htmlFor={`nc-${n?.id ?? "novo"}`}>Conteúdo</label><textarea id={`nc-${n?.id ?? "novo"}`} name="content" className="input" rows={12} defaultValue={n?.content ?? ""} />
        <p className="mt-1 text-xs text-parch-500">Aceita **negrito**, ## títulos, - listas, tabelas com | e imagens numa linha própria: ![legenda](/img/…).</p></div>
      <div><label className="label" htmlFor={`ng-${n?.id ?? "novo"}`}>Etiquetas (separadas por vírgula)</label><input id={`ng-${n?.id ?? "novo"}`} name="tags" className="input" defaultValue={n?.tags.join(", ") ?? ""} /></div>
      <div className="flex gap-2"><button className="btn btn-primary" disabled={busy}>Salvar</button><button type="button" className="btn" onClick={() => setEditing(null)}>Cancelar</button></div>
    </form>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-primary" onClick={() => setEditing("novo")}>+ Nova anotação</button>
        <button className="btn" onClick={() => setArch(!arch)}>{arch ? "Ver ativas" : "Ver arquivadas"}</button>
        <input className="input max-w-sm flex-1" type="search" placeholder="Pesquisar título, texto ou etiqueta…" aria-label="Pesquisar anotações" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {allTags.length > 0 && (
        <p className="flex flex-wrap gap-2 text-xs">
          <button className={`badge ${tag === "" ? "border-gold-400 text-gold-300" : "border-ink-600"}`} onClick={() => setTag("")}>Todas</button>
          {allTags.map((t) => <button key={t} className={`badge ${tag === t ? "border-gold-400 text-gold-300" : "border-ink-600"}`} onClick={() => setTag(tag === t ? "" : t)}>{t}</button>)}
        </p>)}
      <Msg m={msg} />
      {editing === "novo" && form(null)}
      {shown.length === 0 && editing !== "novo" ? <p className="rounded-md border border-dashed border-ink-600 p-8 text-center text-sm text-parch-500">Nenhuma anotação{arch ? " arquivada" : ""}. Use este espaço para o enredo do mundo: segredos, pistas, antagonistas e o que ainda vai acontecer — só você pode ler.</p> : (
        <div className="columns-1 gap-4 lg:columns-2 [&>*]:mb-4 [&>*]:break-inside-avoid">
          {shown.map((n) => editing !== "novo" && editing?.id === n.id ? <div key={n.id}>{form(n)}</div> : (
            <article key={n.id} className="card">
              <header className="card-title flex items-start justify-between gap-2">
                <span>{n.title || "(sem título)"}</span>
                <span className="shrink-0 text-xs font-sans text-parch-500">{new Date(n.updated_at).toLocaleDateString("pt-BR")}</span>
              </header>
              {n.tags.length > 0 && <p className="mb-2 flex flex-wrap gap-1">{n.tags.map((t) => <span key={t} className="badge border-gold-600/50 text-xs">{t}</span>)}</p>}
              <div className="text-sm text-parch-100/90">{n.content ? <Markdown source={n.content} /> : <p className="text-parch-500">Sem conteúdo.</p>}</div>
              <footer className="mt-3 flex flex-wrap gap-2 border-t border-ink-700 pt-3">
                <button className="btn btn-sm" onClick={() => setEditing(n)}>Editar</button>
                <button className="btn btn-sm" onClick={() => toggleArchive(n)}>{n.archived ? "Desarquivar" : "Arquivar"}</button>
                <button className="btn btn-sm btn-danger ml-auto" onClick={() => del(n)}>Excluir</button>
              </footer>
            </article>))}
        </div>)}
    </div>
  );
}
