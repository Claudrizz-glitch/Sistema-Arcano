/** Tabela oficial de sangramento (Sistema p.10). Grau 8 = morte iminente (sem %, nunca vira morte automática). */
export type BleedGrade = { grade: number; percent: number | null; lethal: boolean };
export const BLEED_GRADES: BleedGrade[] = [
  { grade: 1, percent: 1, lethal: false }, { grade: 2, percent: 2, lethal: false }, { grade: 3, percent: 3, lethal: false },
  { grade: 4, percent: 4, lethal: false }, { grade: 5, percent: 5, lethal: false }, { grade: 6, percent: 10, lethal: false },
  { grade: 7, percent: 15, lethal: false }, { grade: 8, percent: null, lethal: true },
];
/** Perda por turno: % do máximo ATUAL, arredondada para cima (nunca zero). */
export function bleedLoss(maxBar: number, percent: number): number {
  return Math.ceil((maxBar * percent) / 100);
}
export const PRIVATION_PERCENT = 5;
export const PRIVATION_GRACE_TURNS = 10; // 1 minuto = 10 turnos de 6 s; a perda começa no 11º
/** Forjado: sangra mana quando está há MAIS de 10 turnos sem a barra cheia. */
export function privationActive(turn: number, notFullSince: number | null): boolean {
  return notFullSince !== null && turn - notFullSince > PRIVATION_GRACE_TURNS;
}
/** Absorção de mana: taxa por segundo × segundos do turno. */
export const ABSORPTION_RATE = { passiva: 1, ativa: 5 } as const;
export function absorptionPerTurn(mode: keyof typeof ABSORPTION_RATE, turnSeconds = 6): number {
  return ABSORPTION_RATE[mode] * turnSeconds;
}
/** Transferência real: limitada pelo que falta ao destino e pelo que a origem possui. */
export function absorptionTransfer(perTurn: number, destMissing: number, sourceMana: number | null): number {
  const cap = Math.min(perTurn, Math.max(0, destMissing));
  return sourceMana === null ? cap : Math.min(cap, Math.max(0, sourceMana));
}
