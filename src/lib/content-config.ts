// Campos reais das tabelas do banco (ver migração 0001). Nada aqui inventa colunas.
export type FieldDef = { key: string; label: string; type: "text" | "textarea" | "number" | "select" | "bool" | "tri"; options?: [string, string][]; lookup?: string; help?: string; wide?: boolean };
export type KindDef = { kind: string; table: string; label: string; singular: string; nameKey: string; fields: FieldDef[]; hasSource: boolean; listCols: string[] };

const GRP: [string, string][] = ["I", "II", "III", "IV", "V", "VI"].map((g) => [g, `Grupo ${g}`]);
const KINDS: [string, string][] = [["arma", "Arma"], ["armadura", "Armadura"], ["escudo", "Escudo"], ["pocao", "Poção"], ["equipamento", "Equipamento"], ["material", "Material"], ["arcano", "Item arcano"], ["outro", "Outro"]];

export const KIND_DEFS: Record<string, KindDef> = {
  regras: { kind: "regras", table: "rule_topics", label: "Regras e tópicos", singular: "tópico", nameKey: "title", hasSource: false, listCols: ["slug"],
    fields: [{ key: "slug", label: "Endereço (slug)", type: "text", help: "Ex.: combate-sangramento — usado na URL pública." }, { key: "sort_order", label: "Ordem de exibição", type: "number" },
      { key: "body_md", label: "Texto (Markdown simples: ## título, - listas, **negrito**, tabelas com |)", type: "textarea", wide: true }] },
  feiticos: { kind: "feiticos", table: "spells", label: "Feitiços", singular: "feitiço", nameKey: "name", hasSource: true, listCols: ["category", "mana_cost"],
    fields: [{ key: "category", label: "Categoria", type: "text" }, { key: "mana_cost", label: "Custo de Mana (vazio = não documentado)", type: "number" }, { key: "cd", label: "CD", type: "number" },
      { key: "mana_cost_note", label: "Observação sobre o custo", type: "text" }, { key: "range_text", label: "Alcance", type: "text" }, { key: "duration_text", label: "Duração", type: "text" },
      { key: "damage_text", label: "Dano", type: "text" }, { key: "healing_text", label: "Cura", type: "text" }, { key: "harmonic", label: "Harmônico (druídicos)", type: "tri" },
      { key: "description", label: "Descrição", type: "textarea", wide: true }, { key: "effect", label: "Efeito", type: "textarea", wide: true },
      { key: "restrictions", label: "Restrições", type: "textarea", wide: true }, { key: "notes", label: "Observações", type: "textarea", wide: true }] },
  bencaos: { kind: "bencaos", table: "blessings", label: "Bênçãos", singular: "bênção", nameKey: "name", hasSource: true, listCols: ["grp", "is_extra"],
    fields: [{ key: "grp", label: "Grupo", type: "select", options: GRP }, { key: "is_extra", label: "Bênção extra do grupo (fora do limite)", type: "bool" },
      { key: "effect", label: "Efeito", type: "textarea", wide: true }, { key: "description", label: "Descrição", type: "textarea", wide: true },
      { key: "restrictions", label: "Restrições", type: "textarea", wide: true }, { key: "uses_text", label: "Usos disponíveis", type: "text" }, { key: "recovery_text", label: "Recuperação", type: "text" },
      { key: "notes", label: "Observações", type: "textarea", wide: true }] },
  itens: { kind: "itens", table: "items", label: "Equipamentos e itens arcanos", singular: "item", nameKey: "name", hasSource: true, listCols: ["kind"],
    fields: [{ key: "kind", label: "Categoria", type: "select", options: KINDS }, { key: "consumable", label: "Consumível", type: "tri" },
      { key: "damage_dice_count", label: "Dano: nº de dados", type: "number" }, { key: "damage_dice_sides", label: "Dano: lados", type: "number" },
      { key: "aa_multiplier", label: "N em “dado + N·AA”", type: "number", help: "AA = dado de ataque básico do portador; N·AA = rola o AA N vezes." },
      { key: "penetration", label: "Penetração", type: "number" }, { key: "range_m", label: "Alcance (m)", type: "number" },
      { key: "mitigation_dice_count", label: "Mitigação: nº de dados", type: "number" }, { key: "mitigation_dice_sides", label: "Mitigação: lados", type: "number" },
      { key: "description", label: "Descrição", type: "textarea", wide: true }, { key: "effects", label: "Efeitos", type: "textarea", wide: true },
      { key: "restrictions", label: "Requisitos / restrições", type: "textarea", wide: true }, { key: "notes", label: "Observações", type: "textarea", wide: true }] },
  criaturas: { kind: "criaturas", table: "creatures", label: "Bestiário (criaturas)", singular: "criatura", nameKey: "name", hasSource: true, listCols: ["category", "periculosidade"],
    fields: [{ key: "category", label: "Categoria", type: "select", options: [["fauna_flora", "Fauna e Flora"], ["profano", "Profano"], ["outra", "Outra"]] },
      { key: "periculosidade", label: "Periculosidade (só se a fonte informar)", type: "select", options: [["", "— não informada —"], ["1", "I"], ["2", "II"], ["3", "III"], ["4", "IV"], ["5", "V"]] },
      { key: "region_id", label: "Região / bioma principal", type: "select", lookup: "regions" }, { key: "is_secret", label: "Entrada secreta (oculta dos jogadores)", type: "bool" },
      { key: "description", label: "Descrição completa", type: "textarea", wide: true }, { key: "traits", label: "Características", type: "textarea", wide: true },
      { key: "abilities", label: "Habilidades", type: "textarea", wide: true }, { key: "weaknesses", label: "Fraquezas", type: "textarea", wide: true },
      { key: "habitat", label: "Habitat", type: "text" }, { key: "behavior", label: "Comportamento", type: "text" }, { key: "notes", label: "Observações narrativas e de uso em jogo", type: "textarea", wide: true }] },
  regioes: { kind: "regioes", table: "regions", label: "Regiões e biomas", singular: "região", nameKey: "name", hasSource: true, listCols: ["kind"],
    fields: [{ key: "kind", label: "Tipo", type: "select", options: [["bioma", "Bioma"], ["regiao", "Região"], ["local", "Local"]] },
      { key: "description", label: "Descrição", type: "textarea", wide: true }, { key: "flora", label: "Flora", type: "textarea", wide: true }, { key: "fauna", label: "Fauna", type: "textarea", wide: true }, { key: "notes", label: "Observações", type: "textarea", wide: true }] },
};
export const NUMERIC = new Set(["periculosidade", "sort_order", "mana_cost", "cd", "damage_dice_count", "damage_dice_sides", "aa_multiplier", "penetration", "range_m", "mitigation_dice_count", "mitigation_dice_sides"]);
export const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
