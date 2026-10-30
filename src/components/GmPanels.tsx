"use client";
import { useMemo, useState } from "react";
import { Msg, newKey, useRpc } from "./client";
import { ACTION_LABEL } from "@/lib/format";
import { featCost } from "@/domain/feats";
import { spellBlock } from "@/domain/eligibility";
import type { Blessing, CharBlessing, CharContract, CharItem, CharModifier, Item, LogRow, Sheet, SheetStatus, Spell } from "@/lib/types";

const REVERSIBLE = ["usar_feitico", "dano", "cura", "restaurar_mana"];
export type RaceCtx = { name: string; canCast: boolean; featBonus: number; immuneSupernatural: boolean; physicalIgnored: boolean; manaIsLife: boolean };

/* ---------- estado da ficha ---------- */
export function StatusPanel({ sheet }: { sheet: Sheet }) {
  const { run, busy, msg } = useRpc();
  const opts: Record<SheetStatus, { to: SheetStatus; label: string; confirm?: string; cls: string }[]> = {
    pendente: [{ to: "ativa", label: "Aprovar e ativar ficha", cls: "btn-primary" }, { to: "morta", label: "Marcar como morto", cls: "btn-danger", confirm: "Registrar a MORTE deste personagem? A ficha será preservada, mas não poderá ser reativada." }],
    ativa: [{ to: "inativa", label: "Desativar ficha", cls: "" }, { to: "morta", label: "Marcar como morto", cls: "btn-danger", confirm: "Registrar a MORTE deste personagem? A ficha será preservada, mas não poderá ser reativada." }],
    inativa: [{ to: "ativa", label: "Ativar ficha", cls: "btn-primary" }, { to: "morta", label: "Marcar como morto", cls: "btn-danger", confirm: "Registrar a MORTE deste personagem? A ficha será preservada, mas não poderá ser reativada." }],
    morta: [],
  };
  const list = opts[sheet.status];
  return (
    <div className="space-y-2">
      {list.length === 0 ? <p className="text-sm text-parch-500">Personagem morto: a ficha é preservada para consulta e não pode ser reativada.</p> : (
        <div className="flex flex-wrap gap-2">{list.map((o) => (
          <button key={o.to} className={`btn ${o.cls}`} disabled={busy} onClick={async () => { if (o.confirm && !window.confirm(o.confirm)) return; await run("transition_sheet", { p_char: sheet.id, p_to: o.to }, "Estado atualizado."); }}>{o.label}</button>))}</div>)}
      <Msg m={msg} />
    </div>
  );
}

