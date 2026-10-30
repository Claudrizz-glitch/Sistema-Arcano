export type Dice = { count: number; sides: number };
export type Rng = () => number; // [0,1)

export function parseDice(expr: string): Dice {
  const m = /^(\d+)d(\d+)$/.exec(expr.trim());
  if (!m) throw new Error(`Dado inválido: "${expr}"`);
  const count = Number(m[1]);
  const sides = Number(m[2]);
  if (count < 1 || sides < 1) throw new Error(`Dado inválido: "${expr}"`);
  return { count, sides };
}
export const formatDice = (d: Dice): string => `${d.count}d${d.sides}`;

/** Multiplica a QUANTIDADE de dados (N rolagens do mesmo dado somadas = (N·count)dSides). */
export function scaleDiceCount(d: Dice, factor: number): Dice {
  if (!Number.isInteger(factor) || factor < 1) throw new Error("Fator deve ser inteiro >= 1");
  return { count: d.count * factor, sides: d.sides };
}
export function rollDice(d: Dice, rng: Rng): number {
  let total = 0;
  for (let i = 0; i < d.count; i++) total += Math.floor(rng() * d.sides) + 1;
  return total;
}
export const averageDice = (d: Dice): number => (d.count * (d.sides + 1)) / 2;
export const maxDice = (d: Dice): number => d.count * d.sides;
