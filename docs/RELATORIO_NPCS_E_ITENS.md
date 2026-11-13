# Relatório — Fichas de NPC e efeitos dos itens (2026-11-14)

Fonte: doc "Sistema Arcano" (seções **Personagens (Importar para fichas de NPC)**, **Notas**, **Bênçãos** e **Itens Mágicos**).
Nada foi criado no banco. Onde escrevo **Sugestão**, é uma leitura minha do doc que precisa da sua confirmação.

## 1. Por que as fichas de NPC estão paradas
Para criar uma ficha, o site exige **raça** e **nível** (eles definem Vida, Mana e dado de AA pela tabela da raça).
O doc dá a raça de 5 dos 8 NPCs e não dá o nível de nenhum. Os retratos dos 8 já estão no site (`/img/retratos/npc-*.webp`).

## 2. NPC por NPC: o que o doc diz e o que falta

| NPC | Raça no doc | Nível | Situação no doc | Bênção | Outros dados do doc |
|---|---|---|---|---|---|
| **O Mago** | ❌ não diz | ❌ | Vivo; prepara o plano do Eclipse | Bênção Completa do Mago: eficiência de mana (reduz ou anula custos) | Domina **todos** os feitiços e criou vários; despreza contratos e bênçãos; executou o Grande Selamento há 44 anos |
| **Kael** | Forjado (feito de um cadáver) | ❓ "sequência 19" | Vivo; Cavalheiro do Rei Milo Vetra | Alterna entre as 22 bênçãos, até 5 ativas | Imune a dano mágico; criado há 3 anos; runas ocultas para o Eclipse; alvo do Salto de Fé do Mago |
| **O Morte** | Druída bestial de ovelha | ❌ | Morto (um dos 3 Arcanos mortos na luta contra o Força) | Bênção Completa da Morte | Vê quando todos estão perto da morte; encerra acontecimentos antes de acontecerem; criou um profano (o Lobo Astral da Ovelha e o Lobo) |
| **O Força** | Humano, sem magia | ❌ | Selado pelo Louco | Bênção Completa da Força | Príncipe Vetra; preso numa armadura que o tortura; arsenal da família inutilizado — luta só na defesa com a espada clássica, sem causar dano |
| **O Torre** | Ogro de 3 m (variante de Anão) | ❌ | Morto na luta contra o Força | Bênção Completa da Torre | Causa colapso com a presença; desestabiliza defesas e estruturas |
| **Enamorados** | ❌ não diz ("uma mulher") | ❌ | Morta na luta contra o Força; inutilizou o arsenal mesmo decapitada | Bênção Completa dos Enamorados | Força devoção; rouba poderes e inutiliza o original |
| **O Julgamento** | Centauro (variante de Druída) | ❌ | Não diz | Bênção Completa do Julgamento | Compasso moral próprio; dano máximo da bênção 10d20 (agredir um unicórnio) |
| **O Louco** | ❌ não diz | ❌ | Vivo; protege sua igreja (nômade) | Bênção Completa do Louco (forma final: alma livre, espaço não euclidiano) | Recusa a morte e prisões; só é vencido sendo enganado num contrato; único sobrevivente da luta contra o Força |

### O que preciso de você para criar cada ficha básica
1. **Raça** do Mago, de Enamorados e do Louco.
2. **Nível** de cada um. **Sugestão:** os Arcanos podem ser **Nível 0** (o doc diz que o Nível 0 é transcendental, dobra tudo e existe em número limitado). Kael: **nível 19**, se "sequência 19" for o nível.
3. **Estado da ficha:** o site tem pendente, ativa e morta.
   - Morte, Torre e Enamorados → **morta**?
   - Força está **selado**, e há outros Arcanos selados pelo Mago. Crio um estado "selado" ou deixo como **ativa** com uma anotação?
