-- Os cards fixos da página /regras viram tópicos editáveis (rule_topics), publicados para todos.
-- Texto do doc "Sistema Arcano" (seções Mapa, Economia, Combate, Força, Movimentação e Inventário).
insert into rule_topics (campaign_id, slug, title, body_md, sort_order, status) values
(null, 'mapa-de-arkhavel', 'Mapa de Arkhavel', $T$![Mapa do continente de Arkhavel](/img/mapa-arkhavel.webp)

Arkhavel é um reino gigantesco, uma verdadeira ilha continental. Seu território é cortado por inúmeros rios e lagos, enquanto o mar que o cerca é conhecido como **Águas de Gander**.

As Águas de Gander são perigosas, habitadas por antigos profanos. Os poucos que se aventuram por suas águas geralmente encontram apenas as ilhas catalogadas próximas a Arkhavel. Cada uma dessas ilhas possui um posto do reino.

A Capital está localizada no centro da ilha. Ao seu redor, distribuídas pelo território, encontram-se as **22 Igrejas**, cada uma representando um Arcano do baralho de Tarot.

Nas regiões mais afastadas encontram-se as montanhas dos anões, as florestas dos druídas e diversos vilarejos espalhados pelo reino.

### Povos e regiões
- **Humanos:** predominam nos vilarejos e nas regiões próximas à Capital. Alguns assentamentos são protegidos por Igrejas e por seus devotos mais poderosos.
- **Druídas:** vivem escondidos em florestas densas, organizados em santuários isolados da sociedade.
- **Anões:** habitam regiões de difícil acesso aos humanos, aproveitando sua resistência superior. Não são necessariamente oprimidos; historicamente, vivem tranquilamente em suas próprias tribos, sem grandes ambições expansionistas.

### Particularidades das Igrejas
- **Igreja do Louco:** não possui uma sede fixa. É formada por um grupo nômade de fiéis.
- **Igreja do Mago:** ocupa uma região inacessível, sem construções. Trata-se de uma falha onde a natureza é instável e mortal, de onde surgem profanos constantemente.
- **Igreja da Força:** corresponde a uma antiga vila destruída durante a morte do Arcano da Força. Seus sobreviventes e descendentes são profundamente devotos a ele.

### Profanos
Os profanos se esgueiram por diversas regiões do reino, principalmente nas áreas mais afastadas da Capital. Procuram sobretudo humanos.

### Estrutura militar da Capital
| Escola | Função e características |
|---|---|
| **Guarda** | Responsável por rondas, vigílias e pequenos delitos. Possui treinamento inferior às demais escolas. |
| **Militar** | Protege os interesses da Capital e da Família Real. Reúne os indivíduos mais capacitados. |
| **Caça** | Explora regiões distantes e enfrenta profanos com maior frequência. Seus integrantes são extremamente experientes; os de destaque são selecionados para a Militar. |

A maioria dos itens mágicos e dos feitiços existentes está sob controle da Capital.$T$, 1, 'published'),

(null, 'economia-e-moedas', 'Economia e Moedas', $T$### Sistema monetário
| Moeda | Conversão | Valor de referência |
|---|---|---|
| **Ouro** | 1 ouro = 10 pratas | R$ 500 |
| **Prata** | 1 prata = 10 bronzes | R$ 50 |
| **Bronze** | 1 bronze | R$ 5 |

Todas as moedas pesam 10 gramas e são cunhadas com uma assinatura da Família Vetra e uma numeração de identificação.

### Preços de referência
| Produto ou serviço | Preço em Arkhavel | Valor de referência |
|---|---|---|
| Refeição simples | 2–5 bronzes | R$ 10–25 |
| Estalagem comum | 5–10 bronzes | R$ 25–50 |
| Arma simples | 5–10 pratas | R$ 250–500 |
| Armadura leve | 15–30 pratas | R$ 750–1.500 |
| Poção comum | 1 ouro | R$ 500 |
| Item mágico raro | 5 ouros ou mais | R$ 2.500 ou mais |$T$, 2, 'published'),

(null, 'combate-e-regras-gerais', 'Combate e Regras Gerais', $T$- **Sanidade inicial:** 30.
- **Regeneração:** Vida +1 por turno · Mana +1 por turno.
- **Prioridade de resolução:** Contratos → Bênçãos → Feitiços → Ataques Físicos.
- **Combate:** estado narrativo imposto pelo Mestre quando há uma ameaça externa e não consensual, na qual existe risco irreversível real.
- **Regra do 20 natural:** dados de acerto que resultem em 20 natural sempre maximizam o dano, independentemente do resultado normal dos dados de dano.

### Cristais de Evolução
Artefatos capazes de registrar a Experiência (XP) de seus portadores. Ao acumular a quantidade necessária de XP, o cristal atua como uma chave, permitindo a ascensão ao próximo nível e o desenvolvimento natural do corpo e da mana.

Os mortais podem evoluir até o Nível 21. Acima dele existe apenas o **Nível 0**, um estado transcendental que duplica todos os atributos e status de seu portador. O número de indivíduos de Nível 0 existentes no mundo é limitado.

- **XP para subir de nível:** 50 × nível atual
- **XP por derrotar uma criatura:** 20 × nível + 25 × 2^(Periculosidade − 1)

**Periculosidade:** é diretamente proporcional ao poder de uma maldição. Por se tratar de um contrato, existe uma recompensa adicional de XP. Unicórnios não concedem XP.

### Dano de queda
**Dano de queda** = 1dH, onde H é a altura da queda em metros. Exemplo: uma queda de 5 metros causa 1d5 de dano.$T$, 3, 'published'),

