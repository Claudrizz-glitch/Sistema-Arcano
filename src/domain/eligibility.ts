export type RaceInfo = { slug: string; progression: string; canCast: boolean; name: string };
export type SpellInfo = { druidic: boolean; harmonic: boolean | null; passive: boolean; name: string; contract?: boolean };
/** Espelho (apenas para a interface) da validação do servidor `_spell_block`. Retorna o motivo do bloqueio ou null. */
export function spellBlock(char: { raceSlug: string; progression: string; effectiveRaceCanCast: boolean; effectiveRaceName: string }, s: SpellInfo): string | null {
  if (s.contract) return `${s.name} é um contrato geral: registre-o na seção Contratos da ficha.`;
  if (s.passive) return `${s.name} é uma regra passiva, não um feitiço conjurável.`;
  if (!char.effectiveRaceCanCast) return `${char.effectiveRaceName} não pode realizar magia.`;
  if (s.druidic) {
    if (char.progression === "druida_puro") return null;
    if (char.raceSlug === "druida") return s.harmonic === true ? null : "Druídas comuns acessam apenas feitiços druídicos harmônicos.";
    return "Feitiços druídicos exigem Druída ou Druída Puro.";
  }
  if (char.raceSlug === "druida" && char.progression !== "druida_puro") return "Druídas comuns acessam apenas feitiços druídicos harmônicos.";
  return null;
}
/** Bênçãos extras: concedida quando TODAS as comuns do grupo estão presentes; removida (se automática) quando deixam de estar. */
export function extrasToGrant(owned: string[], groups: { common: string[]; extra: string }[]): string[] {
  return groups.filter((g) => g.common.every((c) => owned.includes(c)) && !owned.includes(g.extra)).map((g) => g.extra);
}
export function extrasToRevoke(owned: string[], groups: { common: string[]; extra: string }[], autoGranted: string[]): string[] {
  return groups.filter((g) => owned.includes(g.extra) && autoGranted.includes(g.extra) && !g.common.every((c) => owned.includes(c))).map((g) => g.extra);
}
