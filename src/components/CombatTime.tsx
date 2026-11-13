"use client";
import { useMemo, useState } from "react";
import { Msg, newKey, useRpc } from "./client";
import { Bar } from "./ui";
import type { Encounter, Participant, Sheet } from "@/lib/types";

/* ---------- avançar turno ---------- */
export function TimePanel({ campaignId, turn, turnSeconds, sessionStart = 0, sessionNumber = null }: { campaignId: string; turn: number; turnSeconds: number; sessionStart?: number; sessionNumber?: number | null }) {
  const rel = (n: number) => Math.max(0, n - sessionStart);
  const { run, busy, msg, setMsg } = useRpc();
  const [n, setN] = useState("1"); const [unit, setUnit] = useState<"turnos" | "horas" | "dias">("turnos"); const [last, setLast] = useState<any>(null);
  const perUnit = unit === "turnos" ? 1 : unit === "horas" ? Math.round(3600 / turnSeconds) : Math.round(86400 / turnSeconds);
  const label = (by: number) => { const s = by * turnSeconds; return s >= 86400 ? `${+(s / 86400).toFixed(2)} dia(s)` : s >= 3600 ? `${+(s / 3600).toFixed(2)} hora(s)` : `${s} s`; };
  async function advance(by: number) {
    const r = await run(by > 1000 ? "advance_time" : "advance_turn", by > 1000
      ? { p_campaign: campaignId, p_expected_turn: turn, p_turns: by, p_key: newKey() }
      : { p_campaign: campaignId, p_expected_turn: turn, p_by: by, p_key: newKey() });
    if (r.ok) { setLast(r.data); setMsg({ kind: "ok", text: `Turno ${rel(r.data.from_turn)} → ${rel(r.data.to_turn)} (${label(by)} de tempo).` }); }
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-parch-300">Turno atual{sessionNumber ? ` da sessão ${sessionNumber}` : ""}: <b className="text-2xl text-gold-300">{rel(turn)}</b></p>
      <div className="flex flex-wrap items-end gap-2">
        <button className="btn btn-primary text-base" disabled={busy} onClick={() => advance(1)}>Passar para o próximo turno</button>
        <div><label className="label" htmlFor="ntr">Passar tempo</label><div className="flex gap-1">
          <input id="ntr" className="input w-20" type="number" min={1} max={unit === "turnos" ? 1000 : unit === "horas" ? 720 : 30} value={n} onChange={(e) => setN(e.target.value)} />
          <select aria-label="Unidade de tempo" className="input w-28" value={unit} onChange={(e) => setUnit(e.target.value as any)}><option value="turnos">turnos</option><option value="horas">horas</option><option value="dias">dias</option></select>
          <button className="btn" disabled={busy || Number(n) < 1} onClick={() => { const by = Math.round(Number(n) * perUnit); if (by > 1 && !window.confirm(`Passar ${n} ${unit} (${by} turnos, ${label(by)})? A regeneração será aplicada a todas as fichas ativas.`)) return; advance(by); }}>Passar</button></div></div>
      </div>
      <p className="text-xs text-parch-500">O avanço exige o turno que você está vendo: se alguém já avançou, a operação é recusada em vez de duplicar a regeneração. Fichas pendentes e mortas não regeneram. Acima de 1000 turnos (cerca de 1h40), a regeneração é aplicada de uma vez — nesse caso, sangramentos, absorções de mana e Forjados abaixo de 100% precisam ser resolvidos antes.</p>
      <Msg m={msg} />
      {last && (
        <div className="space-y-2 rounded-md border border-arcane-500/60 bg-ink-900 p-3 text-sm">
          <p className="font-semibold text-arcane-400">Efeitos aplicados pelo servidor{last.date ? ` — agora: ${last.date.season}, dia ${last.date.day} · Ano ${last.date.year}` : ""}</p>
          {(last.alerts ?? []).map((a: any) => <p key={a.character_id} role="alert" className="rounded border border-wine-400 bg-wine-700/40 p-2 font-semibold text-red-200">☠ {a.name}: MORTE IMINENTE (sangramento de grau 8). A morte não é declarada automaticamente.</p>)}
          {last.regen.length === 0 ? <p className="text-parch-500">Nenhuma ficha precisou de alteração de recursos.</p> : (
            <ul className="space-y-1">{last.regen.map((r: any) => (
              <li key={r.character_id}><b>{r.name}</b>: {r.hp[0] !== r.hp[1] ? `Vida ${r.hp[0]} → ${r.hp[1]} ` : ""}{r.mana[0] !== r.mana[1] ? `Mana/barra ${r.mana[0]} → ${r.mana[1]} ` : ""}
                {r.bleed > 0 && <span className="text-red-300">· sangramento −{r.bleed}</span>}{r.absorbed_in > 0 && <span className="text-emerald-300"> · absorveu +{r.absorbed_in}</span>}{r.absorbed_out > 0 && <span className="text-amber-300"> · cedeu −{r.absorbed_out}</span>}
                {(r.events ?? []).map((e: any, i: number) => <span key={i} className="ml-2 badge border-ink-600">t{e.turn}: {String(e.evento).replace(/_/g, " ")}{e.motivo ? ` (${String(e.motivo).replace(/_/g, " ")})` : ""}</span>)}</li>))}</ul>)}
        </div>
      )}
    </div>
  );
}

