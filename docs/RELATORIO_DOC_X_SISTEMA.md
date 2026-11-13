# Relatório — Doc "Sistema Arcano" × sistema (2026-11-13)

Fonte: versão atual do Google Doc (lida hoje) comparada com o banco de produção (Supabase) e o código.
Nada foi alterado para gerar este relatório.

## 1. O que está no site

| Conteúdo | No doc | No site | Situação |
|---|---|---|---|
| Fauna e flora com criatura nomeada | 11 | 11 | ✅ todas, cada uma no bioma certo |
| Profanos — Periculosidade I | 3 | 3 | ✅ |
| Profanos — Periculosidade II | 8 | 8 | ✅ |
| Profanos — Periculosidade III | 12 | 12 | ✅ |
| Profanos — Periculosidade IV | 20 | 20 | ✅ |
| Profanos — Periculosidade V | 12 | 12 | ✅ |
| Biomas | 11 | 11 | ✅ |
| Itens arcanos | 16 | 16 | ✅ (só o Filho do Sol tem mecânica) |
| Armas / defesas / poções | 5 / 4 / 4 | 5 / 4 / 4 | ✅ dados de dano, AA, penetração, alcance e mitigação conferem |
| Técnicas de manipulação de mana | 6 | 6 + "Chamado" | ⚠ ver divergência 1 |
| Aparatação | 2 | 2 | ✅ |
| Feitiços gerais | 8 | 8 | ✅ |
| Feitiços elementais | 3 | 3 | ✅ |
| Feitiços druídicos | 9 | 9 | ✅ |
| Contratos gerais | 4 | 4 | ✅ |
| Bênçãos | 22 | 22 | ✅ |

**Conclusão:** todos os profanos, itens e feitiços do doc estão no site. Nenhum falta.

## 2. Divergências encontradas (nada foi mudado)

1. **"Chamado" existe no site e não existe no doc.** No site é uma habilidade separada ("invoca o retorno de um objeto… 10 de mana").
   No doc isso é só uma frase dentro de **Lealdade** ("cada chamado custa 10 de mana"). Proposta: remover "Chamado" e deixar só Lealdade.
2. **Ruptura não pode ser concedida.** No site ela está como "regra passiva", porque o doc diz que qualquer humano sob estresse pode
   manifestá-la. Mas as 5 fichas do doc a listam em FEITIÇOS, e a Espada Carmesim depende dela. Proposta: virar feitiço concedível,
   com o aviso "humanos podem manifestar sem treino".
3. **Filho do Sol:** a seção de itens diz "1d10 de dano físico"; a ficha do Adamastor diz "1d10 + 4AA". No site está 1d10, sem AA.
4. **Baralho Arcano:** o doc lista 21 presságios. **A Estrela não tem presságio**, mas existem 22 Arcanos.
5. **Espada Carmesim:** o doc não dá dado de dano (é uma katana). Sem isso ela não tem dano no site.
6. **Fauna com periculosidade no texto:** Gira-Gira (I), Oraqui-Oralá (I), Furanzão (I) e Erumpente (IV) citam periculosidade no
   texto, mas estão como fauna, sem periculosidade no site. Mortalha-Viva ("IV de surpresa, II com preparação") e Acromântula
   ("V em grupo, IV isolada") também têm dois valores; no site ficou o da seção (IV).
7. **Regras de equipamento sem efeito no site:** "Armas cedem a 5× seu dano total base" e "Defesas perdem 1d4 por mitigação e não
   acumulam" aparecem no doc, mas o site não aplica. A primeira frase é ambígua (ver perguntas).
8. **Texto do doc com referências de fora de Arkhavel** (trouxas, bruxos, Inglaterra, Austrália, Ron Weasley, Idade Média). O site
   reproduz fielmente; se quiser adaptar, a mudança é no doc.

## 3. Como cada item arcano mudaria a ficha

Legenda do tipo de mecânica:
**Passiva** = muda a ficha automaticamente enquanto possui/equipa · **Ação** = botão na ficha com custo ·
**Contador** = estado guardado no item (cargas, acúmulos) · **Permanente** = muda raça/corpo de vez · **Narrativo** = só texto.

### 🔮 Orbe de Selamento — Contador + Narrativo
- **Doc:** sela e liberta qualquer ser domesticado; ao libertar, surge num ponto aleatório até 5 m.
- **Na ficha:** lista "Seres selados no orbe" (nome, de onde veio). Botões **Selar** e **Libertar**.
- **Fica com o Mestre:** posição ao libertar, o que é "domesticado".

### 🎭 Máscara da Vitória — Contador
- **Doc:** quem veste tem a aparência do último ser que matou.
- **Na ficha:** campo "Aparência atual: <último ser abatido>". Atualiza quando o Mestre registra um abate (ou ao derrotar
  alguém no combate, se ligarmos ao encontro).

