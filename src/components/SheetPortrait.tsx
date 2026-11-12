"use client";
import { useState } from "react";
import { Msg, useRpc } from "./client";
import type { Sheet } from "@/lib/types";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** Retrato da ficha: mostra a imagem e (se permitido) envia uma nova para o Storage ou aceita um endereço. */
export function SheetPortrait({ sheet, canEdit, gm }: { sheet: Sheet; canEdit: boolean; gm: boolean }) {
  const { run, busy, msg, setMsg, sb } = useRpc();
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(sheet.portrait_url ?? "");

  async function save(next: string) {
    const res = gm
      ? await run("gm_edit_sheet", { p_char: sheet.id, p_fields: { portrait_url: next } }, "Retrato atualizado.")
      : await run("update_my_sheet", { p_char: sheet.id, p_portrait_url: next }, "Retrato atualizado.");
    if (res.ok) setUrl(next);
  }
  async function upload(file: File) {
    if (!TYPES.includes(file.type)) return setMsg({ kind: "erro", text: "Use PNG, JPEG, WebP ou GIF." });
    if (file.size > MAX_BYTES) return setMsg({ kind: "erro", text: "A imagem passa de 5 MB." });
    setUploading(true); setMsg(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${sheet.campaign_id}/${sheet.id}-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from("portraits").upload(path, file, { contentType: file.type, upsert: false });
    setUploading(false);
    if (error) return setMsg({ kind: "erro", text: `Falha no envio: ${error.message}` });
    await save(sb.storage.from("portraits").getPublicUrl(path).data.publicUrl);
  }

  return (
    <div className="space-y-2">
      {url ? (
        <a href={url} target="_blank" rel="noopener"><img src={url} alt={`Retrato de ${sheet.name}`} className="mx-auto max-h-80 w-auto rounded-md border border-gold-600/30" /></a>
      ) : <p className="rounded-md border border-dashed border-ink-600 p-6 text-center text-sm text-parch-500">Sem retrato.</p>}
      {canEdit && (
        <>
          <label className="label" htmlFor={`pf-${sheet.id}`}>Enviar imagem (até 5 MB)</label>
          <input id={`pf-${sheet.id}`} type="file" accept={TYPES.join(",")} className="input" disabled={busy || uploading}
            onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) void upload(f); e.currentTarget.value = ""; }} />
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = String(new FormData(e.currentTarget).get("u") ?? "").trim(); if (v && !/^(\/|https:\/\/)/.test(v)) return setMsg({ kind: "erro", text: "Use um caminho do site (/img/…) ou um endereço https://." }); void save(v); }}>
            <input name="u" className="input" placeholder="ou cole um endereço: /img/retratos/… ou https://…" defaultValue={url} aria-label="Endereço da imagem" />
            <button className="btn" disabled={busy || uploading}>Usar</button>
          </form>
          {uploading && <p className="text-xs text-parch-500">Enviando…</p>}
          <Msg m={msg} />
        </>
      )}
    </div>
  );
}
