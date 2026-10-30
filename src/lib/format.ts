import type { Item } from "./types";
export const ITEM_KIND: Record<string, string> = { arma: "Armas", armadura: "Armaduras", escudo: "Escudos", pocao: "Poções", equipamento: "Equipamentos", material: "Materiais", arcano: "Itens arcanos", outro: "Outros" };
export function describeItem(i: Item): string[] {
  const out: string[] = [];
  if (i.damage_dice_count) out.push(`Dano: ${i.damage_dice_count}d${i.damage_dice_sides}${i.aa_multiplier ? ` + ${i.aa_multiplier}AA` : ""}${i.penetration ? ` + ${i.penetration} de penetração` : ""}`);
  if (i.mitigation_dice_count) out.push(`Mitigação: ${i.mitigation_dice_count}d${i.mitigation_dice_sides}`);
  if (i.range_m) out.push(`Alcance: ${i.range_m}m`);
  return out;
}
export const ACTION_LABEL: Record<string, string> = {
  iniciar_sangramento: "Iniciou sangramento", encerrar_sangramento: "Encerrou sangramento", iniciar_absorcao: "Iniciou absorção de mana", encerrar_absorcao: "Encerrou absorção", perfuracao_nucleo: "Perfuração do núcleo", bencao_extra_automatica: "Bênção extra (automática)",
  usar_feitico: "Usou feitiço", dano: "Dano", cura: "Cura", restaurar_mana: "Restaurou Mana", correcao_manual: "Correção manual",
  avancar_turno: "Avançou turno", alterar_nivel: "Alterou nível", conceder_xp: "Concedeu XP", criar_ficha: "Criou ficha", criar_npc: "Criou NPC",
  editar_ficha: "Editou ficha", conceder_feitico: "Concedeu feitiço", remover_feitico: "Removeu feitiço", conceder_bencao: "Concedeu bênção",
  remover_bencao: "Removeu bênção", conceder_item: "Concedeu item", remover_item: "Removeu item", equipar: "Equipou", desequipar: "Desequipou",
  conceder_contrato: "Concedeu contrato", adicionar_modificador: "Adicionou modificador", remover_modificador: "Removeu modificador",
  converter_progressao: "Converteu progressão", reverter: "Reverteu ação", criar_encontro: "Criou encontro", encerrar_encontro: "Encerrou encontro",
  ficha_ativa: "Ativou ficha", ficha_inativa: "Desativou ficha", ficha_morta: "Registrou morte", ficha_pendente: "Voltou a pendente",
};
/** Tempo ficcional a partir do turno (turno = turn_seconds). A estrutura de meses/estações é configurável e ainda não definida pelo Mestre. */
export function elapsed(turn: number, turnSeconds: number): string {
  const s = turn * turnSeconds; const d = Math.floor(s / 86400); const h = Math.floor((s % 86400) / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
  return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`;
}

import { calendarDate, configFromJson } from "@/domain/calendar";
/** Data ficcional (Arkhavel) derivada do turno persistido. Nunca confundir turno com data. */
export function fictionalDate(turn: number, turnSeconds: number, cfg: Record<string, unknown> | null | undefined) {
  return calendarDate(turn, turnSeconds, configFromJson(cfg as Record<string, any> | null));
}
export function dateLabel(d: ReturnType<typeof calendarDate>): string { return `${d.season}, dia ${d.day} · Ano ${d.year}`; }
export function eclipseLabel(d: ReturnType<typeof calendarDate>): string {
  return d.eclipse.isToday ? "Hoje é o Grande Eclipse!" : `Grande Eclipse (ano ${d.eclipse.year}) em ${d.eclipse.daysUntil} dia${d.eclipse.daysUntil === 1 ? "" : "s"}`;
}