### 👞 Sapato de Escalada — Narrativo
- **Doc:** cria degraus de vidro sob o pé ao fingir subir uma escada.
- **Na ficha:** só aparece como equipado, com a descrição. Sem número.

### 🪙 Moeda do Retorno — Narrativo (+ opcional automático)
- **Doc:** moeda de ouro que aparece no bolso do dono ao amanhecer.
- **Na ficha:** fica no inventário do dono. Opcional: se for tirada da ficha, volta sozinha quando o calendário passar por um amanhecer.

### ⚔️ Espada Carmesim — Contador + Ação (depende da divergência 2 e 5)
- **Doc:** cada ataque básico reduz em 1 o CD de Ruptura com a espada; ao ativar Ruptura, o CD base cai 1 de vez enquanto a lâmina
  brilhar; o brilho dura 10 s (≈ 2 turnos) e renova a cada ataque. A Ruptura vem da espada: **anões podem usá-la**.
- **Na ficha:** "CD de Ruptura atual" e "brilho até o turno X". Botões **Ataque básico** (−1 CD, renova brilho) e **Ativar Ruptura**
  (pede o d20, compara com o CD, aplica dano ×2 como mágico + 2d6 e ignora armadura). Quando o brilho acaba, o CD volta ao base.

### 🃏 Baralho Arcano — Passiva + Ação
- **Doc:** em um momento de escolha, tira 1 carta e vê um presságio. Quem possui: domínio de mana perfeito, aprende **Granada,
  Construtos de Mana e Reforço**, e o **dado de feitos mágicos é sempre 15 + 1d6**.
- **Na ficha:**
  - Ao receber o item: concede os 3 feitiços automaticamente (marcados "pelo Baralho Arcano").
  - Ao conjurar: o site não pede o d20; usa **15 + 1d6** (pode passar de 20).
  - Botão **Tirar carta**: sorteia um dos presságios e registra no histórico. (Falta o presságio da Estrela — divergência 4.)

### 🛡️ Elmo Imortal — Contador + Ação (o mais complexo)
- **Doc:** mitiga 1d20 de ataques físicos na cabeça, perdendo 1d4 por mitigação. Ao entrar em combate registra um Ponto de Retorno;
  se o portador morrer, volta a esse ponto com as memórias, até 2 vezes (3 tentativas). A cada retorno o elmo se renova. Na revanche
  pode usar 1 das 22 bênçãos, mesmo sem tê-la. Aliados que morreram antes dele voltam junto. Destruição do elmo = contrato narrativo.
- **Na ficha:**
  - Defesa "Mitigação atual: 1d20" que cai 1d4 a cada uso e volta ao máximo em cada retorno.
  - Contador "Retornos neste combate: 0/2".
  - Ao iniciar um encontro, o site **salva uma foto** (vida, mana, sanidade, sangramentos) do portador e dos aliados.
  - Botão **Retornar**: restaura essa foto no portador e nos aliados mortos e soma 1 retorno.
  - Campo "Bênção da revanche" (escolhe 1 das 22, vale só naquela tentativa).

### 🏹 A Ovelha e o Lobo — Ação + Contador
- **Doc:** ativa perfurando o próprio peito (contrato irreversível). Marca 1 alvo; a 10 m começa a Caçada (duelo absoluto).
  A vida máxima e o dano máximo por golpe de ambos são divididos igualmente. Matar o alvo coleta a Marca; cancelar perde a marca e
  custa sanidade. Marcas podem ser consumidas para **buff físico permanente de 10% do dano ou da vida** daquela marca. Cada caçada
  aprofunda o vínculo (dor, sanidade, influência do lobo).
- **Na ficha:**
  - Contador "Caçadas realizadas" e lista "Marcas guardadas" (nome, vida, dano).
  - Botão **Consumir marca** → bônus permanente: +10% da vida da marca na Vida máxima, **ou** +10% do dano na rolagem.
    Hoje o site só tem bônus por multiplicação; precisa de **bônus fixo** (ver seção 4).
  - Botão **Cancelar caçada** → perde a marca e tira sanidade (valor a definir).

### 🪓 Filho do Sol — já implementado
- Empunhar: Vida máxima ×2, dados de dano ×2, sem Mana. Sacrificar Vida: a cada 40, +1d4 mágico e esfera +5 cm.
  Largar: maldição "o mais fraco da raça". Falta decidir a divergência 3 (+4AA).
- **Possível ajuste:** o doc diz "×2 força física" — hoje a Força de Massa não dobra.

