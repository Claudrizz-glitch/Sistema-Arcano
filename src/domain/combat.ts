import type { Dice, Rng } from "./dice.ts";
import { rollDice, scaleDiceCount } from "./dice.ts";

export type Weapon = { weaponDice: Dice; aaMultiplier: number; penetration: number };
export type DamageRoll = { weapon: number; aa: number; penetration: number; total: number };

/**
 * dano = dado da arma + N × AA + penetração, onde N × AA = rola o AA N vezes e soma
 * (confirmado pelo Mestre). Equivale a (N·count)dSides.
 */
export function rollWeaponDamage(w: Weapon, aa: Dice, rng: Rng): DamageRoll {
  const weapon = rollDice(w.weaponDice, rng);
  const aaTotal = w.aaMultiplier > 0 ? rollDice(scaleDiceCount(aa, w.aaMultiplier), rng) : 0;
  return { weapon, aa: aaTotal, penetration: w.penetration, total: weapon + aaTotal + w.penetration };
}
