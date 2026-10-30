import type { Pool } from "./resources.ts";
import { restore } from "./resources.ts";

/** Regeneração global (Sistema p.10: 1 PV e 1 Mana por turno). Configurável por campanha. */
export type RegenRule = { intervalTurns: number; hp: number; mana: number };
export const DEFAULT_REGEN: RegenRule = { intervalTurns: 1, hp: 1, mana: 1 };

export type RegenState = { lastRegenTurn: number; hp: Pool | null; mana: Pool | null };
export type RegenResult = { ticks: number; state: RegenState };

/**
 * Idempotente por construção: o progresso é guardado em lastRegenTurn.
 * Reaplicar o mesmo intervalo não gera ticks (toTurn <= lastRegenTurn).
 */
export function processRegen(state: RegenState, toTurn: number, rule: RegenRule = DEFAULT_REGEN): RegenResult {
  if (!Number.isInteger(toTurn)) throw new Error("Turno inválido");
  if (rule.intervalTurns < 1) throw new Error("Intervalo de regeneração inválido");
  if (toTurn <= state.lastRegenTurn) return { ticks: 0, state };
  const ticks = Math.floor((toTurn - state.lastRegenTurn) / rule.intervalTurns);
  const lastRegenTurn = state.lastRegenTurn + ticks * rule.intervalTurns;
  const hp = state.hp ? { ...state.hp, current: restore(state.hp, ticks * rule.hp).current } : null;
  const mana = state.mana ? { ...state.mana, current: restore(state.mana, ticks * rule.mana).current } : null;
  return { ticks, state: { lastRegenTurn, hp, mana } };
}

/** Avanço de turno: exige expectedTurn (controle otimista) para evitar avanço duplo por clique repetido. */
export function advanceTurn(current: number, expectedTurn: number, by = 1): number {
  if (current !== expectedTurn) throw new Error("Conflito: o turno já foi avançado");
  if (!Number.isInteger(by) || by < 1) throw new Error("Avanço inválido");
  return current + by;
}
