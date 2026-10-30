// Tradução das mensagens de erro das RPCs/RLS (os códigos vêm do banco).
const MAP: Record<string, string> = {
  nao_autenticado: "Sua sessão expirou. Entre novamente.",
  sem_permissao: "Você não tem permissão para esta ação.",
  somente_mestre_pode_criar_campanha: "Somente um Mestre autorizado pode criar campanhas.",
  convite_invalido: "Código de convite inválido.",
  limite_de_fichas: "Limite de fichas atingido para este jogador nesta campanha.",
  raca_invalida: "Raça inválida ou não selecionável.",
  raca_nao_selecionavel: "Esta raça não pode ser escolhida na criação.",
  tabela_sem_nivel: "A tabela de progressão não possui esse nível (lacuna nas regras).",
  ficha_nao_encontrada: "Ficha não encontrada.",
  ficha_morta: "Esta ficha está marcada como morta.",
  ja_existe_ficha_ativa: "O jogador já possui uma ficha ativa. Desative-a ou registre sua morte antes.",
  transicao_invalida: "Transição de estado não permitida.",
  feitico_nao_pertence_a_ficha: "O feitiço não foi concedido a esta ficha.",
  feitico_ja_concedido: "Este feitiço já foi concedido.",
  feitico_nao_encontrado: "Feitiço não encontrado.",
  raca_nao_conjura: "A raça deste personagem não pode conjurar (o Mestre pode usar a exceção).",
  raca_sem_mana: "Este personagem não possui Mana.",
  raca_sem_vida: "Este personagem não possui Vida (a regra de dano da raça não está documentada).",
  mana_bloqueada: "A Mana está bloqueada por um efeito ativo (ex.: Filho do Sol).",
  mana_insuficiente: "Mana insuficiente para usar o feitiço.",
  custo_ausente: "O feitiço não tem custo de Mana cadastrado: não é possível descontar automaticamente.",
  dano_invalido: "Dano inválido.", quantidade_invalida: "Quantidade inválida.",
  vida_fora_do_limite: "Vida fora do limite permitido.", mana_fora_do_limite: "Mana fora do limite permitido.",
  sanidade_fora_do_limite: "Sanidade fora do limite (0 a 30).",
  conflito_turno: "O turno já foi avançado por outra ação. A tela foi atualizada.",
  conflito_posicao: "A ordem de iniciativa mudou. Atualize a tela.",
  conflito_de_versao: "A ficha foi alterada por outra pessoa. Atualize e tente de novo.",
  acao_ja_revertida: "Esta ação já foi revertida.", acao_nao_reversivel: "Esta ação não pode ser revertida.",
  sem_direito_de_bencao: "O personagem não tem direito a mais bênçãos neste nível.",
  extra_exige_todas_as_comuns: "A bênção extra exige todas as bênçãos comuns do grupo.",
  bencao_ja_concedida: "Esta bênção já foi concedida.", bencao_nao_encontrada: "Bênção não encontrada.",
  item_nao_encontrado: "Item não encontrado.", nivel_invalido: "Nível inválido (1 a 21).",
  conversao_exige_druida: "Conversão exige um Druída (o Mestre pode usar a exceção).",
  encontro_encerrado: "O encontro já foi encerrado.", participante_fora_da_campanha: "Participante não pertence à campanha.",
  "row-level security": "Operação bloqueada pelas regras de acesso.",
  "permission denied": "Operação bloqueada pelas regras de acesso.",
  "violates foreign key": "Este registro está em uso (ficha ou histórico). Arquive em vez de excluir.",
  "duplicate key": "Já existe um registro com esse nome.",
};
export function friendly(message: string | undefined | null): string {
  if (!message) return "Erro desconhecido.";
  for (const k of Object.keys(MAP)) if (message.includes(k)) {
    const extra = message.includes(":") ? " (" + message.split(":").slice(1).join(":").trim() + ")" : "";
    return MAP[k] + (["mana_insuficiente", "conflito_turno", "sem_direito_de_bencao", "extra_exige_todas_as_comuns", "ja_existe_ficha_ativa"].includes(k) ? extra : "");
  }
  return message;
}