### 🫀 Coração Rubro — Passiva calculada
- **Doc:** consumido, substitui o coração. A % de vida perdida vira multiplicador em **um** atributo escolhido (dano, regeneração ou
  velocidade): 9% → ×1,2 · 17% → ×1,5 · 34% → ×2 · 50% → ×2,5 · 67% → ×3 · 84% → ×4 · 99% → ×5 (morte iminente).
  Trocar o atributo exige cura ou novo ferimento; cura só no turno seguinte; ferimentos de mesma potência somam ×0,5.
  Fases: I (nv 1–7) só se fere magicamente · II (8–14) sangramento leve −2%/t em 10 m e buff em área (máx. 2×, dividido)
  · III (15–21) −10%/t ao toque e −2%/t em 20 m.
- **Na ficha:** painel com "% de vida perdida", "multiplicador atual" e "atributo escolhido", recalculado sozinho quando a vida muda.
  Fase mostrada pelo nível. Usa o sistema de sangramento que já existe.
  Precisa de multiplicadores **decimais** de dano, regeneração e velocidade (hoje só existe dado ×inteiro).

### 🧰 Baú de Mirral — Permanente
- **Doc:** quem aceita tem a alma selada e fica imortal: sem fome, sono, dor ou colapso vital (ferimentos acontecem, mas não matam).
  Se o corpo for destruído, um ritual liga o baú a um cadáver novo com os mesmos atributos do momento do selamento.
  Baú destruído = alma aniquilada. Baú aberto = corpo novo idêntico e nunca mais é aceito.
- **Na ficha:** selo "Imortal (Baú de Mirral)". Vida 0 **não** leva a "morta"; sangramento de grau 8 não mata.
  O site salva uma foto dos atributos no selamento. Botões do Mestre: **Novo corpo** (restaura a foto), **Baú aberto**
  (restaura e remove a imortalidade, bloqueia novo selamento) e **Baú destruído** (morte definitiva).

### 👁️ Olho de Cobra — Passiva + Ação
- **Doc:** implante permanente. +5 em todos os dados de Carisma. Vê intenções, desejos e culpas. Ativo **Extração de Informação**
  custa vida conforme a diferença de nível: −5 ou mais: 8% · −3/−4: 10% · −1/−2: 12% · mesmo: 15% · +1/+2: 18% · +3/+4: 22% · +5 ou mais: 30%.
- **Na ficha:** não pode ser removido. Botão **Extrair informação**: escolhe o alvo (ficha ou NPC), o site calcula a diferença de nível,
  tira a % de vida e mostra a qualidade ("informação total" … "quase nenhuma").
  **O sistema não tem atributo Carisma** — o +5 vira só uma anotação.

### 🧥 Manto Espectral — Ação contínua
- **Doc:** Invisibilidade 10 mana/s; Intangibilidade 30 mana/s. Ataque ou conjuração ofensiva quebra a invisibilidade;
  sair da intangibilidade em lugar ocupado causa dano grave.
- **Na ficha:** botões **Invisível** e **Intangível** (liga/desliga). Com turno de 6 s: **60** e **180** de mana por turno, descontados
  a cada avanço de turno (igual à absorção do Forjado). Sem mana, desliga sozinho.

### 🗡️ Fio Bifurcado — Contador
- **Doc:** acúmulos são do punhal, não do portador; 1 por alma humana (nunca repete). Dois caminhos exclusivos — trocar zera.
  **Ígnea:** 5 = +1d4 em contato · 50 = queimadura 2/turno por 2 turnos · 250 = imune a fogo · 300 = coluna de fogo, queimadura 4 por 3 turnos ·
  350 = perfuração garantida · 400 = explosão interna 1d10 · 450 = fogo eterno 4/turno · 500 = forma flamejante.
  **Boreal:** 5 = retorno, alcance 10 m · 50 = imune a frio · 250 = perfuração garantida, 30 m · 300 = explosões de frio 3 m, 50 m ·
  350 = congela o trajeto · 400 = estaca de gelo 2 m · 450 = 100 m · 500 = teletransporte até a adaga.
- **Na ficha de quem empunha:** caminho, acúmulos e lista de efeitos desbloqueados. Botão **Registrar alma** (+1, com nome para não repetir).
  Os danos por turno (queimadura, fogo eterno) usam um efeito novo de "dano contínuo" parecido com o sangramento.

### ☠️ Estigma do Sem-Pele — Permanente + Ação
- **Doc:** pele some de vez, dor contínua, cura não recria pele. **Encapuzar** um material: 30 mana. **Transmutação**: 20 mana.
  Camadas extras: 20 mana a cada 5 L e manutenção de 5 mana/turno a cada 5 L.
- **Na ficha:** "Pele atual: <material>", "Litros extras". Botões com os custos; a manutenção é descontada no avanço de turno.
  Resistência da pele depende do material: o Mestre define (pode virar mitigação).

### 🌱 Semente da Natureza — Permanente (quase pronto)
- **Doc:** consumida, converte qualquer raça em Druída Puro.
- **Na ficha:** ao consumir, o site faz a conversão (já existe o botão "Converter em Druída Puro") e concede todos os feitiços druídicos
  (já acontece). Falta só ligar o consumo do item à conversão.

