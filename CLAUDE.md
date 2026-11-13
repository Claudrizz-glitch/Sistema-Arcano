# Arkhavel — Sistema Arcano

Plataforma web do RPG Sistema Arcano: Next.js 15 + TypeScript + Tailwind + Supabase (projeto `kgypkewdbrutorqrqjlt`).
Veja também `README.md` e `docs/` (DECISOES, ETAPA3, INSTALACAO).

## Fonte oficial (hierarquia de informação)
1. **Documento "Sistema Arcano" (Google Docs)** — fonte oficial de regras, mecânicas, raças, bênçãos, itens, bestiário,
   história, personagens e geografia.
   - ID: `1yBIkEPybUFlryVa_OJaEjDUpQyIX7jqfThKM59Api9A`
   - URL: https://docs.google.com/document/d/1yBIkEPybUFlryVa_OJaEjDUpQyIX7jqfThKM59Api9A/edit
   - O PDF local foi descontinuado: use sempre a versão mais recente do doc.
2. **Código-fonte** — implementação atual (o que existe e como funciona).
3. **Conversas anteriores** e `docs/DECISOES.md` — decisões do Mestre, pedidos e pendências.

### Regras de trabalho
- Não inventar regras ou lore. Não contradizer o doc sem apontar a divergência explicitamente.
- Diferenciar "regra documentada" de "funcionalidade implementada".
- Divergência doc × código: apresentar ao usuário ANTES de alterar qualquer coisa.
- Nunca editar o documento original nem substituí-lo por conteúdo de conversas.
- Para validar uma regra, reler o doc (ferramenta do Google Drive `read_file_content` com o ID acima; o resultado é grande —
  extrair `fileContent` para um arquivo no scratchpad e ler em partes). Imagens: `read_doc` (Google Docs API) lista `inlineObjects`.

## Estrutura do documento (seções na ordem)
Sinopse · Raças (Humano, Anão + variações, Druída + 7 tipos, Profano + periculosidade I–V, Forjado; tabelas de 21 níveis) ·
Bênçãos (regras + 22 em 6 grupos; a com emoji é a extra) · Inventário (armas, defesas, poções, sangue de unicórnio) ·
Mapa (+ imagem) · Economia · Combate (sanidade, regeneração, prioridade, XP, queda, sangramento, Força de Massa, explosões,
velocidade) · Bestiário (11 biomas com flora/fauna/criaturas; profanos por periculosidade I–V) · Itens Mágicos (16, incl.
Baralho Arcano e Semente da Natureza/Druída Puro) · Arcanismo (feitos mágicos, manipulação, aparatação, gerais, elementais,
druídicos, contratos) · seções com instrução de exportação (abaixo).

### Seções do doc com destino definido no site
| Seção do doc | Destino indicado no próprio doc |
|---|---|
| (FICHAS DE JOGADOR PARA IMPORTAÇÃO) — Adamastor, Jorge, Barbosa, Maxssimus, Rumpelstiltskin | Fichas de jogador da campanha |
| Roteiro | Diário **por sessão** (página /campanha/[id]/diario): roteiro privado do Mestre e, em cada sessão iniciada, anotações do grupo (públicas) e do Mestre (privadas). Decisão do usuário em 2026-11-16, no lugar do diário por dia |
| Notas | Anotações gerais do Mestre |
| Personagens — Mago, Kael, Morte, Força, Torre, Enamorados, Julgamento, Louco | Fichas de NPC |

### Imagens
- As imagens do doc foram extraídas e otimizadas em `public/img/` (fonte: o próprio doc):
  `mapa-arkhavel.webp` (card Mapa em /regras), `roteiro/sessao1-*.webp` (Roteiro, 1ª sessão),
  `retratos/<jogador>.webp` (5 fichas de jogador) e `retratos/npc-*.webp` (8 NPCs; Louco tem 2).
- A pasta `BaralhoArcano/` (imagens de cartas) **não tem relação com o site**: ignorar sempre. O único "Baralho Arcano" do projeto é o item arcano descrito no doc.
- Retratos de jogadores e NPCs existem só dentro do doc (não há cópia local).
- Arquivos originais são grandes: otimizar (ex.: WebP) antes de colocar em `public/`.

## Calendário (decisão do usuário, 2026-11-14)
Anos contados desde o Clube de Tarot e a criação da Capital (ano 0). O ano começa no Inverno (Inverno, Primavera, Verão, Outono;
90 dias cada). Grande Eclipse no 1º da Primavera dos anos 0, 22, 44… A campanha "O Eclipse" começou no dia 69 do Inverno do ano 44
(22 dias até o Eclipse). Roteiro: 1ª sessão 69, 2ª sessão 71, amanhecer do dia 72.

