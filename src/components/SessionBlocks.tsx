"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Msg, useRpc } from "./client";
import { Markdown } from "./Markdown";

/** Bloco de texto de uma sessão (roteiro, anotações do Mestre ou do grupo). Grava por RPC; o banco decide quem pode. */
export function SessionText({ rpc, args, initial, canEdit, hint, empty, startOpen = false }: {
  rpc: string; args: Record<string, unknown>; initial: string; canEdit: boolean; hint: string; empty: string; startOpen?: boolean;
}) {
  const { run, busy, msg } = useRpc();
  const [editing, setEditing] = useState(startOpen && canEdit && !initial);
  if (editing) return (
    <form className="space-y-2" onSubmit={async (e) => { e.preventDefault(); const text = String(new FormData(e.currentTarget).get("t") ?? ""); const r = await run(rpc, { ...args, p_text: text }, "Salvo."); if (r.ok) setEditing(false); }}>
      <textarea name="t" className="input" rows={12} defaultValue={initial} aria-label="Texto" autoFocus />
      <p className="text-xs text-parch-500">{hint}</p>
      <div className="flex gap-2"><button className="btn btn-primary" disabled={busy}>Salvar</button><button type="button" className="btn" onClick={() => setEditing(false)}>Cancelar</button></div>
      <Msg m={msg} />
    </form>
  );
  return (
    <div className="space-y-2">
      {initial ? <div className="text-sm text-parch-100/90"><Markdown source={initial} /></div> : <p className="text-sm text-parch-500">{empty}</p>}
      {canEdit && <button className="btn btn-sm" onClick={() => setEditing(true)}>{initial ? "Editar" : "Escrever"}</button>}
      <Msg m={msg} />
    </div>
  );
}

/** Roteiro da próxima sessão + botão de iniciar. Só o Mestre vê. */
export function NextSession({ campaignId, base, title, script, nextNumber }: { campaignId: string; base: string; title: string; script: string; nextNumber: number }) {
  const { run, busy, msg } = useRpc(); const router = useRouter();
  const [t, setT] = useState(title); const [s, setS] = useState(script);
  const dirty = t !== title || s !== script;
  const save = () => run("session_draft_save", { p_campaign: campaignId, p_title: t, p_script: s }, "Roteiro salvo.");
  return (
    <div className="space-y-2">
      <div><label className="label" htmlFor="ns-t">Título (opcional)</label><input id="ns-t" className="input" value={t} onChange={(e) => setT(e.target.value)} placeholder={`Sessão ${nextNumber}`} /></div>
      <div><label className="label" htmlFor="ns-s">Roteiro da próxima sessão <span className="badge ml-1 border-wine-400 text-xs">🔒 só você vê</span></label>
        <textarea id="ns-s" className="input" rows={10} value={s} onChange={(e) => setS(e.target.value)} placeholder="O que você planeja para a próxima sessão…" /></div>
      <p className="text-xs text-parch-500">Aceita **negrito**, ## títulos, - listas e imagens numa linha própria: ![legenda](/img/…).</p>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn" disabled={busy || !dirty} onClick={save}>Salvar roteiro</button>
        <button className="btn btn-primary" disabled={busy} onClick={async () => {
          if (!window.confirm(`Iniciar a sessão ${nextNumber}? O roteiro passa para a sessão e as anotações do grupo e do Mestre são abertas.`)) return;
          if (dirty) { const r0 = await save(); if (!r0.ok) return; }
          const r = await run("session_start", { p_campaign: campaignId });
          if (r.ok) { setT(""); setS(""); router.push(`${base}?s=${r.data.id}`); router.refresh(); }
        }}>▶ Iniciar próxima sessão</button>
        {dirty && <span className="badge border-amber-500 text-amber-300">● alterações não salvas</span>}
      </div>
      <Msg m={msg} />
    </div>
  );
}
