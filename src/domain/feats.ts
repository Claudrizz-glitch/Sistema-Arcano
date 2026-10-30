/**
 * Feitos Mágicos: o resultado do d20 (informado pelo Mestre) multiplica o CUSTO de Mana.
 * Tabela oficial (prevalece sobre a frase "+0,1 por ponto", que daria 9 → 1,1x): 10+ → 1,0x · 9 → 1,2x · … · 1 → 2,0x.
 * Representado em décimos para evitar erro de ponto flutuante.
 */
export function feat_tenths(roll: number): number {
  if (!Number.isInteger(roll) || roll < 1) throw new Error("Resultado do dado inválido");
  return roll >= 10 ? 10 : 21 - roll;
}
export type FeatCost = { baseCost: number; roll: number; bonus: number; effectiveRoll: number; multiplier: number; cost: number };
/** `bonus` = vantagem racial (Profano +5). Custo final arredondado para CIMA. */
export function featCost(baseCost: number, roll: number, bonus = 0): FeatCost {
  if (!Number.isInteger(roll) || roll < 1 || roll > 20) throw new Error("O resultado do d20 deve ser de 1 a 20");
  if (!Number.isInteger(baseCost) || baseCost < 0) throw new Error("Custo-base inválido");
  const effectiveRoll = roll + bonus;
  const tenths = feat_tenths(effectiveRoll);
  return { baseCost, roll, bonus, effectiveRoll, multiplier: tenths / 10, cost: Math.ceil((baseCost * tenths) / 10) };
}