/* ---------- vida, mana, sanidade ---------- */
export function ResourcePanel({ sheet, race }: { sheet: Sheet; race: RaceCtx }) {
  const { run, busy, msg, setMsg } = useRpc();
  const [dmg, setDmg] = useState(""); const [heal, setHeal] = useState(""); const [mana, setMana] = useState("");
  const [kind, setKind] = useState("fisico"); const [ovr, setOvr] = useState(false);
  const dead = sheet.status === "morta";
  const shared = race.manaIsLife && sheet.hp_current === null;       // Forjado: uma única barra (Mana = Vida)
  const noHp = sheet.hp_current === null && !shared;
  const blocked = (race.immuneSupernatural && kind !== "fisico") ? "Forjados são imunes a Feitos Mágicos e efeitos sobrenaturais." : (race.physicalIgnored && kind === "fisico") ? "Ataques físicos comuns não afetam os PV de Profanos." : "";
  async function go(fn: string, v: string, label: string, reset: () => void, extra: Record<string, unknown> = {}) {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0) return setMsg({ kind: "erro", text: "Informe um número inteiro maior ou igual a zero." });
    const r = await run(fn, { p_character: sheet.id, p_amount: n, p_key: newKey(), ...extra });
    if (r.ok) { const d = r.data as Record<string, number>; reset();
      setMsg({ kind: "ok", text: `${label}: ${d.hp_before !== undefined ? `Vida ${d.hp_before} → ${d.hp_after}` : `${shared ? "Barra" : "Mana"} ${d.mana_before} → ${d.mana_after}`} (aplicado ${d.applied}).` }); }
  }
  return (
    <div className="space-y-3">
      {shared && <p className="rounded-md border border-arcane-500/50 bg-ink-900 p-2 text-xs text-arcane-400">Barra única: a Mana do Forjado é também a sua Vida. Dano, cura e sangramento atuam sobre ela.</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className="label" htmlFor="dmg">Aplicar dano (final)</label>
          <div className="flex gap-1"><input id="dmg" className="input" inputMode="numeric" value={dmg} onChange={(e) => setDmg(e.target.value)} disabled={dead || noHp} />
            <button className="btn btn-danger" disabled={busy || dead || noHp || dmg === "" || (!!blocked && !ovr)} onClick={() => go("apply_damage", dmg, "Dano", () => setDmg(""), { p_kind: kind, p_override: ovr })}>Aplicar</button></div>
          <label className="label mt-1" htmlFor="dkind">Tipo de dano</label>
          <select id="dkind" className="input !py-1" value={kind} onChange={(e) => setKind(e.target.value)}><option value="fisico">Físico</option><option value="magico">Mágico</option><option value="sobrenatural">Sobrenatural</option></select>
          {blocked && <p className="mt-1 text-xs text-amber-300">{blocked} <label className="ml-1 inline-flex items-center gap-1"><input type="checkbox" checked={ovr} onChange={(e) => setOvr(e.target.checked)} /> exceção do Mestre</label></p>}</div>
        <div><label className="label" htmlFor="heal">Restaurar {shared ? "barra" : "vida"}</label>
          <div className="flex gap-1"><input id="heal" className="input" inputMode="numeric" value={heal} onChange={(e) => setHeal(e.target.value)} disabled={dead || noHp} />
            <button className="btn" disabled={busy || dead || noHp || heal === ""} onClick={() => go("heal", heal, "Cura", () => setHeal(""))}>Curar</button></div></div>
        <div><label className="label" htmlFor="rmana">Restaurar mana</label>
          <div className="flex gap-1"><input id="rmana" className="input" inputMode="numeric" value={mana} onChange={(e) => setMana(e.target.value)} disabled={dead || sheet.mana_current === null} />
            <button className="btn" disabled={busy || dead || sheet.mana_current === null || mana === ""} onClick={() => go("restore_mana", mana, "Mana", () => setMana(""))}>Restaurar</button></div></div>
      </div>
      <p className="text-xs text-parch-500">O dano informado é o valor FINAL já resolvido por você; nenhuma mitigação é aplicada de novo.{noHp ? " Esta raça não tem Vida (regra de dano não documentada)." : ""}</p>
      <details className="rounded-md border border-ink-600 p-2">
        <summary className="cursor-pointer text-sm text-gold-300">Correção manual (Vida, Mana, Sanidade)</summary>
        <form className="mt-2 grid gap-2 sm:grid-cols-4" onSubmit={async (e) => {
          e.preventDefault(); const f = new FormData(e.currentTarget); const num = (k: string) => (String(f.get(k)).trim() === "" ? null : Number(f.get(k)));
          await run("set_resources", { p_character: sheet.id, p_hp: num("hp"), p_mana: num("mana"), p_sanity: num("san"), p_reason: String(f.get("reason") ?? "") }, "Correção registrada.");
        }}>
          {!shared && <div><label className="label" htmlFor="chp">Vida</label><input id="chp" name="hp" className="input" inputMode="numeric" placeholder={String(sheet.hp_current ?? "—")} /></div>}
          <div><label className="label" htmlFor="cmana">{shared ? "Barra (Mana = Vida)" : "Mana"}</label><input id="cmana" name="mana" className="input" inputMode="numeric" placeholder={String(sheet.mana_current ?? "—")} /></div>
          <div><label className="label" htmlFor="csan">Sanidade (0–30)</label><input id="csan" name="san" className="input" inputMode="numeric" placeholder={String(sheet.sanity_current)} /></div>
          <div><label className="label" htmlFor="creason">Motivo</label><input id="creason" name="reason" className="input" /></div>
          <div className="sm:col-span-4"><button className="btn" disabled={busy}>Aplicar correção</button><span className="ml-2 text-xs text-parch-500">Operação administrativa: não é bloqueada por imunidades e não gera regeneração extra.</span></div>
        </form>
      </details>
      <Msg m={msg} />
    </div>
  );
}

