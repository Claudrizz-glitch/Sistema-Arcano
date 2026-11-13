"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const death = "Registrar a MORTE deste personagem? A ficha continua existindo e pode ser revivida depois.";
  const opts: Record<SheetStatus, { to: SheetStatus; label: string; confirm?: string; cls: string }[]> = {
    pendente: [{ to: "ativa", label: "Aprovar e ativar ficha", cls: "btn-primary" }, { to: "morta", label: "Marcar como morto", cls: "btn-danger", confirm: death }],
    ativa: [{ to: "morta", label: "Marcar como morto", cls: "btn-danger", confirm: death }],
    morta: [{ to: "ativa", label: "Reviver personagem", cls: "btn-primary", confirm: "Reviver este personagem? A ficha volta a ficar ativa; ajuste Vida e Mana no painel ao lado se precisar." }],
  };
  const list = opts[sheet.status] ?? [];
  async function remove() {
    if (!window.confirm(`EXCLUIR a ficha “${sheet.name}”? Ela some de vez, com feitiços, itens, bênçãos e efeitos. Não dá para desfazer.`)) return;
    const res = await run("delete_sheet", { p_char: sheet.id });
    if (res.ok) router.push(`/campanha/${sheet.campaign_id}/fichas`);
  }
  return (
    <div className="space-y-2">
      {sheet.status === "morta" && <p className="text-sm text-parch-500">Personagem morto. Você pode revivê-lo ou excluir a ficha.</p>}
      <div className="flex flex-wrap gap-2">{list.map((o) => (
        <button key={o.to} className={`btn ${o.cls}`} disabled={busy} onClick={async () => { if (o.confirm && !window.confirm(o.confirm)) return; await run("transition_sheet", { p_char: sheet.id, p_to: o.to }, "Estado atualizado."); }}>{o.label}</button>))}
        <button className="btn btn-danger" disabled={busy} onClick={remove}>Excluir ficha</button>
      </div>
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
export function SpellsSection({ sheet, owned, catalog, gm, race, deck = false }: { sheet: Sheet; owned: OwnedSpell[]; catalog: Spell[]; gm: boolean; race: RaceCtx; deck?: boolean }) {
  const { run, busy, msg, setMsg } = useRpc();
  const [casting, setCasting] = useState<string | null>(null); const [roll, setRoll] = useState(""); const [inv, setInv] = useState("");
  const ctx = { raceSlug: sheet.race_slug, progression: sheet.progression_slug, effectiveRaceCanCast: race.canCast, effectiveRaceName: race.name };
  const block = (s: Spell) => spellBlock(ctx, { druidic: s.druidic, harmonic: s.harmonic, passive: s.passive, name: s.name, contract: s.kind === "contrato", category: s.category });
  const available = catalog.filter((c) => !owned.some((o) => o.id === c.id));
  const ok = available.filter((s) => !block(s)); const no = available.filter((s) => block(s) && s.kind !== "contrato");
  const n = Number(roll); const rollOk = Number.isInteger(n) && n >= 1 && n <= (deck ? 6 : 20);
  // Baralho Arcano: o resultado do teste é sempre 15 + 1d6 (acima de 20 conta como 20 para o custo).
  const featRoll = deck ? Math.min(20, 15 + n) : n; const invN = Number(inv);
  async function confirm(s: Spell) {
    const r = await run("cast_spell", { p_character: sheet.id, p_spell: s.id, p_roll: n, p_key: newKey(), ...(s.cost_step ? { p_invested: invN } : {}) });
    if (r.ok) { setCasting(null); setRoll(""); setInv(""); setMsg({ kind: "ok", text: `${s.name}: ${r.data.deck ? `15 + 1d6 (${r.data.roll})` : `d20 = ${r.data.roll}`}${r.data.roll_bonus ? ` (+${r.data.roll_bonus} racial = ${r.data.effective_roll})` : ""} → custo ${r.data.cost} (base ${r.data.base_cost} × ${r.data.multiplier}). Mana ${r.data.mana_before} → ${r.data.mana_after}. Os efeitos não são resolvidos automaticamente; a CD ${r.data.cd ?? "—"} é interpretada por você.` }); }
  }
  return (
    <div className="space-y-3">
      {owned.length === 0 ? <p className="text-sm text-parch-500">Nenhum feitiço concedido.</p> : (
        <ul className="space-y-2">{owned.map((s) => {
          const why = block(s); const stepOk = !s.cost_step || (Number.isInteger(invN) && invN >= s.cost_step && invN % s.cost_step === 0); const cost = s.cost_step ? (stepOk ? invN : null) : s.mana_cost; const fc = casting === s.id && rollOk && cost !== null ? featCost(cost, featRoll, race.featBonus, s.cd) : null;
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
                <label className="label" htmlFor={`roll-${s.id}`}>{deck ? "Teste de Feitos Mágicos — Baralho Arcano: informe o 1d6 (resultado = 15 + 1d6)" : "Teste de Feitos Mágicos — resultado do d20 (1 a 20)"}{s.cd !== null ? ` · CD ${s.cd}` : ""}</label>
                <p className="mb-1 text-xs text-parch-500">Abaixo da CD, o custo de Mana sobe proporcionalmente; tirar 1 no dado custa 2×.</p>
                <input id={`roll-${s.id}`} className="input w-28" inputMode="numeric" autoFocus value={roll} onChange={(e) => setRoll(e.target.value)} />
                {race.featBonus > 0 && <p className="mt-1 text-xs text-arcane-400">Vantagem racial: +{race.featBonus} em Feitos Mágicos (somada ao dado).</p>}
                {cost === null ? <p className="mt-2 text-red-300">{s.cost_step ? `Informe a Mana investida (múltiplos de ${s.cost_step}).` : "Este feitiço não tem custo cadastrado: o servidor recusará o desconto."}</p>
                  : fc ? (<div className="mt-2 space-y-0.5"><p>Multiplicador: <b>{fc.multiplier.toFixed(2).replace(".", ",")}×</b>{fc.bonus ? ` (dado efetivo ${fc.effectiveRoll})` : ""} · Custo final: <b>{fc.cost}</b> de Mana <span className="text-xs text-parch-500">(base {fc.baseCost}, arredondado para cima)</span></p>
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
export type OwnedBlessing = Blessing & { exception_override: boolean; complete?: boolean };
export function BlessingsSection({ sheet, owned, catalog, gm, rights }: { sheet: Sheet; owned: OwnedBlessing[]; catalog: Blessing[]; gm: boolean; rights: number }) {
  const { run, busy, msg } = useRpc(); const [ovr, setOvr] = useState(false); const [complete, setComplete] = useState(false);
  const commons = owned.filter((b) => !b.is_extra && !b.complete).length;
  // Completa: qualquer uma das 22 (inclusive a do emoji). Fragmentada: só as comuns; a extra vem automática.
  const available = catalog.filter((c) => (complete || !c.is_extra) && !owned.some((o) => o.id === c.id));
  return (
    <div className="space-y-3">
      <p className="text-sm">Bênçãos fragmentadas: <b>{commons}</b> de <b>{rights}</b> slot(s) por nível. <span className="text-xs text-parch-500">A extra do grupo é concedida automaticamente ao completar todas as comuns do grupo e não conta no limite. Bênçãos Completas (Arcanos e Bispos) não ocupam slot.</span></p>
      {owned.length === 0 ? <p className="text-sm text-parch-500">Nenhuma bênção concedida.</p> : (
        <ul className="space-y-2">{owned.map((b) => (
          <li key={b.id} className="flex items-start justify-between gap-2 rounded-md border border-ink-600 p-3">
            <div><b className="font-display text-gold-300">{b.name}</b> <span className="badge ml-1 border-ink-600">Grupo {b.grp}</span>{b.complete ? <span className="badge ml-1 border-arcane-500 text-arcane-400">☀ Completa</span> : b.is_extra && <span className="badge ml-1 border-gold-400 text-gold-300">✦ Extra automática</span>}{b.exception_override && <span className="badge ml-1 border-amber-500 text-amber-300">exceção</span>}
              <p className="mt-1 text-sm text-parch-300">{b.effect || b.description}</p></div>
            {gm && (!b.is_extra || b.complete) && <button className="btn btn-sm" disabled={busy} onClick={async () => { if (window.confirm(`Remover a bênção “${b.name}”?`)) await run("revoke_blessing", { p_char: sheet.id, p_blessing: b.id }, "Bênção removida."); }}>Remover</button>}
          </li>))}</ul>)}
      {gm && <Picker label={complete ? "Conceder Bênção Completa" : "Conceder bênção fragmentada"} busy={busy} items={available.map((b) => ({ id: b.id, name: b.name, sub: `Grupo ${b.grp}${b.is_extra ? " · extra" : ""}` }))}
        extra={<div className="space-y-1">
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={complete} onChange={(e) => setComplete(e.target.checked)} /> Bênção Completa (só Arcanos e Bispos — sem limite, não ocupa slot)</label>
          {!complete && <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={ovr} onChange={(e) => setOvr(e.target.checked)} /> Exceção do Mestre (ignora o limite de slots)</label>}</div>}
        onPick={(id) => run("grant_blessing", { p_char: sheet.id, p_blessing: id, p_note: "", p_override: complete ? false : ovr, p_complete: complete }, complete ? "Bênção Completa concedida." : "Bênção concedida.")} />}
      <Msg m={msg} />
    </div>
  );
}

/* ---------- itens e equipamentos ---------- */
export type OwnedItem = CharItem & { item: Item };
export function ItemsSection({ sheet, owned, catalog, gm, targets = [], turnSeconds = 6, turn = 0, blessings = [] }: { sheet: Sheet; owned: OwnedItem[]; catalog: Item[]; gm: boolean; targets?: { id: string; name: string; level: number }[]; turnSeconds?: number; turn?: number; blessings?: string[] }) {
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
            <ItemMechanics o={o} sheet={sheet} gm={gm} targets={targets} turnSeconds={turnSeconds} />
            <ItemMechanics2 o={o} sheet={sheet} gm={gm} targets={targets} turn={turn} blessings={blessings} />
            {gm && <div className="flex gap-1">
              {!o.item.properties?.mechanic && <button className="btn btn-sm" disabled={busy} onClick={() => run("set_equipped", { p_char_item: o.id, p_equipped: !o.equipped })}>{o.equipped ? "Desequipar" : "Equipar"}</button>}
              <button className="btn btn-sm" disabled={busy} onClick={async () => { if (window.confirm(["estigma", "coracao_rubro", "ovelha_lobo", "olho_de_cobra", "bau_mirral"].includes(String(o.item.properties?.mechanic)) ? `“${o.item.name}” é permanente pelas regras. Remover mesmo assim (apaga contadores e estado)?` : `Remover “${o.item.name}” da ficha?`)) await run("revoke_item", { p_char_item: o.id }, "Item removido."); }}>Remover</button></div>}
          </li>))}</ul>)}
      {gm && <Picker label="Conceder item" busy={busy} items={catalog.map((i) => ({ id: i.id, name: i.name, sub: i.kind }))}
        extra={<div><label className="label" htmlFor="qty">Quantidade</label><input id="qty" className="input w-24" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} /></div>}
        onPick={(id) => run("grant_item", { p_char: sheet.id, p_item: id, p_qty: Number(qty) || 1, p_note: "" }, "Item concedido.")} />}
      <Msg m={msg} />
    </div>
  );
}

/* ---------- mecânicas dos itens (Fase 1) ---------- */
function ItemMechanics({ o, sheet, gm, targets, turnSeconds }: { o: OwnedItem; sheet: Sheet; gm: boolean; targets: { id: string; name: string; level: number }[]; turnSeconds: number }) {
  const { run, busy, msg, setMsg } = useRpc();
  const [dmg, setDmg] = useState(""); const [tgt, setTgt] = useState(""); const [tlv, setTlv] = useState(""); const [card, setCard] = useState("");
  const p = o.item.properties ?? {}; const m = p.mechanic as string | undefined; const dead = sheet.status === "morta";
  const box = "w-full rounded-md border border-arcane-500/50 bg-ink-900 p-2 text-sm";
  if (o.item.kind === "arma" && o.item.damage_dice_count) {
    const limit = 5 * o.item.damage_dice_count * (o.item.damage_dice_sides ?? 0);
    if (!gm) return null;
    return (
      <div className={box}>
        <p className="text-xs text-parch-500">Desgaste: um único golpe acima de <b>{limit}</b> de dano (5× o dano máximo da arma) quebra a arma.</p>
        <div className="mt-1 flex flex-wrap items-end gap-2">
          <input aria-label="Dano do golpe" className="input !w-24 !py-1" inputMode="numeric" placeholder="Dano" value={dmg} onChange={(e) => setDmg(e.target.value)} />
          <button className="btn btn-sm" disabled={busy || dmg === ""} onClick={async () => { const r = await run("weapon_hit", { p_char_item: o.id, p_damage: Number(dmg) }); if (r.ok) { setDmg(""); setMsg(r.data.broke ? { kind: "erro", text: `${r.data.item} QUEBROU: golpe de ${r.data.damage} passou do limite de ${r.data.limit}. Item descartado.` } : { kind: "ok", text: `${r.data.item} aguentou o golpe de ${r.data.damage} (limite ${r.data.limit}).` }); } }}>Registrar golpe</button>
        </div><Msg m={msg} />
      </div>);
  }
  if (m === "pocao" || m === "semente") {
    const what = m === "semente" ? "Consumir: converte permanentemente em Druída Puro e libera todos os feitiços druídicos." : p.heal ? `Cura ${p.heal} de Vida.` : `Restaura ${p.mana} de Mana.`;
    return (
      <div className={box}><p className="text-xs text-parch-300">{what}</p>
        {gm && <button className="btn btn-sm btn-primary mt-1" disabled={busy || dead} onClick={async () => { if (m === "semente" && !window.confirm("Consumir a Semente da Natureza? A conversão em Druída Puro é permanente.")) return; const r = await run("use_item", { p_char_item: o.id }); if (r.ok) setMsg({ kind: "ok", text: r.data.hp ? `Vida ${r.data.hp[0]} → ${r.data.hp[1]}.` : r.data.mana ? `Mana ${r.data.mana[0]} → ${r.data.mana[1]}.` : "Convertido em Druída Puro." }); }}>{m === "semente" ? "Consumir" : "Usar"}</button>}
        <Msg m={msg} /></div>);
  }
  if (m === "manto") {
    const mode = o.state?.mode as string | undefined;
    const cost = (k: string) => Number(p[k] ?? 0) * turnSeconds;
    return (
      <div className={box}>
        <p>{mode ? <b className="text-arcane-400">● {mode === "invisivel" ? "Invisível" : "Intangível"} — {cost(mode)} de Mana por turno</b> : <span className="text-parch-300">Desligado</span>}</p>
        <p className="text-xs text-parch-500">Invisibilidade: {cost("invisivel")}/turno · Intangibilidade: {cost("intangivel")}/turno. Descontado a cada turno; sem Mana, desliga sozinho.</p>
        {gm && <div className="mt-1 flex flex-wrap gap-1">
          <button className="btn btn-sm" disabled={busy || dead || mode === "invisivel"} onClick={() => run("set_cloak", { p_char_item: o.id, p_mode: "invisivel" }, "Invisibilidade ligada.")}>Invisível</button>
          <button className="btn btn-sm" disabled={busy || dead || mode === "intangivel"} onClick={() => run("set_cloak", { p_char_item: o.id, p_mode: "intangivel" }, "Intangibilidade ligada.")}>Intangível</button>
          <button className="btn btn-sm" disabled={busy || !mode} onClick={() => run("set_cloak", { p_char_item: o.id, p_mode: null }, "Manto desligado.")}>Desligar</button></div>}
        <Msg m={msg} /></div>);
  }
  if (m === "olho_de_cobra") {
    return (
      <div className={box}>
        <div className="rounded border border-gold-600/40 p-2"><p className="text-xs uppercase tracking-wider text-parch-500">Carisma</p><p className="font-display text-xl text-gold-300">+5 em todos os dados</p><p className="text-xs text-parch-500">Vê intenções, desejos e culpas como sombras ao redor das pessoas.</p></div>
        {gm && <div className="mt-2 space-y-1">
          <p className="text-xs text-parch-300">Extração de Informação: custa de 8% a 30% da Vida máxima, conforme a diferença de nível.</p>
          <div className="flex flex-wrap items-end gap-2">
            <select aria-label="Alvo" className="input !w-48 !py-1" value={tgt} onChange={(e) => { setTgt(e.target.value); setTlv(""); }}><option value="">Escolha uma ficha…</option>{targets.map((t) => <option key={t.id} value={t.id}>{t.name} (nv {t.level})</option>)}</select>
            <span className="text-xs text-parch-500">ou nível</span>
            <input aria-label="Nível do alvo" className="input !w-20 !py-1" inputMode="numeric" placeholder="0–21" value={tlv} onChange={(e) => { setTlv(e.target.value); setTgt(""); }} />
            <button className="btn btn-sm btn-danger" disabled={busy || dead || (!tgt && tlv === "")} onClick={async () => { const r = await run("eye_extract", { p_char_item: o.id, p_target: tgt || null, p_target_level: tgt ? null : Number(tlv) }); if (r.ok) setMsg({ kind: "ok", text: `${r.data.alvo}: ${r.data.qualidade}. Custou ${r.data.custo} de Vida (${r.data.percentual}% da máxima) — Vida ${r.data.hp[0]} → ${r.data.hp[1]}.` }); }}>Extrair informação</button>
          </div></div>}
        <Msg m={msg} /></div>);
  }
  if (m === "baralho_arcano") {
    const omens = (p.omens ?? []) as { card: string; text: string }[];
    return (
      <div className={box}>
        <p className="text-xs text-parch-300">Teste de Feitos Mágicos sempre <b>15 + 1d6</b>. Concede Granada, Construtos de Mana e Reforço.</p>
        {gm && <div className="mt-1 flex flex-wrap items-end gap-2">
          <button className="btn btn-sm btn-primary" disabled={busy} onClick={async () => { const r = await run("draw_omen", { p_char_item: o.id, p_card: null }); if (r.ok) setMsg({ kind: "ok", text: `${r.data.card}: ${r.data.text}` }); }}>Tirar carta</button>
          <select aria-label="Carta tirada na mesa" className="input !w-48 !py-1" value={card} onChange={(e) => setCard(e.target.value)}><option value="">…ou a carta tirada na mesa</option>{omens.map((c) => <option key={c.card} value={c.card}>{c.card}</option>)}</select>
          <button className="btn btn-sm" disabled={busy || !card} onClick={async () => { const r = await run("draw_omen", { p_char_item: o.id, p_card: card }); if (r.ok) { setCard(""); setMsg({ kind: "ok", text: `${r.data.card}: ${r.data.text}` }); } }}>Registrar</button></div>}
        <Msg m={msg} /></div>);
  }
  return null;
}

/* ---------- mecânicas dos itens (Fases 2 e 3) — só o Mestre aciona; o jogador vê o painel ---------- */
const HEART_TIERS: [number, number, string][] = [[99, 5, "Morte iminente no mesmo turno"], [84, 4, "Apagões, colapso muscular, estado de choque"], [67, 3, "Visão escurecendo, tremores fortes, perda de equilíbrio"], [50, 2.5, "Confusão, dor no peito, perda de coordenação"], [34, 2, "Visão turva, respiração acelerada, fraqueza"], [17, 1.5, "Tontura leve e suor frio"], [9, 1.2, "Aumento de frequência cardíaca"]];
function ItemMechanics2({ o, sheet, gm, targets, turn, blessings }: { o: OwnedItem; sheet: Sheet; gm: boolean; targets: { id: string; name: string; level: number }[]; turn: number; blessings: string[] }) {
  const { run, busy, msg, setMsg } = useRpc();
  const [a, setA] = useState(""); const [b, setB] = useState(""); const [c, setC] = useState(""); const [d, setD] = useState("");
  const p = o.item.properties ?? {}; const m = p.mechanic as string | undefined; const st = (o.state ?? {}) as Record<string, any>; const dead = sheet.status === "morta";
  const box = "w-full rounded-md border border-arcane-500/50 bg-ink-900 p-2 text-sm space-y-1";
  const num = "input !w-24 !py-1";

  if (m === "espada_carmesim") {
    const glow = st.glow_until != null && turn <= st.glow_until; const hits = glow ? (st.hits ?? 0) : 0; const perm = glow ? (st.perm ?? 0) : 0; const cd = 18 - perm - hits;
    return (
      <div className={box}>
        <p>CD de Ruptura atual: <b className="text-xl text-gold-300">{cd}</b> {glow ? <span className="badge ml-1 border-wine-400 text-red-300">● brilhando até o turno {st.glow_until}</span> : <span className="text-xs text-parch-500">lâmina apagada (CD base 18)</span>}</p>
        <p className="text-xs text-parch-500">Cada ataque básico reduz a CD em 1 e renova o brilho por 12 s (2 turnos). Ruptura ativada: a CD volta ao valor base, que fica 1 ponto menor enquanto o brilho durar. Anões podem usar.</p>
        {gm && <div className="flex flex-wrap items-end gap-2">
          <button className="btn btn-sm" disabled={busy || dead} onClick={async () => { const r = await run("crimson_attack", { p_char_item: o.id }); if (r.ok) setMsg({ kind: "ok", text: `Ataque básico: CD de Ruptura agora ${r.data.cd}.` }); }}>Ataque básico</button>
          <input aria-label="d20 da Ruptura" className={num} inputMode="numeric" placeholder="d20" value={a} onChange={(e) => setA(e.target.value)} />
          <button className="btn btn-sm btn-primary" disabled={busy || dead || a === ""} onClick={async () => { const r = await run("crimson_rupture", { p_char_item: o.id, p_roll: Number(a) }); if (r.ok) { setA(""); setMsg(r.data.success ? { kind: "ok", text: `Ruptura ATIVADA (d20 ${r.data.roll} ≥ CD ${r.data.cd}): dano dobrado como mágico +2d6, ignorando armadura. Próxima CD: ${r.data.next_cd}.` } : { kind: "erro", text: `Ruptura falhou (d20 ${r.data.roll} < CD ${r.data.cd}).` }); } }}>Ativar Ruptura</button></div>}
        <Msg m={msg} /></div>);
  }

  if (m === "fio_bifurcado") {
    const path = st.path as "ignea" | "boreal" | undefined; const stacks = st.stacks ?? 0; const souls = (st.souls ?? []) as string[];
    const steps = ((p.paths ?? {})[path ?? "ignea"] ?? []) as { at: number; text: string }[];
    return (
      <div className={box}>
        <p>{path ? <>Caminho: <b className="text-gold-300">{path === "ignea" ? "Lâmina Ígnea (apunhalar)" : "Lâmina Boreal (lançar)"}</b> · Acúmulos: <b className="text-xl text-gold-300">{stacks}</b> · {souls.length} alma(s)</> : <span className="text-parch-300">Nenhum caminho escolhido.</span>}</p>
        {path && <ul className="space-y-0.5 text-xs">{steps.map((x) => <li key={x.at} className={stacks >= x.at ? "text-parch-100" : "text-parch-500"}>{stacks >= x.at ? "✓" : "○"} <b>{x.at}</b> — {x.text}</li>)}</ul>}
        <p className="text-xs text-parch-500">Os acúmulos são do punhal. Cada alma humana só concede 1 acúmulo; trocar de caminho zera o progresso.</p>
        {gm && <div className="flex flex-wrap items-end gap-2">
          <button className="btn btn-sm" disabled={busy || path === "ignea"} onClick={async () => { if (!path || window.confirm("Trocar para a Lâmina Ígnea? Os acúmulos são zerados.")) await run("dagger_action", { p_char_item: o.id, p_action: "caminho", p_text: "ignea" }, "Caminho: Lâmina Ígnea."); }}>Ígnea</button>
          <button className="btn btn-sm" disabled={busy || path === "boreal"} onClick={async () => { if (!path || window.confirm("Trocar para a Lâmina Boreal? Os acúmulos são zerados.")) await run("dagger_action", { p_char_item: o.id, p_action: "caminho", p_text: "boreal" }, "Caminho: Lâmina Boreal."); }}>Boreal</button>
          <input aria-label="Nome da alma" className="input !w-40 !py-1" placeholder="De quem é a alma" value={a} onChange={(e) => setA(e.target.value)} />
          <button className="btn btn-sm btn-primary" disabled={busy || !path || a.trim() === ""} onClick={async () => { const r = await run("dagger_action", { p_char_item: o.id, p_action: "alma", p_text: a }, "Alma registrada: +1 acúmulo."); if (r.ok) setA(""); }}>Registrar alma</button>
          <input aria-label="Ajustar acúmulos" className={num} inputMode="numeric" placeholder="Ajustar" value={b} onChange={(e) => setB(e.target.value)} />
          <button className="btn btn-sm" disabled={busy || b === ""} onClick={async () => { const r = await run("dagger_action", { p_char_item: o.id, p_action: "ajustar", p_value: Number(b) }, "Acúmulos ajustados."); if (r.ok) setB(""); }}>Definir</button></div>}
        <Msg m={msg} /></div>);
  }

  if (m === "estigma") {
    const liters = st.liters ?? 0;
    return (
      <div className={box}>
        <p>Pele atual: <b className="text-gold-300">{st.skin ?? "nenhuma (carne viva)"}</b>{liters > 0 && <> · Camadas extras: <b>{liters} L</b> <span className="text-xs text-red-300">(−{(liters / 5) * 5} de Mana por turno)</span></>}</p>
        <p className="text-xs text-parch-500">Permanente: a pele original jamais é recuperada. Encapuzar 30 de Mana · Transmutar 20 · Camada extra 20 a cada 5 L, com manutenção de 5 de Mana por turno a cada 5 L (sem Mana, as camadas caem).</p>
        {gm && <div className="flex flex-wrap items-end gap-2">
          <input aria-label="Material" className="input !w-36 !py-1" placeholder="Material tocado" value={a} onChange={(e) => setA(e.target.value)} />
          <button className="btn btn-sm btn-primary" disabled={busy || dead || a.trim() === ""} onClick={async () => { const r = await run("stigma_action", { p_char_item: o.id, p_action: "encapuzar", p_material: a }, "Material encapuzado (−30 de Mana)."); if (r.ok) setA(""); }}>Encapuzar</button>
          <button className="btn btn-sm" disabled={busy || dead || !st.skin} onClick={() => run("stigma_action", { p_char_item: o.id, p_action: "transmutar" }, "Pele transmutada (−20 de Mana).")}>Transmutar</button>
          <input aria-label="Litros da camada" className={num} inputMode="numeric" placeholder="Litros (×5)" value={b} onChange={(e) => setB(e.target.value)} />
          <button className="btn btn-sm" disabled={busy || dead || !st.skin || b === ""} onClick={async () => { const r = await run("stigma_action", { p_char_item: o.id, p_action: "camada", p_liters: Number(b) }, "Camada adicionada."); if (r.ok) setB(""); }}>Adicionar camada</button>
          <button className="btn btn-sm" disabled={busy || liters === 0} onClick={() => run("stigma_action", { p_char_item: o.id, p_action: "soltar" }, "Camadas extras soltas.")}>Soltar camadas</button></div>}
        <Msg m={msg} /></div>);
  }

  if (m === "coracao_rubro") {
    const bar = sheet.hp_current ?? sheet.mana_current ?? 0; const max = sheet.hp_current !== null ? sheet.max_hp ?? 0 : sheet.max_mana ?? 0;
    const lost = max > 0 ? Math.max(0, ((max - bar) / max) * 100) : 0; const tier = HEART_TIERS.find((t) => lost >= t[0]);
    const mult = tier ? tier[1] : 1; const phase = sheet.level === 0 || sheet.level >= 15 ? 3 : sheet.level >= 8 ? 2 : 1;
    const attr = st.attribute as string | undefined; const label: Record<string, string> = { dano: "Dano", velocidade: "Velocidade", cura: "Cura (regeneração)" };
    if (!st.consumed) return (
      <div className={box}><p className="text-xs text-parch-300">O Coração Rubro precisa ser consumido: substitui o coração do portador, de forma permanente.</p>
        {gm && <button className="btn btn-sm btn-danger" disabled={busy || dead} onClick={async () => { if (window.confirm("Consumir o Coração Rubro? É permanente.")) await run("heart_action", { p_char_item: o.id, p_action: "consumir" }, "Coração Rubro consumido."); }}>Consumir</button>}<Msg m={msg} /></div>);
    return (
      <div className={box}>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded border border-wine-400/60 p-2"><p className="text-xs uppercase tracking-wider text-parch-500">Sangue ausente</p><p className="font-display text-xl text-red-300">{lost.toFixed(0)}%</p></div>
          <div className="rounded border border-gold-600/40 p-2"><p className="text-xs uppercase tracking-wider text-parch-500">Multiplicador</p><p className="font-display text-xl text-gold-300">×{String(mult).replace(".", ",")}</p></div>
          <div className="rounded border border-arcane-500/50 p-2"><p className="text-xs uppercase tracking-wider text-parch-500">Atributo</p><p className="font-display text-xl text-arcane-400">{attr ? label[attr] : "—"}</p></div>
        </div>
        {tier && <p className="text-xs text-red-300">Sintomas: {tier[2]}.</p>}
        {attr === "velocidade" && <p className="text-xs">Velocidade atual: <b>{(sheet.speed_mps * mult).toFixed(1).replace(".", ",")} m/s</b>.</p>}
        {attr === "cura" && <p className="text-xs">Regeneração de Vida multiplicada por ×{String(mult).replace(".", ",")} a cada turno (aplicada automaticamente).</p>}
        {attr === "dano" && <p className="text-xs">Multiplique o dano rolado na mesa por ×{String(mult).replace(".", ",")}.</p>}
        <p className="text-xs text-parch-500">Fase {phase === 1 ? "I — Sangue Pessoal: só o portador sangra; pode se ferir magicamente" : phase === 2 ? "II — Contágio Rubro: sangramento leve (grau 2, −2%/turno) em raio de 10 m; buff em área de até 2× (dividido entre os alvos)" : "III — Campo Hemodinâmico: sangramento médio ao toque (grau 6, −10%/turno) e leve em raio de 20 m"}. Aplique os sangramentos no painel de Sangramento de cada ficha. Qualquer cura só vale no turno seguinte; ferimentos de mesma potência somam ×0,5.</p>
        {gm && <div className="flex flex-wrap items-center gap-1"><span className="text-xs text-parch-500">Escolha do jogador:</span>
          {(["dano", "velocidade", "cura"] as const).map((k) => <button key={k} className={`btn btn-sm ${attr === k ? "btn-primary" : ""}`} disabled={busy || attr === k} onClick={() => run("heart_action", { p_char_item: o.id, p_action: "atributo", p_attribute: k }, `Atributo: ${label[k]}.`)}>{label[k]}</button>)}</div>}
        <Msg m={msg} /></div>);
  }

  if (m === "elmo_imortal") {
    const mit = st.mit ?? 20; const ret = st.returns ?? 0; const has = !!st.snapshot;
    return (
      <div className={box}>
        <p>Mitigação atual na cabeça: <b className="text-xl text-gold-300">{mit}</b> <span className="text-xs text-parch-500">(máx. 1d20; perde 1d4 a cada mitigação)</span></p>
        <p>{has ? <>Ponto de Retorno: <b>turno {st.snap_turn}</b> · Retornos usados: <b>{ret}/2</b></> : <span className="text-parch-300">Sem Ponto de Retorno registrado.</span>}{st.revanche && <> · Bênção da revanche: <b className="text-arcane-400">{st.revanche}</b></>}</p>
        <p className="text-xs text-parch-500">“Retornar” restaura TODAS as fichas da campanha ao Ponto de Retorno (recursos, itens, efeitos) e volta o tempo do calendário. As memórias são mantidas.</p>
        {gm && <div className="flex flex-wrap items-end gap-2">
          <button className="btn btn-sm btn-primary" disabled={busy || dead} onClick={async () => { if (!has || window.confirm("Substituir o Ponto de Retorno atual?")) await run("helm_action", { p_char_item: o.id, p_action: "ponto" }, "Ponto de Retorno registrado."); }}>Registrar Ponto de Retorno</button>
          <input aria-label="1d4 perdido" className={num} inputMode="numeric" placeholder="1d4" value={a} onChange={(e) => setA(e.target.value)} />
          <button className="btn btn-sm" disabled={busy || a === ""} onClick={async () => { const r = await run("helm_action", { p_char_item: o.id, p_action: "mitigar", p_value: Number(a) }, "Mitigação reduzida."); if (r.ok) setA(""); }}>Mitigou</button>
          <button className="btn btn-sm btn-danger" disabled={busy || !has || ret >= 2} onClick={async () => { if (window.confirm(`RETORNAR ao turno ${st.snap_turn}? Todas as fichas voltam ao estado do Ponto de Retorno e o tempo retrocede.`)) await run("helm_action", { p_char_item: o.id, p_action: "retornar" }, "Retorno realizado: tudo voltou ao Ponto de Retorno."); }}>Retornar</button>
          <select aria-label="Bênção da revanche" className="input !w-44 !py-1" value={b} onChange={(e) => setB(e.target.value)}><option value="">Bênção da revanche…</option>{blessings.map((x) => <option key={x} value={x}>{x}</option>)}</select>
          <button className="btn btn-sm" disabled={busy || !b} onClick={async () => { const r = await run("helm_action", { p_char_item: o.id, p_action: "revanche", p_text: b }, "Bênção da revanche definida."); if (r.ok) setB(""); }}>Definir</button>
          <button className="btn btn-sm" disabled={busy || !has} onClick={async () => { if (window.confirm("Encerrar o combate? O Ponto de Retorno é apagado.")) await run("helm_action", { p_char_item: o.id, p_action: "encerrar" }, "Combate encerrado."); }}>Fim do combate</button></div>}
        <Msg m={msg} /></div>);
  }

  if (m === "ovelha_lobo") {
    const tg = st.target as { id?: string; name: string; hp: number; dmg: number } | undefined; const hunt = st.hunt as { avg_hp: number; avg_dmg: number } | undefined;
    const marks = (st.marks ?? []) as { name: string; hp: number; dmg: number }[];
    const call = (action: string, args: Record<string, unknown> = {}, ok?: string) => run("wolf_action", { p_char_item: o.id, p_action: action, p_args: args }, ok);
    if (!st.activated) return (
      <div className={box}><p className="text-xs text-parch-300">Para ativar, o usuário perfura o próprio peito com a flecha: contrato irreversível com o Lobo Astral.</p>
        {gm && <button className="btn btn-sm btn-danger" disabled={busy || dead} onClick={async () => { if (window.confirm("Ativar a flecha? O contrato é irreversível.")) await call("ativar", {}, "Contrato selado com o Lobo Astral."); }}>Ativar a flecha</button>}<Msg m={msg} /></div>);
    return (
      <div className={box}>
        <p>Caçadas realizadas: <b>{st.hunts ?? 0}</b>{st.bonus_dmg ? <> · Bônus permanente de dano: <b className="text-gold-300">+{st.bonus_dmg}</b></> : null}</p>
        {hunt ? <p className="rounded border border-wine-400/60 p-2">🐺 <b>Caçada contra {tg?.name}</b> — Vida máxima de ambos: <b>{hunt.avg_hp}</b> · dano máximo por golpe de ambos: <b>{hunt.avg_dmg}</b>. Só o alvo vê o usuário; o alvo é inatingível por outros.</p>
          : tg ? <p>Alvo marcado: <b className="text-gold-300">{tg.name}</b> (Vida máx. {tg.hp}, dano máx. por golpe {tg.dmg}). A Caçada começa a 10 m da marca.</p> : <p className="text-parch-300">Nenhum alvo marcado.</p>}
        {marks.length > 0 && <ul className="space-y-1">{marks.map((mk, i) => <li key={i} className="flex flex-wrap items-center gap-2 rounded border border-ink-600 p-1 text-xs"><span>Marca: <b>{mk.name}</b> (Vida {mk.hp}, dano {mk.dmg})</span>
          {gm && <><button className="btn btn-sm" disabled={busy} onClick={() => call("consumir", { index: i, kind: "vida" }, `Marca consumida: +${Math.ceil(mk.hp * 0.1)} de Vida máxima.`)}>+{Math.ceil(mk.hp * 0.1)} Vida</button>
            <button className="btn btn-sm" disabled={busy} onClick={() => call("consumir", { index: i, kind: "dano" }, `Marca consumida: +${Math.ceil(mk.dmg * 0.1)} de dano.`)}>+{Math.ceil(mk.dmg * 0.1)} dano</button></>}</li>)}</ul>}
        {gm && !hunt && <div className="flex flex-wrap items-end gap-2">
          <select aria-label="Alvo" className="input !w-44 !py-1" value={a} onChange={(e) => setA(e.target.value)}><option value="">Alvo sem ficha…</option>{targets.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          {!a && <><input aria-label="Nome do alvo" className="input !w-32 !py-1" placeholder="Nome" value={b} onChange={(e) => setB(e.target.value)} /><input aria-label="Vida máxima do alvo" className={num} inputMode="numeric" placeholder="Vida máx." value={c} onChange={(e) => setC(e.target.value)} /></>}
          <input aria-label="Dano máximo por golpe do alvo" className={num} inputMode="numeric" placeholder="Dano máx." value={d} onChange={(e) => setD(e.target.value)} />
          <button className="btn btn-sm btn-primary" disabled={busy || dead || d === "" || (!a && (b.trim() === "" || c === ""))} onClick={async () => { const r = await call("marcar", a ? { target: a, dmg: Number(d) } : { name: b, hp: Number(c), dmg: Number(d) }, "Alvo marcado."); if (r.ok) { setA(""); setB(""); setC(""); setD(""); } }}>Marcar alvo</button>
          {tg && <><input aria-label="Dano máximo por golpe do portador" className={num} inputMode="numeric" placeholder="Meu dano máx." value={c} onChange={(e) => setC(e.target.value)} />
            <button className="btn btn-sm btn-danger" disabled={busy || dead || c === ""} onClick={async () => { const r = await call("iniciar", { user_dmg: Number(c) }, "Caçada iniciada."); if (r.ok) setC(""); }}>Iniciar Caçada</button></>}</div>}
        {gm && hunt && <div className="flex flex-wrap items-end gap-2">
          <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => call("matar", {}, "Alvo abatido: Marca coletada.")}>Matou o alvo</button>
          <input aria-label="1d10 de sanidade" className={num} inputMode="numeric" placeholder="1d10" value={a} onChange={(e) => setA(e.target.value)} />
          <button className="btn btn-sm" disabled={busy || a === ""} onClick={async () => { const r = await call("cancelar", { sanity: Number(a) }, "Duelo cancelado: a marca foi perdida."); if (r.ok) setA(""); }}>Cancelar duelo (paga sanidade)</button></div>}
        <Msg m={msg} /></div>);
  }

  if (m === "bau_mirral") {
    return (
      <div className={box}>
        <p>{st.destroyed ? <b className="text-red-300">Baú destruído — a alma foi aniquilada.</b> : st.sealed ? <b className="text-arcane-400">● Alma selada — imortal. Sem fome, sono, dor ou colapso vital.</b> : st.barred ? <span className="text-parch-300">O baú foi aberto: esta pessoa jamais será aceita novamente.</span> : <span className="text-parch-300">O baú repousa aberto, esperando consentimento.</span>}</p>
        {st.sealed && <p className="text-xs text-parch-500">Enquanto selada, a ficha não pode ser marcada como morta. “Novo corpo” devolve os atributos do momento do selamento.</p>}
        {gm && <div className="flex flex-wrap gap-1">
          {!st.sealed && !st.barred && <button className="btn btn-sm btn-danger" disabled={busy || dead} onClick={async () => { if (window.confirm("Selar a alma no Baú de Mirral? O personagem se torna imortal.")) await run("chest_action", { p_char_item: o.id, p_action: "selar" }, "Alma selada."); }}>Selar alma</button>}
          {st.sealed && <><button className="btn btn-sm btn-primary" disabled={busy} onClick={async () => { if (window.confirm("Ligar o baú a um novo corpo? A ficha volta aos atributos do selamento.")) await run("chest_action", { p_char_item: o.id, p_action: "novo_corpo" }, "Novo corpo: atributos restaurados."); }}>Novo corpo</button>
            <button className="btn btn-sm" disabled={busy} onClick={async () => { if (window.confirm("Abrir o baú? Um novo corpo é criado e a pessoa jamais será aceita de novo.")) await run("chest_action", { p_char_item: o.id, p_action: "abrir" }, "Baú aberto."); }}>Baú aberto</button>
            <button className="btn btn-sm btn-danger" disabled={busy} onClick={async () => { if (window.confirm("DESTRUIR o baú? A alma é aniquilada e a ficha é marcada como morta.")) await run("chest_action", { p_char_item: o.id, p_action: "destruir" }, "Baú destruído."); }}>Baú destruído</button></>}</div>}
        <Msg m={msg} /></div>);
  }
  // ----- itens de registro -----
  const tk = (action: string, text?: string, ok?: string) => run("trinket_action", { p_char_item: o.id, p_action: action, p_text: text ?? null }, ok);
  if (m === "orbe") {
    const sealed = (st.sealed ?? []) as string[];
    return (
      <div className={box}>
        <p>Seres selados no orbe: <b className="text-gold-300">{sealed.length}</b></p>
        {sealed.length > 0 && <ul className="space-y-1">{sealed.map((x, i) => <li key={i} className="flex items-center justify-between gap-2 rounded border border-ink-600 px-2 py-1 text-xs"><span>🔮 {x} <span className="text-parch-500">— em transe</span></span>
          {gm && <button className="btn btn-sm" disabled={busy} onClick={() => tk("libertar", String(i), `${x} foi libertado: surge em um ponto aleatório a até 5 m.`)}>Libertar</button>}</li>)}</ul>}
        <p className="text-xs text-parch-500">Só seres domesticados podem ser selados. Ao libertar, o ser surge a partir do orbe em um ponto aleatório a até 5 m.</p>
        {gm && <div className="flex flex-wrap items-end gap-2">
          <select aria-label="Ficha a selar" className="input !w-44 !py-1" value={a} onChange={(e) => setA(e.target.value)}><option value="">Ser sem ficha…</option>{targets.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
          {!a && <input aria-label="Nome do ser" className="input !w-40 !py-1" placeholder="Nome do ser" value={b} onChange={(e) => setB(e.target.value)} />}
          <button className="btn btn-sm btn-primary" disabled={busy || (!a && b.trim() === "")} onClick={async () => { const r = await tk("selar", a || b, "Ser selado no orbe."); if (r.ok) { setA(""); setB(""); } }}>Selar</button></div>}
        <Msg m={msg} /></div>);
  }
  if (m === "mascara") {
    return (
      <div className={box}>
        <p>{st.worn ? <b className="text-arcane-400">● Vestindo a máscara</b> : <span className="text-parch-300">Máscara guardada</span>} · Aparência {st.worn ? "atual" : "ao vestir"}: <b className="text-gold-300">{st.face ?? "nenhum ser abatido ainda"}</b></p>
        <p className="text-xs text-parch-500">Enquanto veste a máscara, o portador tem a aparência do último ser que matou.</p>
        {gm && <div className="flex flex-wrap items-end gap-2">
          <button className="btn btn-sm" disabled={busy} onClick={() => tk("vestir", undefined, st.worn ? "Máscara retirada." : "Máscara vestida.")}>{st.worn ? "Tirar a máscara" : "Vestir a máscara"}</button>
          <input aria-label="Último ser abatido" className="input !w-44 !py-1" placeholder="Último ser abatido" value={a} onChange={(e) => setA(e.target.value)} />
          <button className="btn btn-sm btn-primary" disabled={busy || a.trim() === ""} onClick={async () => { const r = await tk("abate", a, "Abate registrado: a aparência da máscara mudou."); if (r.ok) setA(""); }}>Registrar abate</button></div>}
        <Msg m={msg} /></div>);
  }
  if (m === "moeda") {
    const away = st.away_until != null && turn < st.away_until;
    return (
      <div className={box}>
        <p>{away ? <><b className="text-amber-300">○ Fora do bolso</b> — volta ao amanhecer (turno {st.away_until}; faltam {st.away_until - turn} turnos)</> : <b className="text-gold-300">● No bolso do dono</b>}</p>
        <p className="text-xs text-parch-500">Moeda de ouro mágica: se for gasta ou perdida, reaparece no bolso do dono no amanhecer (06:00).</p>
        {gm && <div className="flex flex-wrap gap-1">
          <button className="btn btn-sm" disabled={busy || away} onClick={() => tk("gastar", undefined, "Moeda gasta: volta ao amanhecer.")}>Gastou / perdeu a moeda</button>
          {away && <button className="btn btn-sm" disabled={busy} onClick={() => tk("recuperar", undefined, "Moeda de volta ao bolso.")}>Voltou antes</button>}</div>}
        <Msg m={msg} /></div>);
  }
  if (m === "sapato") {
    return (
      <div className={box}>
        <p>{st.on ? <b className="text-arcane-400">● Subindo degraus de vidro</b> : <span className="text-parch-300">Fora de uso</span>}</p>
        <p className="text-xs text-parch-500">Cria degraus de vidro no ar, logo abaixo do pé, quando o usuário finge subir uma escada.</p>
        {gm && <button className="btn btn-sm" disabled={busy} onClick={() => tk("usar", undefined, st.on ? "Parou de usar." : "Em uso.")}>{st.on ? "Parar" : "Usar"}</button>}
        <Msg m={msg} /></div>);
  }
  return null;
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
