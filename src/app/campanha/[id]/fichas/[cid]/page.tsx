import { notFound } from "next/navigation";
import Link from "next/link";
import { campaignContext } from "@/lib/data";
import { Bar, Card, StatusBadge } from "@/components/ui";
import { RealtimeRefresh } from "@/components/client";
import { BlessingsSection, ContractsSection, GmEditForm, ItemsSection, LevelPanel, LogSection, ModifiersSection, PlayerEditForm, ResourcePanel, SpellsSection, StatusPanel, type OwnedBlessing, type OwnedItem, type OwnedSpell, type RaceCtx } from "@/components/GmPanels";
import { BleedingPanel, ForgedPanel } from "@/components/BodyPanels";
import type { Absorption, Bleeding, BleedGradeRow, Blessing, CharBlessing, CharContract, CharItem, CharModifier, CharSpell, Item, LogRow, Race, Sheet, Spell, Variant } from "@/lib/types";

const TABLES = ["characters", "character_spells", "character_blessings", "character_items", "character_contracts", "character_modifiers", "character_bleedings", "mana_absorptions", "action_log"];
export default async function FichaPage({ params }: { params: Promise<{ id: string; cid: string }> }) {
  const { id, cid } = await params;
  const { sb, campaign, role, user } = await campaignContext(id);
  const gm = role === "mestre";
  // RLS: jogador só enxerga a própria ficha; NPC/ficha alheia => vazio => 404
  const { data: row } = await sb.from("v_characters").select("*").eq("id", cid).eq("campaign_id", id).maybeSingle();
  if (!row) notFound();
  const sheet = row as Sheet;
  const mine = sheet.owner_id === user.id;

  const effRaceSlug = sheet.progression_slug === "druida_puro" ? "druida_puro" : sheet.race_slug;
  const [{ data: cs }, { data: cb }, { data: ci }, { data: cc }, { data: cm }, { data: lg }, { data: rc }, { data: vr }, { data: bl0 }, { data: ab0 }, { data: gr }] = await Promise.all([
    sb.from("character_spells").select("*").eq("character_id", cid), sb.from("character_blessings").select("*").eq("character_id", cid),
    sb.from("character_items").select("*").eq("character_id", cid), sb.from("character_contracts").select("*").eq("character_id", cid).order("granted_at"),
    sb.from("character_modifiers").select("*").eq("character_id", cid).eq("active", true),
    sb.from("action_log").select("*").eq("character_id", cid).order("created_at", { ascending: false }).limit(40),
    sb.from("races").select("*").eq("slug", effRaceSlug).maybeSingle(),
    sheet.variant_slug ? sb.from("race_variants").select("*").eq("race_slug", sheet.race_slug).eq("slug", sheet.variant_slug).maybeSingle() : Promise.resolve({ data: null }),
    sb.from("character_bleedings").select("*").eq("character_id", cid).order("started_turn", { ascending: false }).limit(30),
    sb.from("mana_absorptions").select("*").eq("character_id", cid).order("created_at", { ascending: false }).limit(10),
    sb.from("bleeding_grades").select("*").order("grade"),
  ]);
  const race = (rc ?? null) as Race | null; const variant = (vr ?? null) as Variant | null;
  const ctx: RaceCtx = { name: race?.name ?? sheet.race_slug, canCast: race?.can_cast ?? true, featBonus: race?.feat_bonus ?? 0, immuneSupernatural: race?.immune_supernatural ?? false, physicalIgnored: race?.physical_attacks_ignored ?? false, manaIsLife: race?.mana_is_life ?? false };
  const shared = ctx.manaIsLife && sheet.hp_current === null;
  const bleedings = (bl0 ?? []) as Bleeding[]; const lethal = bleedings.some((b) => b.active && b.grade === 8);
  const priv = bleedings.some((b) => b.active && b.kind === "privacao");

  const spellIds = ((cs ?? []) as CharSpell[]).map((x) => x.spell_id);
  const blessIds = ((cb ?? []) as CharBlessing[]).map((x) => x.blessing_id);
  const itemIds = ((ci ?? []) as CharItem[]).map((x) => x.item_id);
  const [{ data: sp }, { data: bl }, { data: it }] = await Promise.all([
    spellIds.length ? sb.from("spells").select("*").in("id", spellIds) : Promise.resolve({ data: [] }),
    blessIds.length ? sb.from("blessings").select("*").in("id", blessIds) : Promise.resolve({ data: [] }),
    itemIds.length ? sb.from("items").select("*").in("id", itemIds) : Promise.resolve({ data: [] }),
  ]);
  const ownedSpells = ((sp ?? []) as Spell[]).map((s) => ({ ...s, granted_at: "" })) as OwnedSpell[];
  const ownedBless = ((bl ?? []) as Blessing[]).map((b) => ({ ...b, exception_override: ((cb ?? []) as CharBlessing[]).find((x) => x.blessing_id === b.id)?.exception_override ?? false })) as OwnedBlessing[];
  const ownedItems = ((ci ?? []) as CharItem[]).map((c) => ({ ...c, item: ((it ?? []) as Item[]).find((i) => i.id === c.item_id)! })).filter((x) => x.item) as OwnedItem[];

  let spellCat: Spell[] = [], blessCat: Blessing[] = [], itemCat: Item[] = [], others: { id: string; name: string; mana: number | null }[] = [];
  if (gm) {
    const [a, b, c, o] = await Promise.all([
      sb.from("spells").select("*").eq("status", "published").order("name"), sb.from("blessings").select("*").eq("status", "published").order("grp").order("name"),
      sb.from("items").select("*").eq("status", "published").order("name"), sb.from("v_characters").select("id,name,mana_current,status").eq("campaign_id", id).neq("id", cid).neq("status", "morta"),
    ]);
    spellCat = (a.data ?? []) as Spell[]; blessCat = (b.data ?? []) as Blessing[]; itemCat = (c.data ?? []) as Item[];
    others = ((o.data ?? []) as { id: string; name: string; mana_current: number | null }[]).filter((x) => x.mana_current !== null).map((x) => ({ id: x.id, name: x.name, mana: x.mana_current }));
  }
  const rights = Math.min(campaign.blessing_levels.filter((l) => l <= sheet.level).length, campaign.max_common_blessings);
  const xpNeeded = sheet.level === 0 ? null : 50 * sheet.level;
  const canEditText = !gm && mine && sheet.status !== "morta";
  const { data: owner } = sheet.owner_id ? await sb.from("profiles").select("display_name").eq("id", sheet.owner_id).maybeSingle() : { data: null };
  const hasBar = sheet.hp_current !== null || shared;
  const barMax = shared ? sheet.max_mana : sheet.max_hp;

  return (
    <div className="space-y-4">
      <p className="flex items-center justify-between text-sm"><Link href={`/campanha/${id}/fichas`}>← Fichas</Link><RealtimeRefresh tables={TABLES} filter={`id=eq.${cid}`} /></p>
      {lethal && <p role="alert" className="rounded-md border border-wine-400 bg-wine-700/40 p-3 font-semibold text-red-200">☠ MORTE IMINENTE: há um sangramento de grau 8 ativo nesta ficha. A decisão sobre o desfecho é do Mestre.</p>}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl">{sheet.name}</h1>
            {sheet.title_line && <p className="text-parch-300">{sheet.title_line}</p>}
            <p className="mt-1 text-sm text-parch-500">{ctx.name}{sheet.progression_slug === "druida_puro" && sheet.race_slug !== "druida_puro" ? ` (origem: ${sheet.race_slug})` : ""}{variant ? ` · ${variant.name}` : sheet.variant_slug ? ` · ${sheet.variant_slug}` : ""} · {sheet.kind === "mestre" ? "NPC privado do Mestre" : `Jogador: ${owner?.display_name ?? "—"}`}</p>
          </div>
          <div className="text-right"><StatusBadge status={sheet.status} />
            {sheet.status === "pendente" && !gm && <p className="mt-1 max-w-[16rem] text-xs text-amber-300">O Mestre precisa revisar e ativar esta ficha antes do uso.</p>}
            {sheet.status === "morta" && <p className="mt-1 text-xs text-red-300">✝ Personagem morto — ficha preservada.</p>}</div>
        </div>
        <div className="divider" />
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-3 md:col-span-2">
            {shared ? <Bar label="Barra única — Mana e Vida" current={sheet.mana_current} max={sheet.max_mana} tone="mana" /> : (<><Bar label="Vida" current={sheet.hp_current} max={sheet.max_hp} tone="hp" /><Bar label="Mana" current={sheet.mana_current} max={sheet.max_mana} tone="mana" /></>)}
            {shared && <p className="text-xs text-arcane-400">A Mana do Forjado é também a sua Vida (barra compartilhada).</p>}
            {priv && <p className="text-xs text-red-300">🩸 Sangrando mana por privação: −5% do máximo por turno até a barra voltar a 100%.</p>}
            {sheet.mana_blocked && <p className="text-xs text-amber-300">⚠ Mana bloqueada por um efeito ativo.</p>}
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm md:col-span-2">
            <dt className="text-parch-500">Nível</dt><dd className="font-semibold">{sheet.level === 0 ? "0 (especial)" : sheet.level}</dd>
            <dt className="text-parch-500">XP</dt><dd className="tabular-nums">{xpNeeded === null ? sheet.xp : `${sheet.xp} / ${xpNeeded}`}</dd>
            <dt className="text-parch-500">Sanidade</dt><dd className="tabular-nums">{sheet.sanity_current} / 30</dd>
            <dt className="text-parch-500">Dado de AA</dt><dd>{sheet.aa_dice_count}d{sheet.aa_dice_sides}</dd>
            <dt className="text-parch-500">Velocidade</dt><dd>{sheet.speed_mps} m/s <span className="text-xs text-parch-500">({sheet.speed_mps * campaign.turn_seconds} m/turno)</span></dd>
            <dt className="text-parch-500">Força de Massa</dt><dd>{sheet.mass_force ?? "—"}</dd>
            <dt className="text-parch-500">Alcance padrão</dt><dd>{sheet.reach_m} m</dd>
            <dt className="text-parch-500">Regeneração</dt><dd>{campaign.regen_hp} PV e {campaign.regen_mana} Mana / {campaign.regen_interval_turns === 1 ? "turno" : `${campaign.regen_interval_turns} turnos`}</dd>
            {sheet.special_combat_notes && (<><dt className="text-parch-500">Condições</dt><dd>{sheet.special_combat_notes}</dd></>)}
          </dl>
        </div>
        {race && (
          <details className="mt-4 rounded-md border border-ink-600 p-3 text-sm"><summary className="cursor-pointer text-gold-300">Raça: {race.name}{variant ? ` — ${variant.name}` : ""}</summary>
            <p className="mt-2 text-parch-300">{race.description}</p>
            {race.notes && <p className="mt-2 whitespace-pre-line text-xs text-parch-500">{race.notes}</p>}
            {variant?.description && <p className="mt-2 border-t border-ink-700 pt-2 text-parch-300"><b>{variant.name}:</b> {variant.description}</p>}</details>)}
      </Card>

      {gm && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Estado da ficha"><StatusPanel sheet={sheet} /></Card>
          <Card title="Vida, mana e sanidade"><ResourcePanel sheet={sheet} race={ctx} /></Card>
          <Card title="Nível e experiência"><LevelPanel sheet={sheet} xpNeeded={xpNeeded} canConvert={sheet.progression_slug !== "druida_puro" && sheet.status !== "morta"} /></Card>
          <Card title="Modificadores e efeitos"><ModifiersSection sheet={sheet} mods={(cm ?? []) as CharModifier[]} /></Card>
          {hasBar && <Card title="Sangramento"><BleedingPanel sheet={sheet} grades={(gr ?? []) as BleedGradeRow[]} bleedings={bleedings} bar={barMax} /></Card>}
          {ctx.manaIsLife && <Card title="Forjado — absorção de mana e núcleo"><ForgedPanel sheet={sheet} absorptions={(ab0 ?? []) as Absorption[]} others={others} turnSeconds={campaign.turn_seconds} /></Card>}
        </div>
      )}
      {!gm && hasBar && bleedings.some((b) => b.active) && <Card title="Sangramentos ativos"><ul className="text-sm">{bleedings.filter((b) => b.active).map((b) => <li key={b.id}>{b.kind === "privacao" ? "Privação de mana (5%/turno)" : `Grau ${b.grade}${b.rate_percent ? ` — ${b.rate_percent}%/turno` : " — morte iminente"}`}</li>)}</ul></Card>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Feitiços"><SpellsSection sheet={sheet} owned={ownedSpells} catalog={spellCat} gm={gm} race={ctx} /></Card>
        <Card title="Bênçãos"><BlessingsSection sheet={sheet} owned={ownedBless} catalog={blessCat} gm={gm} rights={rights} /></Card>
        <Card title="Equipamentos e itens"><ItemsSection sheet={sheet} owned={ownedItems} catalog={itemCat} gm={gm} /></Card>
        <Card title="Contratos"><ContractsSection sheet={sheet} owned={(cc ?? []) as CharContract[]} gm={gm} /></Card>
      </div>
      <Card title="Descrição, inventário e anotações">
        {gm ? <GmEditForm sheet={sheet} /> : canEditText ? <PlayerEditForm sheet={sheet} /> : (<div className="space-y-2 text-sm"><p className="whitespace-pre-line">{sheet.description || "—"}</p><p className="whitespace-pre-line text-parch-300">{sheet.inventory_text}</p></div>)}
        {!gm && sheet.narrative_notes && <p className="mt-3 whitespace-pre-line text-sm text-parch-300">{sheet.narrative_notes}</p>}
      </Card>
      <Card title="Histórico de alterações"><LogSection log={(lg ?? []) as LogRow[]} gm={gm} /></Card>
    </div>
  );
}