4. **Bênção Completa × fragmentada:** o site concede bênçãos fragmentadas (as 22 do catálogo). Para os Arcanos, concedo a bênção do próprio Arcano e anoto "Completa" no texto? Ou você quer um campo específico de Bênção Completa?
5. **Feitiços:** o Mago domina todos — concedo o catálogo inteiro? Os demais recebem só Ruptura (automática, exceto o Torre, que é anão/ogro)?
6. **Kael:** quais 5 bênçãos ficam ativas no início?
7. **Vida, Mana e Sanidade atuais:** começo todos no máximo e Sanidade 30?

Assim que você responder, crio as 8 fichas de NPC com retrato, texto do doc em "anotações narrativas" e o que for decidido acima.

## 3. O que cada item arcano vai alterar na ficha
Versão resumida e atualizada do `RELATORIO_DOC_X_SISTEMA.md` (Ruptura agora é feitiço; Espada Carmesim tem 1d6 + 3AA; a Estrela tem presságio).

| Item | O que muda na ficha | Tipo |
|---|---|---|
| 🔮 Orbe de Selamento | Lista de seres selados; botões Selar e Libertar | Contador |
| 🎭 Máscara da Vitória | Campo "aparência atual = último ser abatido" | Contador |
| 👞 Sapato de Escalada | Só descrição (degraus de vidro) | Narrativo |
| 🪙 Moeda do Retorno | Volta ao dono a cada amanhecer do calendário | Narrativo + automático |
| ⚔️ Espada Carmesim | Arma 1d6 + 3AA; "CD de Ruptura atual" cai 1 por ataque básico; brilho de 2 turnos; permite Ruptura a anões | Contador + ação |
| 🃏 Baralho Arcano | Concede Granada, Construtos de Mana e Reforço; teste de feitos sempre 15 + 1d6 (a CD quase nunca falha); botão "Tirar carta" com os 22 presságios | Passiva + ação |
| 🛡️ Elmo Imortal | Mitigação 1d20 que cai 1d4 por uso; até 2 retornos por combate com "foto" da ficha e dos aliados; 1 bênção qualquer na revanche | Contador + ação |
| 🏹 A Ovelha e o Lobo | Marcas guardadas; consumir marca = +10% da vida ou do dano da marca, permanente; cancelar caçada custa sanidade | Ação + contador |
| 🪓 Filho do Sol | **Já funciona:** Vida ×2, dados ×2, sem mana; sacrifício de vida +1d4 a cada 40; maldição ao largar. Dano agora 1d10 + 4AA | Pronto |
| 🫀 Coração Rubro | Multiplicador (×1,2 a ×5) pela % de vida perdida em dano, regeneração ou velocidade; fases por nível | Passiva calculada |
| 🧰 Baú de Mirral | Imortal: Vida 0 não mata; "foto" no selamento; novo corpo / baú aberto / baú destruído | Permanente |
| 👁️ Olho de Cobra | Extrair informação: tira 8% a 30% da vida conforme a diferença de nível; +5 em Carisma (só anotação, não há atributo) | Ação |
| 🧥 Manto Espectral | Invisível 60 de mana/turno; Intangível 180/turno; desliga sem mana | Ação contínua |
| 🗡️ Fio Bifurcado | Acúmulos por alma (sem repetir); caminho Ígnea ou Boreal; marcos 5 a 500 com efeitos | Contador |
| ☠️ Estigma do Sem-Pele | Pele de material (30 de mana), transmutação (20), camadas extras (20 por 5 L + 5/turno) | Permanente + ação |
| 🌱 Semente da Natureza | Ao consumir: converte em Druída Puro (já existe) e libera todos os feitiços | Quase pronto |

Os efeitos dos itens ficam para a próxima etapa, como você decidiu. As perguntas pendentes sobre itens continuam na seção 5 do `RELATORIO_DOC_X_SISTEMA.md` (Ovelha e o Lobo, Olho de Cobra, desgaste de armas, foto do Elmo).
