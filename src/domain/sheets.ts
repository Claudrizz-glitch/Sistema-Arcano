export const MAX_SHEETS_PER_PLAYER = 10;
export type SheetStatus = "pendente" | "ativa" | "morta";

/** Limite total (inclui pendentes e mortas). Também deve ser imposto no banco. */
export function canCreateSheet(totalSheets: number, limit = MAX_SHEETS_PER_PLAYER): boolean {
  return totalSheets < limit;
}

const TRANSITIONS: Record<SheetStatus, SheetStatus[]> = {
  pendente: ["ativa", "morta"],
  ativa: ["morta"],
  morta: ["ativa"], // reviver; para tirar uma ficha de jogo, o Mestre a exclui
};
export type TransitionResult = { ok: true } | { ok: false; reason: "transicao_invalida" | "ja_existe_ficha_ativa" };

/** Nunca desativa a ficha ativa silenciosamente: o conflito é devolvido ao Mestre. */
export function checkTransition(from: SheetStatus, to: SheetStatus, otherActiveSheets: number): TransitionResult {
  if (!TRANSITIONS[from].includes(to)) return { ok: false, reason: "transicao_invalida" };
  if (to === "ativa" && otherActiveSheets > 0) return { ok: false, reason: "ja_existe_ficha_ativa" };
  return { ok: true };
}