/* ---------- encontros ---------- */
export function CreateEncounterForm({ campaignId, sheets }: { campaignId: string; sheets: Sheet[] }) {
  const { run, busy, msg } = useRpc();
  const [sel, setSel] = useState<Record<string, { on: boolean; init: string; revealed: boolean }>>({});
  const upd = (id: string, p: Partial<{ on: boolean; init: string; revealed: boolean }>) => setSel((s) => { const base = s[id] ?? { on: false, init: "", revealed: false }; return { ...s, [id]: { ...base, ...p } }; });
  const chosen = sheets.filter((s) => sel[s.id]?.on);
  return (
    <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      const parts = [...chosen].sort((a, b) => Number(sel[b.id].init || -1e9) - Number(sel[a.id].init || -1e9)).map((s) => ({ character_id: s.id, initiative: sel[s.id].init === "" ? null : Number(sel[s.id].init), revealed: sel[s.id].revealed }));
      const r = await run("create_encounter", { p_campaign: campaignId, p_name: String(f.get("name") ?? ""), p_participants: parts }, "Encontro criado.");
      if (r.ok) setSel({});
    }}>
      <div><label className="label" htmlFor="en">Nome do encontro</label><input id="en" name="name" className="input" placeholder="Emboscada na estrada" /></div>
      <fieldset><legend className="label">Participantes</legend>
        <ul className="max-h-72 space-y-1 overflow-y-auto">{sheets.filter((s) => s.status === "ativa" || s.kind === "mestre").map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 rounded border border-ink-600 px-2 py-1 text-sm">
            <label className="flex flex-1 items-center gap-2"><input type="checkbox" checked={!!sel[s.id]?.on} onChange={(e) => upd(s.id, { on: e.target.checked })} /> {s.name} <span className="text-xs text-parch-500">{s.kind === "mestre" ? "NPC" : "Jogador"}</span></label>
            <input aria-label={`Iniciativa de ${s.name}`} className="input w-20 !py-1" inputMode="numeric" placeholder="Inic." value={sel[s.id]?.init ?? ""} onChange={(e) => upd(s.id, { init: e.target.value })} />
            {s.kind === "mestre" && <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!sel[s.id]?.revealed} onChange={(e) => upd(s.id, { revealed: e.target.checked })} /> revelar aos jogadores</label>}
          </li>))}</ul>
        <p className="mt-1 text-xs text-parch-500">A iniciativa não tem fórmula oficial no documento: informe os valores (ou deixe em branco) e ajuste a ordem manualmente depois. NPCs só aparecem para os jogadores se revelados, e a ficha continua privada.</p>
      </fieldset>
      <button className="btn btn-primary" disabled={busy || chosen.length === 0}>Iniciar encontro ({chosen.length})</button><Msg m={msg} />
    </form>
  );
}