/* ---------- nível, XP, conversão ---------- */
export function LevelPanel({ sheet, xpNeeded, canConvert }: { sheet: Sheet; xpNeeded: number | null; canConvert: boolean }) {
  const { run, busy, msg, setMsg, sb } = useRpc();
  const [lvl, setLvl] = useState(String(sheet.level)); const [prev, setPrev] = useState<any>(null); const [xp, setXp] = useState("");
  async function preview() {
    const n = Number(lvl); setPrev(null);
    const { data, error } = await sb.rpc("preview_level_change", { p_char: sheet.id, p_level: n });
    if (error) return setMsg({ kind: "erro", text: error.message.includes("tabela_sem_nivel") ? "A tabela não possui esse nível." : error.message.includes("nivel_invalido") ? "Nível inválido (0 a 21)." : error.message });
    setMsg(null); setPrev(data);
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div><label className="label" htmlFor="lvl">Novo nível (0–21)</label><input id="lvl" className="input w-24" type="number" min={0} max={21} value={lvl} onChange={(e) => { setLvl(e.target.value); setPrev(null); }} /></div>
        <button className="btn" onClick={preview} disabled={busy}>Ver prévia</button>
      </div>
      <p className="text-xs text-parch-500">Nível 0 é uma condição especial depois do 21: dobra Vida, Mana (se houver), dados de ataque, Força de Massa e Velocidade do nível 21.</p>
      {prev && (
        <div className="rounded-md border border-arcane-500/60 bg-ink-900 p-3 text-sm">
          <p className="mb-1 font-semibold text-arcane-400">Prévia: nível {prev.from_level} → {prev.to_level}{prev.special_level_zero ? " (nível especial 0)" : ""}</p>
          <ul className="space-y-0.5">
            <li>Vida máxima: {prev.max_hp[0] ?? "—"} → <b>{prev.max_hp[1] ?? "—"}</b> (atual ficará em {prev.hp_current_after ?? "—"})</li>
            <li>Mana máxima: {prev.max_mana[0] ?? "—"} → <b>{prev.max_mana[1] ?? "—"}</b> (atual ficará em {prev.mana_current_after ?? "—"})</li>
            <li>Dado de AA: {prev.aa_dice[0]} → <b>{prev.aa_dice[1]}</b></li>
          </ul>
          <p className="mt-1 text-xs text-parch-500">A Vida e a Mana atuais NÃO são restauradas — só limitadas ao novo máximo.{sheet.status === "pendente" ? " Como a ficha está pendente, os recursos serão iniciados no máximo." : ""}</p>
          <button className="btn btn-primary mt-2" disabled={busy} onClick={async () => { await run("set_level", { p_char: sheet.id, p_level: Number(lvl), p_expected_version: sheet.version, p_reset_resources: false }, "Nível atualizado."); setPrev(null); }}>Confirmar alteração de nível</button>
        </div>
      )}
      <div className="divider" />
      <p className="text-sm">XP: <b>{sheet.xp}</b>{xpNeeded === null ? " (nível 0: sem evolução por XP)" : <> / {xpNeeded} para o nível {sheet.level + 1} <span className="text-xs text-parch-500">(50 × nível)</span></>}</p>
      <div className="flex flex-wrap items-end gap-2">
        <div><label className="label" htmlFor="xp">Conceder XP</label><input id="xp" className="input w-28" inputMode="numeric" value={xp} onChange={(e) => setXp(e.target.value)} /></div>
        <button className="btn" disabled={busy || xp === ""} onClick={async () => { const r = await run("add_xp", { p_char: sheet.id, p_amount: Number(xp), p_source: "Concessão do Mestre", p_key: newKey() }); if (r.ok) { setXp(""); setMsg({ kind: "ok", text: r.data.level_up ? `XP concedido — subiu para o nível ${r.data.level}!` : `XP concedido (${r.data.xp}${r.data.xp_required ? "/" + r.data.xp_required : ""}).` }); } }}>Conceder</button>
      </div>
      <p className="text-xs text-parch-500">A evolução de nível é controlada pelo Mestre, a menos que a campanha use evolução automática.</p>
      {canConvert && (
        <div className="rounded-md border border-ink-600 p-2">
          <p className="text-sm">Converter em <b>Druída Puro</b> (Semente da Natureza): transformação <b>permanente</b>, independente da raça original. Passa a usar a tabela do Druída Puro, ganha todos os feitiços druídicos e registra a raça anterior.</p>
          <button className="btn mt-2" disabled={busy} onClick={async () => { if (window.confirm("Converter PERMANENTEMENTE este personagem em Druída Puro? Vida/Mana atuais serão apenas limitadas ao novo máximo; nada é apagado.")) await run("convert_progression", { p_char: sheet.id, p_progression: "druida_puro" }, "Conversão aplicada."); }}>Converter em Druída Puro</button>
        </div>
      )}
      <Msg m={msg} />
    </div>
  );
}

/* ---------- seletor genérico de catálogo ---------- */
function Picker({ items, label, onPick, busy, extra }: { items: { id: string; name: string; sub?: string }[]; label: string; onPick: (id: string) => void; busy: boolean; extra?: React.ReactNode }) {
  const [q, setQ] = useState(""); const [sel, setSel] = useState("");
  const shown = useMemo(() => items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())).slice(0, 80), [items, q]);
  return (
    <div className="space-y-2 rounded-md border border-ink-600 p-2">
      <label className="label" htmlFor={`pk-${label}`}>{label}</label>
      <input className="input" placeholder="Pesquisar pelo nome…" value={q} onChange={(e) => setQ(e.target.value)} aria-label={`Pesquisar ${label}`} />
      <select id={`pk-${label}`} className="input" size={Math.min(6, Math.max(2, shown.length))} value={sel} onChange={(e) => setSel(e.target.value)}>
        {shown.map((i) => <option key={i.id} value={i.id}>{i.name}{i.sub ? ` — ${i.sub}` : ""}</option>)}
      </select>
      {extra}
      <button className="btn btn-primary btn-sm" disabled={busy || !sel} onClick={() => onPick(sel)}>Adicionar à ficha</button>
    </div>
  );
}

