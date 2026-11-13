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
| Roteiro | Anotação **privada do Mestre por dia** (página /campanha/[id]/diario); a partir do dia 69 de Inverno cada dia tem um campo público (jogadores editam) e um privado (Mestre) |
| Notas | Anotações gerais do Mestre |
| Personagens — Mago, Kael, Morte, Força, Torre, Enamorados, Julgamento, Louco | Fichas de NPC |

### Imagens
- As imagens do doc foram extraídas e otimizadas em `public/img/` (fonte: o próprio doc):
  `mapa-arkhavel.webp` (card Mapa em /regras), `roteiro/sessao1-*.webp` (Roteiro, 1ª sessão),
  `retratos/<jogador>.webp` (5 fichas de jogador) e `retratos/npc-*.webp` (8 NPCs; Louco tem 2).
- A pasta `BaralhoArcano/` (imagens de cartas) **não tem relação com o site**: ignorar sempre. O único "Baralho Arcano" do projeto é o item arcano descrito no doc.
- Retratos de jogadores e NPCs existem só dentro do doc (não há cópia local).
- Arquivos originais são grandes: otimizar (ex.: WebP) antes de colocar em `public/`.

## Calendário (decisão do usuário, 2026-11-12)
A campanha começa no **dia 69 do Inverno**; o Inverno termina no dia 90, faltando exatamente 22 dias para o 1º da Primavera
(Grande Eclipse). Roteiro do doc: 1ª sessão 69, 2ª sessão 71, amanhecer do dia 72 = data atual da campanha "O Eclipse".

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
