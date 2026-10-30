"use client";
import { useState } from "react";
import { Msg, useRpc } from "./client";
import { bleedLoss } from "@/domain/bleeding";
import type { Absorption, Bleeding, BleedGradeRow, Sheet } from "@/lib/types";

/** Sangramento: todas as fichas ativas com barra de recurso. Cada ferimento é registrado e encerrado individualmente. */
export function BleedingPanel({ sheet, grades, bleedings, bar }: { sheet: Sheet; grades: BleedGradeRow[]; bleedings: Bleeding[]; bar: number | null }) {
  const { run, busy, msg, setMsg } = useRpc();
  const [grade, setGrade] = useState("1"); const [note, setNote] = useState("");
  const g = grades.find((x) => String(x.grade) === grade);
  const active = bleedings.filter((b) => b.active);
  const lossPerTurn = active.reduce((a, b) => a + (b.rate_percent && bar ? bleedLoss(bar, b.rate_percent) : 0), 0);
  const lethal = active.some((b) => b.grade === 8);
  return (
    <div className="space-y-3">
      {lethal && <p role="alert" className="rounded-md border border-wine-400 bg-wine-700/40 p-3 text-sm font-semibold text-red-200">☠ MORTE IMINENTE no mesmo turno (grau 8). O sistema não declara a morte: o desfecho é decisão do Mestre.</p>}
      {sheet.status !== "ativa" && <p className="text-xs text-amber-300">Sangramentos só são processados em fichas ativas.</p>}
      {active.length === 0 ? <p className="text-sm text-parch-500">Nenhum sangramento ativo.</p> : (
        <>
          <p className="text-sm">Perda total estimada: <b className="text-red-300">{lossPerTurn}</b> por turno <span className="text-xs text-parch-500">(% do máximo atual, arredondado para cima)</span></p>
          <ul className="space-y-2">{active.map((b) => {
            const info = grades.find((x) => x.grade === b.grade);
            return (
              <li key={b.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-ink-600 p-2 text-sm">
                <span>{b.kind === "privacao" ? <b className="text-gold-300">Privação de mana (5%/turno)</b> : <b className="text-gold-300">Grau {b.grade}{b.rate_percent ? ` — ${b.rate_percent}%` : " — morte iminente"}</b>}
                  {b.rate_percent && bar ? <span className="ml-2 text-xs text-red-300">−{bleedLoss(bar, b.rate_percent)}/turno</span> : null}
                  <span className="block text-xs text-parch-500">{info?.description ?? "Mais de 1 minuto sem a barra cheia."}{b.note ? ` · ${b.note}` : ""} · desde o turno {b.started_turn}</span></span>
                <button className="btn btn-sm" disabled={busy} onClick={async () => { if (window.confirm("Encerrar este sangramento?")) await run("remove_bleeding", { p_bleeding: b.id }, "Sangramento encerrado."); }}>Encerrar</button>
              </li>); })}</ul>
        </>)}
      <div className="rounded-md border border-ink-600 p-2">
        <label className="label" htmlFor="bg">Aplicar sangramento</label>
        <select id="bg" className="input" value={grade} onChange={(e) => setGrade(e.target.value)}>{grades.map((x) => <option key={x.grade} value={x.grade}>Grau {x.grade} — {x.percent ? `${x.percent}% do HP máx./turno` : "morte iminente"}</option>)}</select>
        {g && <p className="mt-1 text-xs text-parch-300">{g.description}{g.percent && bar ? ` → ${bleedLoss(bar, g.percent)} por turno nesta ficha.` : ""}</p>}
        <input className="input mt-2" placeholder="Observação (opcional)" aria-label="Observação do ferimento" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn btn-danger mt-2" disabled={busy || sheet.status !== "ativa"} onClick={async () => {
          if (g?.lethal && !window.confirm("Grau 8 = MORTE IMINENTE no mesmo turno. Registrar a condição? (A morte não será declarada automaticamente.)")) return;
          const r = await run("add_bleeding", { p_char: sheet.id, p_grade: Number(grade), p_note: note, p_key: crypto.randomUUID() });
          if (r.ok) { setNote(""); setMsg({ kind: "ok", text: r.data.imminent_death ? "Condição de morte iminente registrada." : `Sangramento de grau ${r.data.grade} iniciado (−${r.data.loss_per_turn}/turno).` }); } }}>Iniciar sangramento</button>
        <p className="mt-1 text-xs text-parch-500">O dano é aplicado automaticamente a cada avanço de turno (uma vez por turno) e é independente do dano direto. Estabilização e tratamento continuam sob controle do Mestre.</p>
      </div>
      <Msg m={msg} />
    </div>
  );
}