## Regras decididas (2026-11-14)
- Teste de Feitos Mágicos: abaixo da CD, custo de mana sobe proporcionalmente até 2× com 1 no dado (cast_spell / featCost).
- Druída comum: feitiços druídicos harmônicos + manipulação de mana (categoria "Técnica fundamental"). Druída Puro: tudo.
- Profano: +5 no dado de feitos ao pé da letra (pior resultado = 6, nunca paga 2×).
- Bênção Completa (Arcanos e Bispos): character_blessings.complete; não ocupa slot nem tem limite; grant_blessing(p_complete).
- NPCs do doc: os antigos Arcanos do Clube de Tarot são nível 0; só o Mago e o Louco estão vivos. Kael (Forjado) está vivo, nível 19.

## Banco
Migrações versionadas em `supabase/migrations/` (a partir da 0014); scripts de dados em `supabase/data/`.
Fichas de jogador ficam com o Mestre (`kind='mestre'`, `player_template=true`) até serem importadas para um jogador
(`assign_sheet_to_player`). Retratos: bucket `portraits` (pasta `<campaign_id>/`) ou caminhos `/img/...`.

## Onde fica cada coisa no site (2026-11-13)
- **Gerenciar sistema** (conteúdo oficial, só Mestre autorizado): `/painel/sistema` — regras (cards da página /regras),
  raças (texto + variantes + tabela na mesma página), feitiços, bênçãos, itens, bestiário e regiões.
- **Turnos** (`/campanha/[id]/turnos`): tempo (turnos, horas, dias) + combate. `/tempo` e `/combate` redirecionam.
- Fichas: 3 estados (pendente, ativa, morta); Excluir apaga; mortas podem ser revividas.
- Ruptura é concedida automaticamente a toda ficha que não seja anão (trigger `grant_ruptura`).

## Itens arcanos — Fase 1 (2026-11-14)
Mecânica em items.properties.mechanic: pocao, semente, baralho_arcano, manto, olho_de_cobra (+ filho_do_sol).
RPCs: use_item, weapon_hit (golpe > 5x o dano máximo quebra arma comum), set_cloak (custo por turno no advance_turn),
eye_extract (% da Vida máxima pela diferença de nível), draw_omen; Baralho: trigger item_grants e teste 15 + 1d6 no cast_spell.
Orbe, Máscara, Sapato e Moeda: painéis de registro (trinket_action; mechanics orbe, mascara, moeda, sapato). O Orbe só registra nomes: não tira fichas de jogo.

## Itens arcanos — Fases 2 e 3 (2026-11-15)
Só o Mestre aciona; o jogador apenas vê o painel. Estado de cada item em character_items.state.
- espada_carmesim (crimson_attack / crimson_rupture; brilho de 2 turnos = 12 s, sem piso de CD), fio_bifurcado (dagger_action),
  estigma (stigma_action; manutenção por turno), coracao_rubro (heart_action; regeneração x multiplicador no advance_turn).
- Queimadura: character_bleedings.kind = 'queimadura' (flat_damage, turns_left), RPC add_burn; aplicada a cada turno.
- elmo_imortal (helm_action: ponto / mitigar / retornar / revanche / encerrar; 'retornar' restaura TODAS as fichas e volta o turno),
  ovelha_lobo (wolf_action; média via character_modifiers.hp_bonus), bau_mirral (chest_action; selada não pode morrer).
- Fotos de fichas em sheet_snapshots (sem acesso direto; só funções do banco).

## Diário por sessão (2026-11-16)
Tabelas sessions (pública para membros depois de iniciada) e session_gm (roteiro e anotações do Mestre). RPCs: session_draft_save,
session_start, session_gm_save, session_public_save. A tabela day_notes ficou sem uso (dados migrados para as sessões 1 e 2).
ATENÇÃO: o banco, chamado pelo site, recusa DELETE/UPDATE sem WHERE dentro das funções — sempre usar "where true" em tabelas temporárias.

## Membros e defesas (2026-11-16)
remove_member(campanha, usuário): só o Mestre; as fichas do jogador voltam ao Mestre como reservadas. defense_wear: armaduras e
escudos perdem 1d4 de mitigação por uso (estado em character_items.state.mit). Todas as lacunas de regra (rule_gaps) estão resolvidas.