/* ---------- feitiços ---------- */
export type OwnedSpell = Spell & { granted_at: string };
export function SpellsSection({ sheet, owned, catalog, gm, race }: { sheet: Sheet; owned: OwnedSpell[]; catalog: Spell[]; gm: boolean; race: RaceCtx }) {
  const { run, busy, msg, setMsg } = useRpc();
  const [casting, setCasting] = useState<string | null>(null); const [roll, setRoll] = useState(""); const [inv, setInv] = useState("");
  const ctx = { raceSlug: sheet.race_slug, progression: sheet.progression_slug, effectiveRaceCanCast: race.canCast, effectiveRaceName: race.name };
  const block = (s: Spell) => spellBlock(ctx, { druidic: s.druidic, harmonic: s.harmonic, passive: s.passive, name: s.name, contract: s.kind === "contrato" });
  const available = catalog.filter((c) => !owned.some((o) => o.id === c.id));
  const ok = available.filter((s) => !block(s)); const no = available.filter((s) => block(s) && s.kind !== "contrato");
  const n = Number(roll); const rollOk = Number.isInteger(n) && n >= 1 && n <= 20; const invN = Number(inv);
  async function confirm(s: Spell) {
    const r = await run("cast_spell", { p_character: sheet.id, p_spell: s.id, p_roll: n, p_key: newKey(), ...(s.cost_step ? { p_invested: invN } : {}) });
    if (r.ok) { setCasting(null); setRoll(""); setInv(""); setMsg({ kind: "ok", text: `${s.name}: d20 = ${r.data.roll}${r.data.roll_bonus ? ` (+${r.data.roll_bonus} racial = ${r.data.effective_roll})` : ""} → custo ${r.data.cost} (base ${r.data.base_cost} × ${r.data.multiplier}). Mana ${r.data.mana_before} → ${r.data.mana_after}. Os efeitos não são resolvidos automaticamente; a CD ${r.data.cd ?? "—"} é interpretada por você.` }); }
  }
  return (
    <div className="space-y-3">
      {owned.length === 0 ? <p className="text-sm text-parch-500">Nenhum feitiço concedido.</p> : (
        <ul className="space-y-2">{owned.map((s) => {
          const why = block(s); const stepOk = !s.cost_step || (Number.isInteger(invN) && invN >= s.cost_step && invN % s.cost_step === 0); const cost = s.cost_step ? (stepOk ? invN : null) : s.mana_cost; const fc = casting === s.id && rollOk && cost !== null ? featCost(cost, n, race.featBonus) : null;
          return (
          <li key={s.id} className="rounded-md border border-ink-600 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><b className="font-display text-lg text-gold-300">{s.name}</b> <span className="text-xs text-parch-500">{s.category}</span></div>
              <div className="flex gap-1">
                {gm && !s.passive && <button className="btn btn-primary btn-sm" disabled={busy || sheet.status === "morta" || !!why} title={why ?? undefined} onClick={() => { setCasting(casting === s.id ? null : s.id); setRoll(""); setInv(""); }}>Usar feitiço</button>}
                {gm && <button className="btn btn-sm" disabled={busy} onClick={async () => { if (window.confirm(`Remover “${s.name}” desta ficha? O feitiço continua no catálogo.`)) await run("revoke_spell", { p_char: sheet.id, p_spell: s.id }, "Feitiço removido da ficha."); }}>Remover</button>}
              </div>
            </div>
            <p className="mt-1 flex flex-wrap gap-2 text-xs"><span className="badge border-arcane-500">Mana: {s.mana_cost ?? "não documentado"}</span>{s.cd !== null && <span className="badge border-ink-600">CD {s.cd}</span>}{s.range_text && <span className="badge border-ink-600">Alcance {s.range_text}</span>}{s.harmonic !== null && <span className="badge border-ink-600">{s.harmonic ? "Harmônico" : "Não harmônico"}</span>}{s.passive && <span className="badge border-gold-600/60">Regra passiva — resolvida manualmente</span>}</p>
            {why && <p className="mt-1 text-xs text-amber-300">⚠ Inelegível para esta ficha: {why} (o registro histórico é preservado, mas não pode ser usado).</p>}
            <p className="mt-1 text-sm text-parch-300">{s.description}</p>
            {s.restrictions && <p className="mt-1 text-xs text-parch-500">Restrições: {s.restrictions}</p>}
            {casting === s.id && !why && (
              <div className="mt-2 rounded-md border border-arcane-500/60 bg-ink-900 p-3 text-sm">
                {s.cost_step ? (<div className="mb-2"><label className="label" htmlFor={`inv-${s.id}`}>Mana investida (múltiplos de {s.cost_step})</label><input id={`inv-${s.id}`} className="input w-28" inputMode="numeric" value={inv} onChange={(e) => setInv(e.target.value)} /></div>) : null}
                <label className="label" htmlFor={`roll-${s.id}`}>Teste de Feitos Mágicos — resultado do d20 (1 a 20)</label>
                <input id={`roll-${s.id}`} className="input w-28" inputMode="numeric" autoFocus value={roll} onChange={(e) => setRoll(e.target.value)} />
                {race.featBonus > 0 && <p className="mt-1 text-xs text-arcane-400">Vantagem racial: +{race.featBonus} em Feitos Mágicos (somada ao dado).</p>}
                {cost === null ? <p className="mt-2 text-red-300">{s.cost_step ? `Informe a Mana investida (múltiplos de ${s.cost_step}).` : "Este feitiço não tem custo cadastrado: o servidor recusará o desconto."}</p>
                  : fc ? (<div className="mt-2 space-y-0.5"><p>Multiplicador: <b>{fc.multiplier.toFixed(1).replace(".", ",")}×</b>{fc.bonus ? ` (dado efetivo ${fc.effectiveRoll})` : ""} · Custo final: <b>{fc.cost}</b> de Mana <span className="text-xs text-parch-500">(base {fc.baseCost}, arredondado para cima)</span></p>
                    <p>Mana: {sheet.mana_current ?? "—"} → <b className={(sheet.mana_current ?? 0) < fc.cost ? "text-red-300" : ""}>{(sheet.mana_current ?? 0) - fc.cost}</b></p>
                    {(sheet.mana_current ?? 0) < fc.cost && <p className="text-red-300">Mana insuficiente — o servidor não permitirá a conjuração.</p>}</div>)
                  : <p className="mt-2 text-parch-500">Informe o resultado do dado para calcular o custo.</p>}
                <button className="btn btn-primary mt-2" disabled={busy || !rollOk || cost === null || (fc !== null && (sheet.mana_current ?? 0) < fc.cost)} onClick={() => confirm(s)}>Confirmar uso do feitiço</button>
              </div>)}
          </li>); })}</ul>)}
      {gm && (
        <>
          <Picker label="Conceder feitiço" busy={busy} items={ok.map((s) => ({ id: s.id, name: s.name, sub: `${s.category}${s.mana_cost !== null ? ` · ${s.mana_cost} mana` : ""}` }))} onPick={(id) => run("grant_spell", { p_char: sheet.id, p_spell: id, p_note: "" }, "Feitiço concedido.")} />
          {no.length > 0 && (
            <details className="rounded-md border border-ink-600 p-2 text-sm"><summary className="cursor-pointer text-parch-300">Indisponíveis para esta ficha ({no.length}) — por quê?</summary>
              <ul className="mt-2 space-y-1 text-xs">{no.map((s) => <li key={s.id}><b>{s.name}</b>: <span className="text-parch-500">{block(s)}</span></li>)}</ul></details>)}
        </>)}
      <Msg m={msg} />
    </div>
  );
}