(null, 'sistema-de-sangramento', 'Sistema de Sangramento', $T$O sangramento representa a perda progressiva de vida causada por ferimentos. A porcentagem indicada é descontada da Vida máxima do personagem a cada turno.

| Gravidade do ferimento | Perda por turno |
|---|---|
| Arranhões na pele e cortes leves superficiais | −1% da Vida |
| Cortes leves em músculos, atingindo pequenos vasos | −2% da Vida |
| Cortes moderados em músculos, atingindo vasos médios | −3% da Vida |
| Cortes profundos em músculos principais, atingindo grandes vasos periféricos | −4% da Vida |
| Perfurações no tronco ou abdômen, atingindo órgãos leves | −5% da Vida |
| Ferimentos graves com múltiplos órgãos atingidos ou grandes vasos rompidos | −10% da Vida |
| Colapso estrutural crítico, com ruptura de grandes vasos centrais | −15% da Vida |
| Dano extremo com destruição massiva de estruturas vitais centrais | **Morte iminente** |

Ataques que provocam inconsciência imediata (perfurações no cérebro e outros danos que incapacitem instantaneamente o personagem) não estão incluídos nesta tabela.$T$, 4, 'published'),

(null, 'forca-e-forca-de-massa', 'Força e Força de Massa (FM)', $T$Todos os personagens começam com **4 pontos de Força de Massa (FM)**, exceto os profanos, que começam com 1 ponto.

### Progressão da Força de Massa
| Espécie | Progressão |
|---|---|
| Humanos | +1 FM a cada 3 níveis |
| Anões | +1 FM a cada nível |
| Druídas | +1 FM a cada 2 níveis |
| Profanos | +1 FM a cada 4 níveis |

### Categorias de Força de Massa
| Categoria | Exemplos | FM |
|---|---|---|
| Muito leve | Flecha, faca | 1 |
| Leve | Espada, criança | 2 |
| Médio | Humano adulto | 4 |
| Pesado | Cavalo, ogro | 8 |
| Muito pesado | Elefante, carroça | 16 |
| Colossal | Prédio, golem gigante | 32 |

### Multiplicadores de dano por aceleração
| Tipo de impacto | Dano |
|---|---|
| Arremesso | FM × 2 |
| Queda de até 5 metros | FM × 4 |
| Projétil | FM × 8 |
| Mach 1 ou superior | FM × 10 |

### Dano de explosões
| Intensidade | Dano |
|---|---|
| Pequena | 1d10 |
| Média | 1d20 |
| Grande | 1d20 + 1d10 |
| Massiva | 2d20 |
| Catastrófica | 3d20 |$T$, 5, 'published'),

(null, 'movimentacao-e-velocidade', 'Movimentação e Velocidade', $T$A velocidade-base (**V**) começa em 1 m/s e aumenta em 1 m/s a cada 4 níveis.

| Movimento | Velocidade máxima | Características |
|---|---|---|
| **Mover** | 1 × V | Movimento normal |
| **Correr** | 2 × V | Impõe penalidades defensivas |
| **Sprint** | 3 × V | Consome a ação completa e gera fadiga |

### Modificadores de terreno e condição
- Terreno difícil, carga pesada ou personagem debilitado: **0,5 × V**.
- Euforia, pico de poder ou terreno favorável: **2 × V**.$T$, 6, 'published'),

(null, 'equipamentos-e-desgaste', 'Equipamentos e Desgaste', $T$### Desgaste
- **Armas cedem a 5× seu dano total base.**
- **Defesas perdem 1d4 por mitigação e não acumulam.**

### Armas
| Arma | Dano | Extra |
|---|---|---|
| Adaga | 1d4 + 2AA | 10 de penetração |
| Espada Longa | 1d6 + 3AA | — |
| Machado de Batalha | 1d10 + 4AA | — |
| Lança | 1d6 + 3AA | 20 de penetração · alcance de 10m |
| Arco | 1d4 + 2AA | 5 de penetração · alcance de 30m |

### Defesas
| Defesa | Mitigação |
|---|---|
| Couro | 1d4 |
| Cota de Malha | 1d6 |
| Placas | 1d10 |
| Escudo | 1d20 |

### Poções
| Poção | Efeito |
|---|---|
| Vida Menor | Cura 10 de Vida |
| Vida Maior | Cura 50 de Vida |
| Mana Menor | Restaura 20 de Mana |
| Mana Maior | Restaura 80 de Mana |

O sangue de um único unicórnio, coletado e refinado por 10 horas, produz o equivalente a **seis Poções de Vida Maiores**. Refinado pelo dobro do tempo, produz o equivalente a **três Poções de Mana**.$T$, 7, 'published')
on conflict do nothing;
