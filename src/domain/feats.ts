/**
 * Teste de Feitos Mágicos (decisão do Mestre, 2026-11-14): rola-se 1d20 antes de conjurar.
 * Na CD do feitiço ou acima: custo normal. Abaixo da CD: o custo de Mana sobe proporcionalmente,
 * até 2× com resultado 1. Tudo é calculado pelo resultado EFETIVO (dado + bônus): o Profano soma +5, então o pior
 * resultado dele é 6 e ele nunca paga 2×. Custo final arredondado para CIMA.
 */
export type FeatCost = { baseCost: number; roll: number; bonus: number; effectiveRoll: number; cd: number | null; multiplier: number; cost: number };
export function featCost(baseCost: number, roll: number, bonus = 0, cd: number | null = null): FeatCost {
  if (!Number.isInteger(roll) || roll < 1 || roll > 20) throw new Error("O resultado do d20 deve ser de 1 a 20");
  if (!Number.isInteger(baseCost) || baseCost < 0) throw new Error("Custo-base inválido");
  const effectiveRoll = roll + bonus;
  let cost: number;
  if (effectiveRoll <= 1) cost = baseCost * 2;
  else if (cd === null || cd <= 1 || effectiveRoll >= cd) cost = baseCost;
  else cost = Math.min(baseCost * 2, Math.ceil((baseCost * (2 * cd - 1 - effectiveRoll)) / (cd - 1)));
  const multiplier = baseCost === 0 ? 1 : Math.round((cost / baseCost) * 100) / 100;
  return { baseCost, roll, bonus, effectiveRoll, cd, multiplier, cost };
}