/* ---------- bênçãos ---------- */
export type OwnedBlessing = Blessing & { exception_override: boolean };
export function BlessingsSection({ sheet, owned, catalog, gm, rights }: { sheet: Sheet; owned: OwnedBlessing[]; catalog: Blessing[]; gm: boolean; rights: number }) {
  const { run, busy, msg } = useRpc(); const [ovr, setOvr] = useState(false);
  const commons = owned.filter((b) => !b.is_extra).length;
  const available = catalog.filter((c) => !c.is_extra && !owned.some((o) => o.id === c.id));
  return (
    <div className="space-y-3">
      <p className="text-sm">Bênçãos comuns: <b>{commons}</b> de <b>{rights}</b> direito(s) por nível. <span className="text-xs text-parch-500">A extra do grupo é concedida automaticamente ao completar todas as comuns do grupo e não conta no limite.</span></p>
      {owned.length === 0 ? <p className="text-sm text-parch-500">Nenhuma bênção concedida.</p> : (
        <ul className="space-y-2">{owned.map((b) => (
          <li key={b.id} className="flex items-start justify-between gap-2 rounded-md border border-ink-600 p-3">
            <div><b className="font-display text-gold-300">{b.name}</b> <span className="badge ml-1 border-ink-600">Grupo {b.grp}</span>{b.is_extra && <span className="badge ml-1 border-gold-400 text-gold-300">✦ Extra automática</span>}{b.exception_override && <span className="badge ml-1 border-amber-500 text-amber-300">exceção</span>}
              <p className="mt-1 text-sm text-parch-300">{b.effect || b.description}</p></div>
            {gm && !b.is_extra && <button className="btn btn-sm" disabled={busy} onClick={async () => { if (window.confirm(`Remover a bênção “${b.name}”?`)) await run("revoke_blessing", { p_char: sheet.id, p_blessing: b.id }, "Bênção removida."); }}>Remover</button>}
          </li>))}</ul>)}
      {gm && <Picker label="Conceder bênção comum" busy={busy} items={available.map((b) => ({ id: b.id, name: b.name, sub: `Grupo ${b.grp}` }))}
        extra={<label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={ovr} onChange={(e) => setOvr(e.target.checked)} /> Exceção do Mestre (ignora o limite de bênçãos comuns)</label>}
        onPick={(id) => run("grant_blessing", { p_char: sheet.id, p_blessing: id, p_note: "", p_override: ovr }, "Bênção concedida.")} />}
      <Msg m={msg} />
    </div>
  );
}

