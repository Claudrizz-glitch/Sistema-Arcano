/**
 * Regras ADICIONADAS no PDF atualizado (Sistema p.11–12). Ambiguidade registrada:
 * não está escrito se o nível 1 já conta para o "a cada N níveis". Implementado como floor(nível / N)
 * e marcado NÃO CONFIRMADO — não exibir na ficha até o Mestre confirmar (ver P11).
 */
export type MassForceConfig = { base: number; levelsPerPoint: number };
export const MASS_FORCE: Record<string, MassForceConfig> = {
  humano: { base: 4, levelsPerPoint: 3 },
  anao: { base: 4, levelsPerPoint: 1 },
  druida: { base: 4, levelsPerPoint: 2 },
  profano: { base: 1, levelsPerPoint: 4 },
  // Decisão do Mestre: Forjado e Druída Puro seguem a proporção do Humano (base 4, +1 a cada 3 níveis)
  forjado: { base: 4, levelsPerPoint: 3 },
  druida_puro: { base: 4, levelsPerPoint: 3 },
};
export function massForce(race: string, level: number): number | null {
  const cfg = MASS_FORCE[race];
  return cfg ? cfg.base + Math.floor((level - 1) / cfg.levelsPerPoint) : null;
}
/** V = 1 m/s + 1 m/s a cada 4 níveis (Sistema p.12). Turno = 6 s (decisão do Mestre). */
export const speedMps = (level: number): number => 1 + Math.floor((level - 1) / 4);

export const TURN_SECONDS = 6;
export const metersPerTurn = (level: number): number => speedMps(level) * TURN_SECONDS;