### Itens comuns
- **Poções:** botão **Usar** na ficha (cura 10/50 de vida ou restaura 20/80 de mana) e tira 1 da quantidade. Fácil e útil já.
- **Armas e defesas:** já mostram dano/mitigação. As regras de desgaste (divergência 7) ficam para depois da sua definição.

## 4. Como eu faria a funcionalidade

1. **Cada item ganha uma "receita" de mecânica** (no próprio cadastro do item) dizendo: o que acontece ao receber/consumir,
   o que muda enquanto equipado, quais botões aparecem, quais contadores guarda e o que acontece a cada turno.
   O site lê essa receita e monta o painel do item na ficha — sem código novo por item quando o tipo já existe.
2. **Ampliar os modificadores da ficha:** hoje só existem Vida ×, dados de dano ×(inteiro) e bloquear mana.
   Faltam: multiplicador decimal de dano, de regeneração e de velocidade; **bônus fixo** de vida e de dano; e "rolagem fixa" de
   feitos mágicos (Baralho).
3. **Ações com custo passam pelo banco** (como já é com feitiços): conferem permissão, descontam vida/mana/sanidade, registram no
   histórico e podem ser revertidas.
4. **Efeitos por turno** entram no avanço de turno (manto, estigma, coração rubro, queimaduras).
5. **Ordem sugerida:**
   - Fase 1 (rápida): poções, Semente, Baralho Arcano, Manto Espectral, Olho de Cobra.
   - Fase 2: Espada Carmesim (depois de decidir a Ruptura), Fio Bifurcado, Estigma, Coração Rubro.
   - Fase 3: Elmo Imortal, A Ovelha e o Lobo, Baú de Mirral (precisam de "foto" da ficha e regras de contrato).
   - Orbe, Máscara, Sapato e Moeda: só registro simples, entram junto com a Fase 1.

## 5. Perguntas que preciso que você responda antes de implementar

1. Removo o "Chamado" e transformo a **Ruptura** em feitiço concedível?
2. Filho do Sol: **1d10** ou **1d10 + 4AA**? Ele também dobra a **Força de Massa**?
3. Qual o **presságio da Estrela** no Baralho Arcano?
4. Qual o **dado de dano** da Espada Carmesim?
5. A Ovelha e o Lobo: "a Vida Máxima e o dano máximo por golpe de ambos são divididos igualmente" — os dois ficam com a **média**
   dos dois valores durante o duelo? E quanto de **sanidade** custa cancelar a caçada?
6. Olho de Cobra: a % é da **Vida máxima** ou da **Vida atual**? Carisma vira atributo da ficha ou só anotação?
7. "Armas **cedem** a 5× seu dano total base": a arma quebra depois de causar, no total, 5× o dano base dela?
8. Elmo Imortal: a "foto" do retorno inclui itens consumidos e mana gasta, ou só vida/mana/sanidade?

## 6. Forjado: raça inicial ou só pelo contrato Forjar?

**O que o doc diz:** Forjados são "objetos animados com mana", imunes a feitos mágicos e ao sobrenatural, com Mana = Vida, sangram
mana se ficarem abaixo de 100% por mais de 1 min, absorvem mana e morrem se o núcleo for perfurado. O contrato **Forjar** cria
"vida artificial de nível 1 em um objeto" com o sacrifício de **3 almas** (CD 20). Kael é um Forjado criado pelo Mago.
Hoje, no site, o Forjado **pode ser escolhido** por qualquer jogador ao criar ficha.

**Minha recomendação: não liberar como escolha livre; deixar como origem aprovada pelo Mestre.**
- **Lore:** pelo doc, ninguém *nasce* Forjado. Alguém precisou sacrificar 3 almas para criá-lo. Um jogador Forjado carrega esse
  gancho (quem o forjou? de quem eram as almas?) — isso é ótimo para a história, mas é decisão do Mestre, não do cadastro.
- **Equilíbrio:** imunidade a feitos mágicos e ao sobrenatural é muito forte num mundo cujo maior perigo são profanos e contratos.
  Em troca ele não usa feitiços de cura nem buffs de aliados, e tem a fragilidade do núcleo e da privação de mana. Funciona bem
  quando o Mestre planeja a campanha sabendo que há um Forjado.
- **O site já resolve isso sem regra nova:** com as "fichas de jogador reservadas", o Mestre cria a ficha Forjada e importa para o
  jogador quando aprovar. Só falta **tirar o Forjado da lista de raças do cadastro do jogador** (como já fizemos com o Druída Puro).
- **Bônus opcional:** usar o contrato Forjar dentro do jogo para gerar a ficha (Forjado de nível 1, registrando quem forjou e as 3 almas).