/* ---------- itens e equipamentos ---------- */
export type OwnedItem = CharItem & { item: Item };
export function ItemsSection({ sheet, owned, catalog, gm }: { sheet: Sheet; owned: OwnedItem[]; catalog: Item[]; gm: boolean }) {
  const { run, busy, msg } = useRpc(); const [qty, setQty] = useState("1");
  return (
    <div className="space-y-3">
      {owned.length === 0 ? <p className="text-sm text-parch-500">Nenhum item concedido pelo Mestre.</p> : (
        <ul className="space-y-2">{owned.map((o) => (
          <li key={o.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-ink-600 p-3">
            <div><b className="text-gold-300">{o.item.name}</b> <span className="text-xs text-parch-500">×{o.quantity} · {o.item.kind}</span>{o.equipped && <span className="badge ml-2 border-emerald-500 text-emerald-300">● equipado</span>}
              {o.item.description && <p className="text-sm text-parch-300">{o.item.description}</p>}
              <p className="text-xs text-parch-500">{[o.item.damage_dice_count ? `Dano ${o.item.damage_dice_count}d${o.item.damage_dice_sides}${o.item.aa_multiplier ? `+${o.item.aa_multiplier}AA` : ""}${o.item.penetration ? `+${o.item.penetration} pen.` : ""}` : "", o.item.mitigation_dice_count ? `Mitigação ${o.item.mitigation_dice_count}d${o.item.mitigation_dice_sides}` : "", o.item.range_m ? `Alcance ${o.item.range_m}m` : ""].filter(Boolean).join(" · ")}</p></div>
            {o.item.properties?.mechanic === "filho_do_sol" && (
              <div className="w-full rounded-md border border-gold-600/40 bg-ink-900 p-2 text-sm">
                <p>{o.state?.wielded ? <b className="text-emerald-300">● Empunhado — Vida ×2, dados de dano ×2, sem Mana</b> : <span className="text-parch-300">Não empunhado</span>}</p>
                {o.state?.wielded && <p className="text-xs text-parch-300">Vida sacrificada: {o.state?.sacrificed ?? 0} → +{Math.floor((o.state?.sacrificed ?? 0) / 40)}d4 de dano mágico · esfera +{Math.floor((o.state?.sacrificed ?? 0) / 40) * 5} cm (a cada 40 de Vida)</p>}
                {gm && <div className="mt-1 flex flex-wrap items-end gap-2">
                  <button className="btn btn-sm btn-primary" disabled={busy || o.state?.wielded || sheet.status === "morta"} onClick={() => run("wield_item", { p_char_item: o.id, p_wield: true }, "Machado empunhado.")}>Empunhar</button>
                  <button className="btn btn-sm" disabled={busy || !o.state?.wielded} onClick={async () => { if (window.confirm("Largar o Filho do Sol? A maldição se inverte e persiste até empunhá-lo de novo.")) await run("wield_item", { p_char_item: o.id, p_wield: false }, "Machado largado — maldição aplicada."); }}>Largar</button>
                  {o.state?.wielded && <SacrificeForm charItem={o.id} />}</div>}
              </div>)}
            {gm && <div className="flex gap-1">
              {!o.item.properties?.mechanic && <button className="btn btn-sm" disabled={busy} onClick={() => run("set_equipped", { p_char_item: o.id, p_equipped: !o.equipped })}>{o.equipped ? "Desequipar" : "Equipar"}</button>}
              <button className="btn btn-sm" disabled={busy} onClick={async () => { if (window.confirm(`Remover “${o.item.name}” da ficha?`)) await run("revoke_item", { p_char_item: o.id }, "Item removido."); }}>Remover</button></div>}
          </li>))}</ul>)}
      {gm && <Picker label="Conceder item" busy={busy} items={catalog.map((i) => ({ id: i.id, name: i.name, sub: i.kind }))}
        extra={<div><label className="label" htmlFor="qty">Quantidade</label><input id="qty" className="input w-24" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} /></div>}
        onPick={(id) => run("grant_item", { p_char: sheet.id, p_item: id, p_qty: Number(qty) || 1, p_note: "" }, "Item concedido.")} />}
      <Msg m={msg} />
    </div>
  );
}

function SacrificeForm({ charItem }: { charItem: string }) {
  const { run, busy, msg, setMsg } = useRpc(); const [v, setV] = useState("");
  return (<span className="inline-flex flex-wrap items-end gap-1"><input aria-label="Vida a sacrificar" className="input !w-24 !py-1" inputMode="numeric" placeholder="Vida" value={v} onChange={(e) => setV(e.target.value)} />
    <button className="btn btn-sm btn-danger" disabled={busy || v === ""} onClick={async () => { const r = await run("sacrifice_life", { p_char_item: charItem, p_amount: Number(v), p_key: newKey() }); if (r.ok) { setV(""); setMsg({ kind: "ok", text: `Sacrificou ${r.data.sacrificed_now} de Vida (total ${r.data.sacrificed_total}): +${r.data.extra_magic_damage} de dano mágico, esfera +${r.data.sphere_extra_cm} cm.` }); } }}>Sacrificar Vida</button><Msg m={msg} /></span>);
}

