export type Pool = { current: number; max: number };
export type OpResult = { current: number; applied: number };

function assertAmount(n: number, nome: string) {
  if (!Number.isInteger(n) || n < 0) throw new Error(`${nome} deve ser inteiro >= 0`);
}
/** Vida após dano = atual − dano, mínimo 0. Dano negativo é recusado. */
export function applyDamage(p: Pool, damage: number): OpResult {
  assertAmount(damage, "Dano");
  const current = Math.max(0, p.current - damage);
  return { current, applied: p.current - current };
}
/** Cura/restauração limitada ao máximo. */
export function restore(p: Pool, amount: number): OpResult {
  assertAmount(amount, "Quantidade");
  const current = Math.min(p.max, p.current + amount);
  return { current, applied: current - p.current };
}
export type SpendResult = { ok: true; before: number; after: number } | { ok: false; reason: "mana_insuficiente" | "custo_ausente" | "mana_bloqueada" };

/** Usar feitiço: o custo vem do catálogo; nunca do usuário. Sem mana suficiente, não desconta. */
export function spendMana(current: number, cost: number | null | undefined, blocked = false): SpendResult {
  if (blocked) return { ok: false, reason: "mana_bloqueada" };
  if (cost === null || cost === undefined || !Number.isInteger(cost) || cost < 0) return { ok: false, reason: "custo_ausente" };
  if (current < cost) return { ok: false, reason: "mana_insuficiente" };
  return { ok: true, before: current, after: current - cost };
}
