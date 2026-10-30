import type { Dice } from "./dice.ts";
import { scaleDiceCount } from "./dice.ts";

/**
 * Modificadores nunca sobrescrevem o valor-base: são aplicados sobre ele.
 * Filho do Sol (decisão P3): ×2 na Vida máxima e ×2 na QUANTIDADE de dados de dano (AA); bloqueia uso de Mana.
 */
export type Modifier = {
  source: string;
  hpMultiplier?: number;
  aaDiceCountMultiplier?: number;
  blocksMana?: boolean;
};

export function effectiveMaxHp(base: number | null, mods: Modifier[]): number | null {
  if (base === null) return null;
  return mods.reduce((acc, m) => acc * (m.hpMultiplier ?? 1), base);
}
export function effectiveAaDice(base: Dice, mods: Modifier[]): Dice {
  const f = mods.reduce((acc, m) => acc * (m.aaDiceCountMultiplier ?? 1), 1);
  return f === 1 ? base : scaleDiceCount(base, f);
}
export const manaBlocked = (mods: Modifier[]): boolean => mods.some((m) => m.blocksMana);