/* ---------- contratos ---------- */
export function ContractsSection({ sheet, owned, gm }: { sheet: Sheet; owned: CharContract[]; gm: boolean }) {
  const { run, busy, msg } = useRpc();
  return (
    <div className="space-y-3">
      {owned.length === 0 ? <p className="text-sm text-parch-500">Nenhum contrato.</p> : (
        <ul className="space-y-2">{owned.map((c) => (
          <li key={c.id} className="rounded-md border border-ink-600 p-3"><b className="font-display text-gold-300">{c.name}</b>
            <span className="badge ml-2 border-ink-600">{c.origin}</span>{c.periculosidade && <span className="badge ml-1 border-wine-400">Periculosidade {c.periculosidade}</span>}
            <p className="mt-1 whitespace-pre-line text-sm text-parch-300">{c.description}</p></li>))}</ul>)}
      {gm && (
        <details className="rounded-md border border-ink-600 p-2"><summary className="cursor-pointer text-sm text-gold-300">Adicionar contrato</summary>
          <form className="mt-2 space-y-2" onSubmit={async (e) => { e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
            const r = await run("grant_contract", { p_char: sheet.id, p_name: String(f.get("name")), p_description: String(f.get("desc") ?? ""), p_periculosidade: f.get("per") ? Number(f.get("per")) : null, p_origin: String(f.get("origin")) }, "Contrato registrado."); if (r.ok) form.reset(); }}>
            <div><label className="label" htmlFor="cname">Nome</label><input id="cname" name="name" className="input" required /></div>
            <div><label className="label" htmlFor="cdesc">Descrição</label><textarea id="cdesc" name="desc" className="input" rows={3} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label" htmlFor="cper">Periculosidade (opcional)</label><select id="cper" name="per" className="input"><option value="">—</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
              <div><label className="label" htmlFor="corigin">Origem</label><select id="corigin" name="origin" className="input"><option value="concedido">Concedido</option><option value="inato">Inato (profano)</option></select></div></div>
            <button className="btn btn-primary" disabled={busy}>Salvar contrato</button></form></details>)}
      <Msg m={msg} />
    </div>
  );
}

/* ---------- modificadores ---------- */
export function ModifiersSection({ sheet, mods }: { sheet: Sheet; mods: CharModifier[] }) {
  const { run, busy, msg } = useRpc();
  return (
    <div className="space-y-3">
      {mods.length === 0 ? <p className="text-sm text-parch-500">Nenhum modificador ativo. Modificadores nunca sobrescrevem o valor-base da ficha.</p> : (
        <ul className="space-y-2">{mods.map((m) => (
          <li key={m.id} className="flex items-center justify-between rounded-md border border-ink-600 p-2 text-sm">
            <span><b className="text-gold-300">{m.source}</b> {m.kind === "condicional" && <span className="badge border-emerald-600/60 text-emerald-300">condicional (item)</span>}{m.kind === "maldicao" && <span className="badge border-wine-400 text-red-300">maldição persistente</span>} — Vida ×{m.hp_multiplier} · dados de AA ×{m.aa_dice_count_multiplier}{m.blocks_mana ? " · bloqueia Mana" : ""}{m.note ? <span className="block text-xs text-parch-500">{m.note}</span> : null}</span>
            {m.kind !== "condicional" && <button className="btn btn-sm" disabled={busy} onClick={async () => { if (window.confirm(`Remover o modificador “${m.source}”? A Vida atual será limitada ao novo máximo.`)) await run("remove_modifier", { p_modifier: m.id }, "Modificador removido."); }}>Remover</button>}</li>))}</ul>)}
      <details className="rounded-md border border-ink-600 p-2"><summary className="cursor-pointer text-sm text-gold-300">Modificador personalizado</summary>
        <form className="mt-2 grid gap-2 sm:grid-cols-4" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget);
          await run("add_modifier", { p_char: sheet.id, p_source: String(f.get("src")), p_hp_mult: Number(f.get("hp")), p_aa_mult: Number(f.get("aa")), p_blocks_mana: f.get("bm") === "on", p_note: "", p_supernatural: f.get("sn") === "on" }, "Modificador adicionado."); }}>
          <div><label className="label" htmlFor="msrc">Origem</label><input id="msrc" name="src" className="input" required /></div>
          <div><label className="label" htmlFor="mhp">Vida ×</label><input id="mhp" name="hp" type="number" step="0.1" min="0.1" defaultValue={1} className="input" /></div>
          <div><label className="label" htmlFor="maa">Dados de AA ×</label><input id="maa" name="aa" type="number" min={1} defaultValue={1} className="input" /></div>
          <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" name="bm" /> Bloqueia Mana</label>
          <label className="flex items-end gap-2 pb-2 text-sm sm:col-span-4"><input type="checkbox" name="sn" /> Efeito sobrenatural/mágico (Forjados são imunes)</label>
          <div className="sm:col-span-4"><button className="btn" disabled={busy}>Adicionar</button></div></form></details>
      <Msg m={msg} />
    </div>
  );
}

