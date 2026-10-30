"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendly } from "@/lib/errors";
import { Msg } from "./client";
import { Markdown } from "./Markdown";
import { KIND_DEFS, NUMERIC, slugify } from "@/lib/content-config";

type Row = Record<string, any>;
export function ContentEditor({ kind, campaignId, userId, canOfficial, row, lookups = {} }: { kind: string; campaignId: string; userId: string; canOfficial: boolean; row: Row | null; lookups?: Record<string, [string, string][]> }) {
  const def = KIND_DEFS[kind]; const sb = useMemo(() => createClient(), []); const router = useRouter();
  const [vals, setVals] = useState<Row>(() => row ?? { [def.nameKey]: "", status: "draft", ...Object.fromEntries(def.fields.filter((f) => f.type === "select" && f.options).map((f) => [f.key, f.options![0][0]])) });
  const [scope, setScope] = useState<"oficial" | "campanha">(row ? (row.campaign_id ? "campanha" : "oficial") : canOfficial ? "oficial" : "campanha");
  const [dirty, setDirty] = useState(false); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ kind: "ok" | "erro"; text: string } | null>(null); const [preview, setPreview] = useState(false);
  useEffect(() => { if (!dirty) return; const h = (e: BeforeUnloadEvent) => { e.preventDefault(); }; window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h); }, [dirty]);
  const set = (k: string, v: unknown) => { setVals((s) => ({ ...s, [k]: v })); setDirty(true); };

  async function save(status: "draft" | "published" | "archived") {
    const name = String(vals[def.nameKey] ?? "").trim();
    if (!name) return setMsg({ kind: "erro", text: "O nome/título é obrigatório." });
    const payload: Row = { [def.nameKey]: name, status, updated_by: userId };
    for (const f of def.fields) {
      let v = vals[f.key];
      if (NUMERIC.has(f.key)) v = v === "" || v === null || v === undefined ? (f.key === "sort_order" ? 0 : null) : Number(v);
      if (f.type === "tri") v = v === "" || v === undefined ? null : v === true || v === "true";
      if (f.type === "bool") v = !!v;
      if (f.key.endsWith("_id") && (v === "" || v === undefined)) v = null;
      if (v === undefined) continue;
      payload[f.key] = v;
    }
    if (kind === "regras") payload.slug = slugify(String(payload.slug || name));
    setBusy(true); setMsg(null);
    let res;
    if (row) res = await sb.from(def.table).update(payload).eq("id", row.id).select("id").single();
    else {
      const cid = scope === "campanha" ? campaignId : null;
      res = await sb.from(def.table).insert({ ...payload, campaign_id: cid, created_by: userId, ...(def.hasSource ? { source: cid ? "campaign" : "official" } : {}) }).select("id").single();
    }
    setBusy(false);
    if (res.error) return setMsg({ kind: "erro", text: friendly(res.error.message) });
    // só confirmamos depois que o banco respondeu
    setDirty(false); setMsg({ kind: "ok", text: status === "published" ? "Publicado." : status === "archived" ? "Arquivado." : "Rascunho salvo." });
    router.push(`/campanha/${campaignId}/sistema/${kind}`); router.refresh();
  }
  async function remove() {
    if (!row || !window.confirm(`Excluir este ${def.singular} definitivamente? Se ele já estiver em fichas ou no histórico, o banco recusará — arquive em vez de excluir.`)) return;
    setBusy(true); const { error } = await sb.from(def.table).delete().eq("id", row.id); setBusy(false);
    if (error) return setMsg({ kind: "erro", text: friendly(error.message) });
    setDirty(false); router.push(`/campanha/${campaignId}/sistema/${kind}`); router.refresh();
  }
  return (
    <form className="card space-y-4" onSubmit={(e) => { e.preventDefault(); save((vals.status as any) ?? "draft"); }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="card-title !mb-0 !border-0 !pb-0">{row ? `Editar ${def.singular}` : `Novo ${def.singular}`}</h2>
        {dirty && <span className="badge border-amber-500 text-amber-300">● alterações não salvas</span>}
      </div>
      {!row && (
        <div><label className="label" htmlFor="scope">Onde publicar</label>
          <select id="scope" className="input max-w-xs" value={scope} onChange={(e) => setScope(e.target.value as any)}>
            {canOfficial && <option value="oficial">Conteúdo oficial do sistema (público)</option>}<option value="campanha">Conteúdo desta campanha</option></select>
          <p className="mt-1 text-xs text-parch-500">Variantes de campanha ficam separadas do oficial — o oficial nunca é alterado em silêncio.</p></div>)}
      {row && <p className="text-xs text-parch-500">Escopo: {row.campaign_id ? "campanha" : "oficial"} · Estado atual: {row.status}. Edições em conteúdo publicado ficam no histórico de revisões.</p>}
      <div><label className="label" htmlFor="nm">{def.nameKey === "title" ? "Título" : "Nome"}</label><input id="nm" className="input" value={vals[def.nameKey] ?? ""} onChange={(e) => set(def.nameKey, e.target.value)} required /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {def.fields.map((f) => (
          <div key={f.key} className={f.wide || f.type === "textarea" ? "sm:col-span-2" : ""}>
            <label className="label" htmlFor={`f-${f.key}`}>{f.label}</label>
            {f.type === "textarea" ? <textarea id={`f-${f.key}`} className="input" rows={f.key === "body_md" ? 16 : 3} value={vals[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
              : f.type === "select" ? <select id={`f-${f.key}`} className="input" value={String(vals[f.key] ?? (f.lookup ? "" : f.options![0][0]))} onChange={(e) => set(f.key, e.target.value)}>{(f.lookup ? [["", "— nenhuma —"] as [string, string], ...(lookups[f.lookup] ?? [])] : f.options!).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              : f.type === "bool" ? <label className="flex items-center gap-2 text-sm"><input id={`f-${f.key}`} type="checkbox" checked={!!vals[f.key]} onChange={(e) => set(f.key, e.target.checked)} /> Sim</label>
              : f.type === "tri" ? <select id={`f-${f.key}`} className="input" value={vals[f.key] === null || vals[f.key] === undefined ? "" : String(vals[f.key])} onChange={(e) => set(f.key, e.target.value)}><option value="">— não se aplica —</option><option value="true">Sim</option><option value="false">Não</option></select>
              : <input id={`f-${f.key}`} className="input" type={f.type === "number" ? "number" : "text"} step={f.key === "range_m" ? "0.5" : undefined} value={vals[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />}
            {f.help && <p className="mt-1 text-xs text-parch-500">{f.help}</p>}
          </div>))}
      </div>
      {kind === "regras" && (<div><button type="button" className="btn btn-sm" onClick={() => setPreview(!preview)}>{preview ? "Ocultar pré-visualização" : "Pré-visualizar"}</button>
        {preview && <div className="mt-2 rounded-md border border-ink-600 p-4"><h2 className="text-2xl">{vals.title}</h2><Markdown source={vals.body_md ?? ""} /></div>}</div>)}
      <Msg m={msg} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" disabled={busy} onClick={() => save("draft")}>Salvar rascunho</button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => save("published")}>Publicar</button>
        {row && <button type="button" className="btn" disabled={busy} onClick={() => save("archived")}>Arquivar</button>}
        {row && <button type="button" className="btn btn-danger ml-auto" disabled={busy} onClick={remove}>Excluir</button>}
      </div>
    </form>
  );
}
