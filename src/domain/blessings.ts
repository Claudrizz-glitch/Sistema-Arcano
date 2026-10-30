export type BlessingGroup = { group: string; common: string[]; extra: string };
export type BlessingRules = { specialLevels: number[]; commonLimit: number; groups: BlessingGroup[] };

/** Direitos de Bênção = níveis especiais atingidos (3-5-8-13-21), limitados ao máximo de comuns. */
export function blessingRights(level: number, rules: BlessingRules): number {
  const earned = rules.specialLevels.filter((l) => l <= level).length;
  return Math.min(earned, rules.commonLimit);
}
export type OwnedBlessings = string[];
export function commonOwned(owned: OwnedBlessings, rules: BlessingRules): number {
  const commons = new Set(rules.groups.flatMap((g) => g.common));
  return owned.filter((b) => commons.has(b)).length;
}
/** Concessão de comum: respeita o limite (exceções por contrato/bênção de grupo = decisão do Mestre via override). */
export function canGrantCommon(level: number, owned: OwnedBlessings, rules: BlessingRules, override = false): boolean {
  if (override) return true;
  return commonOwned(owned, rules) < blessingRights(level, rules);
}
/** Extra do grupo: elegível quando possui TODAS as comuns do grupo. Não conta no limite. */
export function eligibleExtras(owned: OwnedBlessings, rules: BlessingRules): string[] {
  return rules.groups
    .filter((g) => g.common.every((c) => owned.includes(c)) && !owned.includes(g.extra))
    .map((g) => g.extra);
}