type PRow = Participant & { sheet?: Sheet };
export function EncounterBoard({ encounter, parts, gm }: { encounter: Encounter; parts: PRow[]; gm: boolean }) {
  const { run, busy, msg } = useRpc();
  const sorted = useMemo(() => [...parts].sort((a, b) => a.position - b.position), [parts]);
  const active = encounter.status === "ativo";
  async function reorder(from: number, to: number) {
    if (to < 0 || to >= sorted.length) return;
    const arr = [...sorted]; const [m] = arr.splice(from, 1); arr.splice(to, 0, m);
    await run("set_encounter_order", { p_encounter: encounter.id, p_order: arr.map((p) => ({ character_id: p.character_id, initiative: p.initiative })) });
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">Rodada <b className="text-gold-300">{encounter.round}</b> · {active ? "em andamento" : "encerrado"}</p>
        {gm && active && (
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={busy || sorted.length === 0} onClick={() => run("next_in_order", { p_encounter: encounter.id, p_expected_position: encounter.current_position })}>Próximo da ordem ▶</button>
            <button className="btn btn-danger" disabled={busy} onClick={async () => { if (window.confirm("Encerrar o encontro? Vida e Mana NÃO são restauradas.")) await run("end_encounter", { p_encounter: encounter.id }, "Encontro encerrado."); }}>Encerrar</button>
          </div>)}
      </div>
      {gm && <p className="text-xs text-parch-500">“Próximo da ordem” só move o ponteiro de iniciativa. O tempo da campanha avança apenas em <b>Passar o tempo</b>, para nunca avançar duas vezes.</p>}
      {sorted.length === 0 ? <p className="text-sm text-parch-500">Nenhum participante visível.</p> : (
        <ol className="space-y-2">{sorted.map((p, i) => {
          const cur = active && i === encounter.current_position;
          return (
            <li key={p.id} aria-current={cur ? "step" : undefined} className={`rounded-md border p-3 ${cur ? "border-gold-400 bg-gold-600/10" : "border-ink-600"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p><span className="mr-2 text-parch-500">{i + 1}.</span><b className="font-display text-lg">{p.display_name}</b>{cur && <span className="badge ml-2 border-gold-400 text-gold-300">▶ agora</span>}{active && i === (encounter.current_position + 1) % sorted.length && sorted.length > 1 && <span className="badge ml-2 border-ink-600">próximo</span>}
                  {p.sheet ? <span className="ml-2 text-xs text-parch-500">{p.sheet.kind === "mestre" ? "NPC" : "Jogador"}</span> : null}
                  {p.initiative !== null && <span className="ml-2 text-xs text-parch-500">Inic. {p.initiative}</span>}</p>
                {gm && active && (
                  <div className="flex flex-wrap gap-1">
                    <button className="btn btn-sm" aria-label="Subir na ordem" disabled={busy || i === 0} onClick={() => reorder(i, i - 1)}>▲</button>
                    <button className="btn btn-sm" aria-label="Descer na ordem" disabled={busy || i === sorted.length - 1} onClick={() => reorder(i, i + 1)}>▼</button>
                    {p.sheet?.kind === "mestre" && <button className="btn btn-sm" disabled={busy} onClick={() => run("reveal_participant", { p_encounter: encounter.id, p_character: p.character_id, p_revealed: !p.revealed })}>{p.revealed ? "Ocultar" : "Revelar"}</button>}
                  </div>)}
              </div>
              {gm && p.sheet && <div className="mt-2 grid gap-2 sm:grid-cols-2"><Bar label="Vida" current={p.sheet.hp_current} max={p.sheet.max_hp} tone="hp" /><Bar label="Mana" current={p.sheet.mana_current} max={p.sheet.max_mana} tone="mana" /></div>}
              {gm && p.sheet?.kind === "mestre" && <p className="mt-1 text-xs text-parch-500">{p.revealed ? "Visível aos jogadores (só o nome)" : "Oculto dos jogadores"}</p>}
            </li>);
        })}</ol>)}
      <Msg m={msg} />
    </div>
  );
}
