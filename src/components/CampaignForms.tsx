"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Msg, useRpc } from "./client";
import type { Race, Variant } from "@/lib/types";

export function JoinCampaignForm() {
  const { run, busy, msg } = useRpc(); const router = useRouter(); const [code, setCode] = useState("");
  return (
    <form className="space-y-2" onSubmit={async (e) => { e.preventDefault(); const r = await run("join_campaign", { p_code: code.trim() }); if (r.ok) router.push(`/campanha/${r.data}`); }}>
      <label className="label" htmlFor="code">Código de convite</label>
      <div className="flex gap-2"><input id="code" className="input" value={code} onChange={(e) => setCode(e.target.value)} required /><button className="btn btn-primary" disabled={busy}>Entrar</button></div>
      <Msg m={msg} />
    </form>
  );
}
export function CreateCampaignForm() {
  const { run, busy, msg } = useRpc(); const router = useRouter();
  return (
    <form className="space-y-2" onSubmit={async (e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      const r = await run("create_campaign", { p_name: String(f.get("name")), p_description: String(f.get("description") ?? "") });
      if (r.ok) router.push(`/campanha/${r.data}`);
    }}>
      <div><label className="label" htmlFor="cn">Nome da campanha</label><input id="cn" name="name" className="input" required maxLength={120} /></div>
      <div><label className="label" htmlFor="cd">Descrição</label><textarea id="cd" name="description" className="input" rows={2} /></div>
      <button className="btn btn-primary" disabled={busy}>Criar campanha</button><Msg m={msg} />
    </form>
  );
}
function RaceFields({ races, variants, onRace, race }: { races: Race[]; variants: Variant[]; race: string; onRace: (s: string) => void }) {
  const vs = variants.filter((v) => v.race_slug === race);
  return (
    <>
      <div><label className="label" htmlFor="race">Raça</label>
        <select id="race" name="race" className="input" value={race} onChange={(e) => onRace(e.target.value)} required>{races.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}</select></div>
      {vs.length > 0 && (<div><label className="label" htmlFor="variant">Variante</label>
        <select id="variant" name="variant" className="input" defaultValue=""><option value="">— nenhuma —</option>{vs.map((v) => <option key={v.slug} value={v.slug}>{v.name}</option>)}</select></div>)}
    </>
  );
}
/** Jogador: raça, descrição e inventário inicial. Nível/Vida/Mana são definidos pelo Mestre. */
export function CreateSheetForm({ campaignId, races, variants, limit, used }: { campaignId: string; races: Race[]; variants: Variant[]; limit: number; used: number }) {
  const { run, busy, msg } = useRpc(); const [race, setRace] = useState(races[0]?.slug ?? "");
  const full = used >= limit;
  return (
    <form className="space-y-2" onSubmit={async (e) => {
      e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
      const r = await run("create_player_sheet", { p_campaign: campaignId, p_name: String(f.get("name")), p_race: race, p_variant: String(f.get("variant") ?? "") || null, p_description: String(f.get("description") ?? ""), p_inventory_text: String(f.get("inventory") ?? "") }, "Ficha criada. Ela aguarda a aprovação do Mestre.");
      if (r.ok) form.reset();
    }}>
      <p className="text-xs text-parch-500">Fichas criadas: {used} de {limit} (inclui pendentes, inativas e mortas).</p>
      <div><label className="label" htmlFor="nm">Nome do personagem</label><input id="nm" name="name" className="input" required maxLength={120} disabled={full} /></div>
      <RaceFields races={races} variants={variants} race={race} onRace={setRace} />
      <div><label className="label" htmlFor="ds">Descrição</label><textarea id="ds" name="description" className="input" rows={3} disabled={full} /></div>
      <div><label className="label" htmlFor="inv">Inventário inicial</label><textarea id="inv" name="inventory" className="input" rows={3} disabled={full} /></div>
      <button className="btn btn-primary" disabled={busy || full}>Criar ficha</button>{full && <p className="text-sm text-red-300">Limite atingido.</p>}<Msg m={msg} />
    </form>
  );
}
/** Mestre: ficha privada de NPC (nunca aparece para jogadores). */
export function CreateNpcForm({ campaignId, races, variants }: { campaignId: string; races: Race[]; variants: Variant[] }) {
  const { run, busy, msg } = useRpc(); const router = useRouter(); const [race, setRace] = useState(races[0]?.slug ?? "");
  return (
    <form className="space-y-2" onSubmit={async (e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      const r = await run("create_npc_sheet", { p_campaign: campaignId, p_name: String(f.get("name")), p_race: race, p_variant: String(f.get("variant") ?? "") || null, p_level: Number(f.get("level")), p_title: String(f.get("title") ?? ""), p_description: String(f.get("description") ?? "") });
      if (r.ok) router.push(`/campanha/${campaignId}/fichas/${r.data}`);
    }}>
      <div className="grid gap-2 sm:grid-cols-2">
        <div><label className="label" htmlFor="nn">Nome</label><input id="nn" name="name" className="input" required maxLength={120} /></div>
        <div><label className="label" htmlFor="nt">Epíteto / linha de apresentação</label><input id="nt" name="title" className="input" /></div>
        <RaceFields races={races} variants={variants} race={race} onRace={setRace} />
        <div><label className="label" htmlFor="nl">Nível (1–21)</label><input id="nl" name="level" type="number" min={1} max={21} defaultValue={1} className="input" required /></div>
      </div>
      <div><label className="label" htmlFor="nd">Descrição</label><textarea id="nd" name="description" className="input" rows={2} /></div>
      <button className="btn btn-primary" disabled={busy}>Gerar ficha privada</button><Msg m={msg} />
    </form>
  );
}
export function SettingsForm({ campaign }: { campaign: { id: string; name: string; regen_interval_turns: number; regen_hp: number; regen_mana: number; max_sheets_per_player: number; max_common_blessings: number; auto_level_up: boolean } }) {
  const { run, busy, msg } = useRpc();
  return (
    <form className="grid gap-2 sm:grid-cols-2" onSubmit={async (e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      await run("update_campaign_settings", { p_campaign: campaign.id, p_settings: {
        name: String(f.get("name")), regen_interval_turns: Number(f.get("ri")), regen_hp: Number(f.get("rh")), regen_mana: Number(f.get("rm")),
        max_sheets_per_player: Number(f.get("ms")), max_common_blessings: Number(f.get("mb")), auto_level_up: f.get("auto") === "on" } }, "Configurações salvas.");
    }}>
      <div className="sm:col-span-2"><label className="label" htmlFor="sn">Nome</label><input id="sn" name="name" className="input" defaultValue={campaign.name} required /></div>
      <div><label className="label" htmlFor="ri">Regeneração a cada (turnos)</label><input id="ri" name="ri" type="number" min={1} className="input" defaultValue={campaign.regen_interval_turns} /></div>
      <div><label className="label" htmlFor="rh">PV por regeneração</label><input id="rh" name="rh" type="number" min={0} className="input" defaultValue={campaign.regen_hp} /></div>
      <div><label className="label" htmlFor="rm">Mana por regeneração</label><input id="rm" name="rm" type="number" min={0} className="input" defaultValue={campaign.regen_mana} /></div>
      <div><label className="label" htmlFor="ms">Máx. de fichas por jogador</label><input id="ms" name="ms" type="number" min={1} className="input" defaultValue={campaign.max_sheets_per_player} /></div>
      <div><label className="label" htmlFor="mb">Máx. de bênçãos comuns</label><input id="mb" name="mb" type="number" min={0} className="input" defaultValue={campaign.max_common_blessings} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="auto" defaultChecked={campaign.auto_level_up} /> Evolução automática de nível ao atingir o XP</label>
      <div className="sm:col-span-2"><button className="btn btn-primary" disabled={busy}>Salvar</button> <Msg m={msg} /></div>
    </form>
  );
}