/** Forjado: absorção de mana e perfuração do núcleo. */
export function ForgedPanel({ sheet, absorptions, others, turnSeconds }: { sheet: Sheet; absorptions: Absorption[]; others: { id: string; name: string; mana: number | null }[]; turnSeconds: number }) {
  const { run, busy, msg, setMsg } = useRpc();
  const [mode, setMode] = useState<"passiva" | "ativa">("passiva"); const [src, setSrc] = useState("");
  const act = absorptions.find((a) => a.active);
  const perTurn = (mode === "passiva" ? 1 : 5) * turnSeconds;
  return (
    <div className="space-y-3">
      <p className="text-xs text-parch-500">O tempo de absorção é o tempo ficcional: a taxa por segundo é aplicada a cada turno de {turnSeconds} s quando o Mestre avança o turno (servidor, persistente — não há temporizador no navegador).</p>
      {act ? (
        <div className="rounded-md border border-emerald-600/60 bg-ink-900 p-3 text-sm">
          <p className="font-semibold text-emerald-300">● Absorção {act.mode === "passiva" ? "passiva por toque" : "ativa da natureza (meditação)"} em andamento — {act.rate_per_second} mana/s ({act.rate_per_second * turnSeconds} por turno)</p>
          <p className="text-xs text-parch-300">Origem: {act.source_character_id ? others.find((o) => o.id === act.source_character_id)?.name ?? "outra ficha" : act.mode === "ativa" ? "a natureza" : "toque (sem ficha de origem)"} · absorvido até agora: {act.total_absorbed}</p>
          <button className="btn mt-2" disabled={busy} onClick={() => run("stop_absorption", { p_absorption: act.id }, "Absorção encerrada.")}>Encerrar absorção</button>
        </div>
      ) : (
        <div className="space-y-2 rounded-md border border-ink-600 p-2">
          <label className="label" htmlFor="abm">Modalidade</label>
          <select id="abm" className="input" value={mode} onChange={(e) => setMode(e.target.value as "passiva" | "ativa")}><option value="passiva">Passiva por toque — 1 mana/s</option><option value="ativa">Ativa da natureza (meditação) — 5 mana/s</option></select>
          {mode === "passiva" && (<><label className="label" htmlFor="abs">Ficha de origem (opcional)</label>
            <select id="abs" className="input" value={src} onChange={(e) => setSrc(e.target.value)}><option value="">— toque sem ficha de origem —</option>{others.map((o) => <option key={o.id} value={o.id}>{o.name}{o.mana !== null ? ` (${o.mana} mana)` : ""}</option>)}</select></>)}
          <p className="text-xs text-parch-300">{perTurn} de mana por turno; para quando o destino enche ou a origem esgota.</p>
          <button className="btn btn-primary" disabled={busy || sheet.status !== "ativa"} onClick={() => run("start_absorption", { p_char: sheet.id, p_mode: mode, p_source: mode === "passiva" && src ? src : null, p_key: crypto.randomUUID() }, "Absorção iniciada.")}>Iniciar absorção</button>
        </div>)}
      {absorptions.filter((a) => !a.active).slice(0, 3).map((a) => <p key={a.id} className="text-xs text-parch-500">Encerrada ({a.ended_reason?.replace("_", " ")}): {a.mode}, absorveu {a.total_absorbed}.</p>)}
      <div className="divider" />
      <button className="btn btn-danger" disabled={busy || sheet.status === "morta"} onClick={async () => {
        if (!window.confirm("PERFURAÇÃO DO NÚCLEO: morte instantânea do Forjado. Esta ação marca a ficha como MORTA e não pode ser desfeita. Confirmar?")) return;
        const r = await run("pierce_core", { p_char: sheet.id, p_key: crypto.randomUUID() }); if (r.ok) setMsg({ kind: "ok", text: "Perfuração do núcleo registrada: personagem morto." }); }}>Registrar perfuração do núcleo</button>
      <p className="text-xs text-parch-500">Só acionada explicitamente: nenhum dano comum é tratado como perfuração.</p>
      <Msg m={msg} />
    </div>
  );
}
