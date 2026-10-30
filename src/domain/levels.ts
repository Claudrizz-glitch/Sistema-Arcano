import type { Dice } from "./dice.ts";
import { scaleDiceCount } from "./dice.ts";
import type { ProgressionRow } from "./progression.ts";

/** Nível 0 = condição especial depois do 21: dobra Vida, Mana (se houver), dado de ataque (quantidade de dados), Força de Massa e Velocidade. */
export const effectiveLevel = (level: number): number => (level === 0 ? 21 : level);
export const levelFactor = (level: number): number => (level === 0 ? 2 : 1);

export type EffectiveStats = { maxHp: number | null; maxMana: number | null; aaDice: Dice };
export function effectiveStats(row21OrLevel: ProgressionRow, level: number): EffectiveStats {
  const f = levelFactor(level);
  return {
    maxHp: row21OrLevel.max_hp === null ? null : row21OrLevel.max_hp * f,
    maxMana: row21OrLevel.max_mana === null ? null : row21OrLevel.max_mana * f,
    aaDice: scaleDiceCount({ count: row21OrLevel.aa_dice_count, sides: row21OrLevel.aa_dice_sides }, f),
  };
}
/** Atributos "a cada N níveis" com o nível inicial = 1:  valor = base + piso((nível − 1) / N).
 *  Velocidade: base 1 m/s, N = 4 → níveis 1–4 = 1, 5–8 = 2 … 21 = 6 (confere com a tabela do Mestre). */
export function steppedAttribute(base: number, perLevels: number, level: number): number {
  return base + Math.floor((effectiveLevel(level) - 1) / perLevels);
}
export const speedMps = (level: number, base = 1, per = 4): number => steppedAttribute(base, per, level) * levelFactor(level);
export const massForce = (level: number, base: number, per: number): number => steppedAttribute(base, per, level) * levelFactor(level);