/* ---------- histórico ---------- */
export function LogSection({ log, gm }: { log: LogRow[]; gm: boolean }) {
  const { run, busy, msg } = useRpc();
  if (log.length === 0) return <p className="text-sm text-parch-500">Sem registros ainda.</p>;
  return (
    <div className="space-y-2">
      <ul className="divide-y divide-ink-700 text-sm">{log.map((l) => {
        const r = l.result as Record<string, any>;
        const det = r.mana_before !== undefined ? `Mana ${r.mana_before} → ${r.mana_after}${r.spell ? ` (${r.spell})` : ""}` : r.hp_before !== undefined ? `Vida ${r.hp_before} → ${r.hp_after}` : "";
        return (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span><b className={l.reverted_at ? "text-parch-500 line-through" : "text-gold-300"}>{ACTION_LABEL[l.action] ?? l.action}</b> {det} <span className="text-xs text-parch-500">· turno {l.turn ?? "—"} · {new Date(l.created_at).toLocaleString("pt-BR")}</span>{l.reverted_at && <span className="badge ml-2 border-ink-600">revertida</span>}</span>
            {gm && REVERSIBLE.includes(l.action) && !l.reverted_at && <button className="btn btn-sm" disabled={busy} onClick={async () => { if (window.confirm("Reverter esta ação? O histórico original é preservado.")) await run("revert_action", { p_action: l.id }, "Ação revertida."); }}>Reverter</button>}
          </li>);
      })}</ul>
      <Msg m={msg} />
    </div>
  );
}

/* ---------- edição de texto: jogador e Mestre ---------- */
export function PlayerEditForm({ sheet }: { sheet: Sheet }) {
  const { run, busy, msg } = useRpc();
  return (
    <form className="space-y-2" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget);
      await run("update_my_sheet", { p_char: sheet.id, p_description: String(f.get("description") ?? ""), p_inventory_text: String(f.get("inventory") ?? ""), p_portrait_url: null }, "Ficha salva."); }}>
      <div><label className="label" htmlFor="pdesc">Descrição</label><textarea id="pdesc" name="description" className="input" rows={4} defaultValue={sheet.description} /></div>
      <div><label className="label" htmlFor="pinv">Inventário (mochila livre)</label><textarea id="pinv" name="inventory" className="input" rows={5} defaultValue={sheet.inventory_text} /></div>
      <p className="text-xs text-parch-500">Você edita apenas descrição e inventário livre. Nível, recursos, feitiços, bênçãos e equipamentos são do Mestre.</p>
      <button className="btn btn-primary" disabled={busy}>Salvar</button><Msg m={msg} />
    </form>
  );
}
export function GmEditForm({ sheet }: { sheet: Sheet }) {
  const { run, busy, msg } = useRpc();
  return (
    <form className="grid gap-2 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget);
      await run("gm_edit_sheet", { p_char: sheet.id, p_fields: { name: String(f.get("name")), title_line: String(f.get("title")), description: String(f.get("description")), inventory_text: String(f.get("inventory")), narrative_notes: String(f.get("notes")), reach_m: Number(f.get("reach")), special_combat_notes: String(f.get("combat")) } }, "Ficha salva."); }}>
      <div><label className="label" htmlFor="gname">Nome</label><input id="gname" name="name" className="input" defaultValue={sheet.name} required /></div>
      <div><label className="label" htmlFor="gtitle">Epíteto / apresentação</label><input id="gtitle" name="title" className="input" defaultValue={sheet.title_line} /></div>
      <div><label className="label" htmlFor="greach">Alcance padrão (m)</label><input id="greach" name="reach" type="number" step="0.5" min={0} className="input" defaultValue={sheet.reach_m} /></div>
      <div><label className="label" htmlFor="gcombat">Condições especiais de combate</label><input id="gcombat" name="combat" className="input" defaultValue={sheet.special_combat_notes} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="gdesc">Descrição</label><textarea id="gdesc" name="description" className="input" rows={3} defaultValue={sheet.description} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="ginv">Inventário livre</label><textarea id="ginv" name="inventory" className="input" rows={3} defaultValue={sheet.inventory_text} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="gnotes">Anotações narrativas</label><textarea id="gnotes" name="notes" className="input" rows={3} defaultValue={sheet.narrative_notes} /></div>
      <div className="sm:col-span-2"><button className="btn btn-primary" disabled={busy}>Salvar</button> <Msg m={msg} /></div>
    </form>
  );
}
