import type { Dice } from "./dice.ts";

/** Linha de uma tabela oficial. max_hp/max_mana null = a raça NÃO possui o recurso. */
export type ProgressionRow = {
  level: number;
  max_hp: number | null;
  max_mana: number | null;
  aa_dice_count: number;
  aa_dice_sides: number;
};
export type ProgressionTable = { slug: string; rows: ProgressionRow[] };

export const MAX_MORTAL_LEVEL = 21;

/** Consulta exata. Sem linha => erro (nunca inventa valor). */
export function getRow(table: ProgressionTable, level: number): ProgressionRow {
  const row = table.rows.find((r) => r.level === level);
  if (!row) throw new Error(`Tabela "${table.slug}" não possui o nível ${level}`);
  return row;
}
export const aaDice = (row: ProgressionRow): Dice => ({ count: row.aa_dice_count, sides: row.aa_dice_sides });

/** XP necessário para subir de nível = 50 × nível atual (Sistema p.10). */
export const xpRequired = (level: number): number => 50 * level;
/** XP dropado = 20 × nível + 25 × 2^(Periculosidade − 1) (Sistema p.10). */
export function xpDrop(level: number, periculosidade: number): number {
  if (!Number.isInteger(periculosidade) || periculosidade < 1 || periculosidade > 5) {
    throw new Error("Periculosidade deve ser de 1 a 5");
  }
  return 20 * level + 25 * 2 ** (periculosidade - 1);
}

export type Resources = { hp: number | null; mana: number | null; sanity: number };
export const MAX_SANITY = 30; // Sistema p.10

/** Estado inicial na criação = tudo no máximo (decisão P4). */
export function initialResources(row: ProgressionRow): Resources {
  return { hp: row.max_hp, mana: row.max_mana, sanity: MAX_SANITY };
}

export type LevelChangePreview = {
  fromLevel: number;
  toLevel: number;
  max: { hp: [number | null, number | null]; mana: [number | null, number | null] };
  aaDice: [Dice, Dice];
  /** Valores atuais após a mudança. Nunca restaura; só limita ao novo máximo. */
  current: Resources;
  clamped: { hp: boolean; mana: boolean };
};

export function previewLevelChange(
  table: ProgressionTable,
  fromLevel: number,
  toLevel: number,
  current: Resources,
): LevelChangePreview {
  if (!Number.isInteger(toLevel) || toLevel < 1 || toLevel > MAX_MORTAL_LEVEL) {
    throw new Error(`Nível inválido: ${toLevel}`);
  }
  const a = getRow(table, fromLevel);
  const b = getRow(table, toLevel);
  const hp = current.hp === null || b.max_hp === null ? null : Math.min(current.hp, b.max_hp);
  const mana = current.mana === null || b.max_mana === null ? null : Math.min(current.mana, b.max_mana);
  return {
    fromLevel,
    toLevel,
    max: { hp: [a.max_hp, b.max_hp], mana: [a.max_mana, b.max_mana] },
    aaDice: [aaDice(a), aaDice(b)],
    current: { hp, mana, sanity: current.sanity },
    clamped: { hp: hp !== current.hp, mana: mana !== current.mana },
  };
}
