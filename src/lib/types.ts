export type Role = "mestre" | "jogador";
export type SheetStatus = "pendente" | "ativa" | "inativa" | "morta";
export type PubStatus = "draft" | "published" | "archived";

export type Profile = { id: string; display_name: string; is_master: boolean };
export type Campaign = {
  id: string; name: string; description: string; owner_id: string; invite_code: string;
  current_turn: number; turn_seconds: number; regen_interval_turns: number; regen_hp: number; regen_mana: number;
  max_sheets_per_player: number; max_common_blessings: number; blessing_levels: number[]; auto_level_up: boolean; calendar_config: Record<string, unknown>;
};
export type Member = { campaign_id: string; user_id: string; role: Role; joined_at: string };

/** Linha da visão v_characters (máximos derivados no servidor). */
export type Sheet = {
  id: string; campaign_id: string; kind: "jogador" | "mestre"; owner_id: string | null; name: string; title_line: string;
  description: string; inventory_text: string; narrative_notes: string; portrait_url: string | null;
  race_slug: string; variant_slug: string | null; progression_slug: string; level: number; xp: number;
  hp_current: number | null; mana_current: number | null; sanity_current: number; reach_m: number;
  special_combat_notes: string; status: SheetStatus; version: number;
  max_hp: number | null; max_mana: number | null; aa_dice_count: number; aa_dice_sides: number; mana_blocked: boolean;
  mass_force: number | null; speed_mps: number;
};
export type Spell = {
  id: string; campaign_id: string | null; name: string; category: string; description: string; effect: string;
  mana_cost: number | null; mana_cost_note: string; range_text: string; duration_text: string; damage_text: string;
  healing_text: string; cd: number | null; harmonic: boolean | null; druidic: boolean; passive: boolean; kind: "feitico" | "contrato"; cost_step: number | null; restrictions: string; notes: string; status: PubStatus;
};
export type Blessing = {
  id: string; campaign_id: string | null; name: string; grp: string; is_extra: boolean; description: string; effect: string;
  restrictions: string; uses_text: string; recovery_text: string; notes: string; status: PubStatus;
};
export type Item = {
  id: string; campaign_id: string | null; name: string; kind: string; description: string;
  damage_dice_count: number | null; damage_dice_sides: number | null; aa_multiplier: number | null; penetration: number | null;
  range_m: number | null; mitigation_dice_count: number | null; mitigation_dice_sides: number | null;
  effects: string; restrictions: string; notes: string; consumable: boolean | null; properties: Record<string, any>; status: PubStatus;
};
export type Topic = {
  id: string; campaign_id: string | null; parent_id: string | null; slug: string; title: string; body_md: string;
  sort_order: number; status: PubStatus;
};
export type Race = { slug: string; name: string; description: string; default_progression: string; has_hp: boolean; has_mana: boolean; can_cast: boolean; mana_is_life: boolean; immune_supernatural: boolean; physical_attacks_ignored: boolean; feat_bonus: number; notes: string };
export type Variant = { race_slug: string; slug: string; name: string; description: string };
export type ProgRow = { table_slug: string; level: number; max_hp: number | null; max_mana: number | null; aa_dice_count: number; aa_dice_sides: number };
export type ProgTable = { slug: string; name: string; notes: string; selectable: boolean; mass_force_base: number | null; mass_force_levels_per_point: number | null };
export type LogRow = { id: string; campaign_id: string; character_id: string | null; actor_id: string | null; action: string; turn: number | null; payload: Record<string, unknown>; result: Record<string, unknown>; reverted_at: string | null; created_at: string };
export type CharSpell = { character_id: string; spell_id: string; granted_at: string; note: string };
export type CharBlessing = { character_id: string; blessing_id: string; granted_at: string; exception_override: boolean };
export type CharItem = { id: string; character_id: string; item_id: string; quantity: number; equipped: boolean; note: string; state: Record<string, any> };
export type CharContract = { id: string; character_id: string; name: string; description: string; periculosidade: number | null; origin: string; state: string };
export type CharModifier = { id: string; character_id: string; source: string; hp_multiplier: number; aa_dice_count_multiplier: number; blocks_mana: boolean; active: boolean; kind: "manual" | "condicional" | "maldicao"; char_item_id: string | null; note: string };
export type Encounter = { id: string; campaign_id: string; name: string; status: "ativo" | "encerrado"; round: number; current_position: number };
export type Participant = { id: string; encounter_id: string; character_id: string; display_name: string; initiative: number | null; position: number; revealed: boolean };
export type Note = { id: string; campaign_id: string; title: string; content: string; tags: string[]; archived: boolean; updated_at: string };
export type BleedGradeRow = { grade: number; description: string; percent: number | null; lethal: boolean };
export type Bleeding = { id: string; character_id: string; kind: "ferimento" | "privacao"; grade: number | null; rate_percent: number | null; note: string; active: boolean; started_turn: number; ended_turn: number | null; ended_reason: string | null };
export type Absorption = { id: string; character_id: string; source_character_id: string | null; mode: "passiva" | "ativa"; rate_per_second: number; active: boolean; total_absorbed: number; ended_reason: string | null; started_turn: number };
export type Region = { id: string; campaign_id: string | null; name: string; kind: "bioma" | "regiao" | "local"; description: string; flora: string; fauna: string; notes: string; status: PubStatus };
export type Creature = { id: string; campaign_id: string | null; name: string; category: "fauna_flora" | "profano" | "outra"; periculosidade: number | null; region_id: string | null; description: string; traits: string; abilities: string; weaknesses: string; habitat: string; behavior: string; notes: string; is_secret: boolean; status: PubStatus };
