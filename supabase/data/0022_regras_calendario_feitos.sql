-- Tópicos de regra "Calendário" e "Teste de Feitos Mágicos" (decisões do Mestre, 2026-11-14), espelhando o doc.
insert into rule_topics (campaign_id, slug, title, body_md, sort_order, status) values
(null, 'calendario', 'Calendário', $T$Os anos são contados desde o **Clube de Tarot e a criação da Capital** (ano 0).

- O ano começa no **Inverno**, seguido de Primavera, Verão e Outono. Cada estação tem **90 dias**.
- O **Grande Eclipse** acontece a cada 22 anos, no 1º dia da Primavera: anos 0, 22, 44…
- A campanha atual se passa no **ano 44** e começou no dia 69 do Inverno, a exatamente 22 dias do Eclipse.
- Um turno dura **6 segundos**.$T$, 2, 'published'),
(null, 'teste-de-feitos-magicos', 'Teste de Feitos Mágicos', $T$Antes de conjurar qualquer feitiço, o personagem rola **1d20**.

- **Na CD do feitiço ou acima:** o feitiço sai limpo, pelo custo normal de mana.
- **Abaixo da CD:** os efeitos são deturpados e o custo de mana aumenta proporcionalmente, até **2× o custo quando se tira 1 no dado**.
- Quanto mais perto de 20, mais limpo e bem executado é o feitiço.
- Profanos somam **+5** ao resultado (vantagem em feitos mágicos).

Druídas comuns usam apenas feitiços druídicos harmônicos e a manipulação de mana; Druídas Puros podem usar qualquer feitiço. Todo ser, exceto os anões, já nasce com **Ruptura** como liberação passiva.$T$, 3, 'published');
update rule_topics set sort_order = sort_order + 1 where campaign_id is null and slug in
  ('combate-e-regras-gerais', 'sistema-de-sangramento', 'forca-e-forca-de-massa', 'movimentacao-e-velocidade', 'equipamentos-e-desgaste');
