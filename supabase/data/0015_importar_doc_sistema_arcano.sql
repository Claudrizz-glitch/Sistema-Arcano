-- Importação do documento oficial "Sistema Arcano" para a campanha "O Eclipse".
-- Requer a migração 0014. Executa as RPCs como o Mestre (para valerem as mesmas regras do site).
-- Fonte: seções "(FICHAS DE JOGADOR PARA IMPORTAÇÃO)", "Roteiro" e "Notas" do doc (datas já corrigidas: 69/71/72 de Inverno).
do $$
declare
  camp constant uuid := 'f6c37a06-d1b0-4f54-b66d-aae1e4fde7e3';
  gm   constant uuid := 'b2729a3a-03d5-4f48-80a8-4a10e261ba83';
  v uuid; ci uuid;
  s text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', gm, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', gm::text, true);

  -- Calendário: a campanha começa no dia 69 do Inverno; o tempo já jogado (sessões dos dias 69 e 71) leva ao amanhecer do dia 72.
  -- start_seconds_of_day = 3 dias + 06:00 − (turno atual × 6 s), para que a data atual seja 72 de Inverno, 06:00.
  update campaigns set calendar_config = jsonb_set(jsonb_set(calendar_config, '{start,day}', '69'),
    '{start_seconds_of_day}', to_jsonb(3 * 86400 + 6 * 3600 - current_turn * turn_seconds)) where id = camp;

  -- ===== Adamastor =====
  v := create_npc_sheet(camp, 'Adamastor, o grande', 'anao', null, 6, '68 anos, Barbudo ruivo, Bêbado errante', '');
  perform gm_edit_sheet(v, jsonb_build_object('portrait_url', '/img/retratos/adamastor.webp', 'reach_m', 1,
    'narrative_notes', $T$Faço parte de uma mineradora, até que um dia um cara exterminou os trabalhadores da mina por um suposto item que o líder da mineradora tinha (uma moeda de ouro brilhante).
Na minha juventude eu fui em um prostíbulo de súcubos, e descobri no momento que era um prostíbulo de súcubos trans, desde então eu tenho problemas com a espécie.$T$));
  perform grant_blessing(v, (select id from blessings where name = 'A Força'), 'Ficha do doc');
  perform grant_item(v, (select id from items where name = 'Filho do Sol'), 1, 'Ficha do doc');
  select id into ci from character_items where character_id = v and item_id = (select id from items where name = 'Filho do Sol');
  perform wield_item(ci, true);
  perform add_xp(v, 50, 'Ficha do doc');
  perform set_resources(v, 128, null, 30, 'Estado da ficha no doc');
  perform set_player_template(v, true);

  -- ===== Jorge =====
  v := create_npc_sheet(camp, 'Jorge', 'humano', null, 5, 'Loiro de bigode, carpinteiro charlatão', '');
  perform gm_edit_sheet(v, jsonb_build_object('portrait_url', '/img/retratos/jorge.webp', 'reach_m', 1));
  foreach s in array array['Égide','Lealdade','Ruptura','Restrição','Espinhos'] loop
    begin perform grant_spell(v, (select id from spells where name = s), 'Ficha do doc');
    exception when others then raise notice 'Jorge — feitiço % não concedido: %', s, sqlerrm; end;
  end loop;
  perform grant_item(v, (select id from items where name = 'Lança'), 1, 'Ficha do doc');
  select id into ci from character_items where character_id = v and item_id = (select id from items where name = 'Lança');
  perform set_equipped(ci, true);
  perform grant_item(v, (select id from items where name = 'A Ovelha e o Lobo'), 1, 'Ficha do doc');
  perform set_resources(v, 15, 55, 10, 'Estado da ficha no doc');
  perform set_player_template(v, true);

  -- ===== Barbosa =====
  v := create_npc_sheet(camp, 'Barbosa', 'profano', null, 5, 'Cadáver com cabeça de abóbora, demônio errante', '');
  perform gm_edit_sheet(v, jsonb_build_object('portrait_url', '/img/retratos/barbosa.webp', 'reach_m', 1, 'inventory_text', '- Livro de arcanismo básico',
    'narrative_notes', $T$Não gostou do guarda causar confusão na taverna e participou do linchamento, profano com apenas memórias de 5 anos, acredita ter causado um ataque na vila das flores$T$));
  foreach s in array array['Égide','Lealdade','Ruptura','Restrição','Espinhos'] loop
    begin perform grant_spell(v, (select id from spells where name = s), 'Ficha do doc');
    exception when others then raise notice 'Barbosa — feitiço % não concedido: %', s, sqlerrm; end;
  end loop;
  perform grant_contract(v, 'Colheita Sombria', $T$Sua forma natural é a de um espantalho com uma cabeça de abóbora. Caso alguém arranque essa abóbora, será imediatamente decapitado, e a abóbora substituirá sua cabeça, passando a controlar seu cadáver como um novo hospedeiro. Enquanto isso, uma nova abóbora crescerá no espantalho original.
Caso o cadáver controlado pela abóbora se torne inutilizável, um novo espantalho crescerá para servir de hospedeiro à abóbora. Ela poderá, então, ser novamente arrancada, reiniciando o ciclo.$T$, null, 'inato');
  perform grant_item(v, (select id from items where name = 'Lança'), 1, 'Ficha do doc');
  select id into ci from character_items where character_id = v and item_id = (select id from items where name = 'Lança');
  perform set_equipped(ci, true);
  perform grant_item(v, (select id from items where name = 'Olho de Cobra'), 1, 'Ficha do doc');
  perform set_resources(v, 14, 25, 25, 'Estado da ficha no doc');
  perform set_player_template(v, true);

  -- ===== Maxssimus (Lobisomem convertido em Druída Puro pela Semente da Natureza) =====
  v := create_npc_sheet(camp, 'Maxssimus Décimos Meridios', 'druida', 'lobisomem', 5, 'Exilado da alcateia, Ascendido de passado vergonhoso', '');
  perform convert_progression(v, 'druida_puro');
  perform gm_edit_sheet(v, jsonb_build_object('portrait_url', '/img/retratos/maxssimus.webp', 'reach_m', 1,
    'narrative_notes', $T$Aos 27 era o líder e tinha uma esposa, mas ele descumpriu a principal regra de el alcateia, abandonou sua esposa no meio de uma invasão e foi expulso$T$));
  foreach s in array array['Sopro Curativo','Voz da Natureza','Olhos da Floresta','Passos Silvestres','Benção Verdejante','Transformação Total','Transformação Parcial','Aspecto Elementar','Égide','Lealdade','Ruptura','Restrição','Espinhos'] loop
    begin perform grant_spell(v, (select id from spells where name = s), 'Ficha do doc');
    exception when others then raise notice 'Maxssimus — feitiço % não concedido: %', s, sqlerrm; end;
  end loop;
  perform grant_item(v, (select id from items where name = 'Semente da Natureza'), 1, 'Consumida: converteu em Druída Puro');
  perform set_resources(v, 14, 60, 30, 'Estado da ficha no doc');
  perform set_player_template(v, true);

  -- ===== Rumpelstiltskin =====
  v := create_npc_sheet(camp, 'Rumpelstiltskin', 'profano', null, 5, 'Demônio travesso e curioso', '');
  perform gm_edit_sheet(v, jsonb_build_object('portrait_url', '/img/retratos/rumpelstiltskin.webp', 'reach_m', 0.5,
    'narrative_notes', $T$Vaga pelo mundo desde que suas memorias lhe permitem lembrar em busca de algo ou alguem parecido com si mesmo$T$));
  foreach s in array array['Égide','Lealdade','Ruptura','Restrição','Espinhos'] loop
    begin perform grant_spell(v, (select id from spells where name = s), 'Ficha do doc');
    exception when others then raise notice 'Rumpelstiltskin — feitiço % não concedido: %', s, sqlerrm; end;
  end loop;
  perform grant_contract(v, 'Perigo dobrado', 'Todas as interações de dano com Rumpelstiltskin recebem multiplicador 2', null, 'inato');
  perform grant_item(v, (select id from items where name = 'Coração Rubro'), 1, 'Ficha do doc');
  perform set_resources(v, 14, 25, 30, 'Estado da ficha no doc');
  perform set_player_template(v, true);

  -- ===== Roteiro → anotação privada do Mestre por dia =====
  insert into day_notes (campaign_id, year, season_index, day, visibility, content, updated_by) values
  (camp, 1, 3, 69, 'privada', $T$## 1ª sessão — 69 de Inverno
Foco em achar 2 dos 5 itens arcanos e subir até o lvl 3, introdução da briga de bar que gerou na morte de um soldado, 5 foram pegos pra exemplo e seriam executados na capital, até que o barão vellorian pagou a fiança deles, e o levou para a mansão, o motivo era muito simples, ele estava morrendo, desprezava seus herdeiros, todos os guardas na mansão são vigias dos filhos ingratos, ele desde que os 5 entram em sua biblioteca fica concentrado escrevendo em uma folha de papel, entrega, dita os puzzles e fala pra correrem pela janela, dentro da mansão era um território de não agressão, fora os guardas ao perceberem a movimentação estranha vão atacar, os guardas são lvl 1, escola de guardas, baixíssima patente, tem 15 no total, 5 dentro da mansão e 10 no terreno, o barão deve entregar 3 sinos pro grupo, os sinos devem ser pendurados no gazebo e tocados na ordem de pureza dos metais, o mausoleu tem na parede a escultura de um homem, deve-se sussurrar “arcano da força” no ouvido dele para que se abra, o labirinto começa com uma curva pra esquerda, então se abre, dois corredores, com uma pilastra de pássaro no meio, ao errar a sequencia dá de cara com a pilastra novamente, quando acerta, vê a saída do labirinto, então deve voltar, verá a pilastra com uma sala fechada, e no lugar do pássaro o item, a ordem é corredor da esquerda-direita-direita

![Mapa da mansão](/img/roteiro/sessao1-mansao.webp)

![Cenário](/img/roteiro/sessao1-cenario.webp)$T$, gm),
  (camp, 1, 3, 71, 'privada', $T$## 2ª sessão — 71 de Inverno
Em uma carruagem pilotada pelo anão em um dragão de terra, o grupo trilha em direção a igreja da força, no caminho encontram pelúcios e estudam e acolhem os animais
os goblins se irritam e vão cobrar eles
A família Vellorian acobertou os acontecimentos da noite passada, um ataque brutal atrasaria a transferência de herança, chamaram dois guardas da exploração pra recuperar os itens, seus nomes são gaus e noah, lvl 5, possuem a benção da lua,  e da roda da fortuna, a espada de crítico (reseta ao critar)  e o tapete da ilha das dunas (voo a velocidade padrão em altura de 20m) e conhecem um feitiço de aparatação incompleta, 25 de mana pra se teleportar pra um resquício de sangue, gastando o resquício, lucian, bispo da igreja da força vai falar sobre esses dois guardas
na trilha até a vila há um pogrebin, um alp e um trio de goblins que usam pelúcios
na vila da força há um Nachzehrer atormentando a familia dias, familia importante da vida da força, familia grande, acolhedora, adotaram muita gente, tudo começou com a morte de daniel, um filho rebelde que foi brutalizado por um profano
Eles resolveram a maldição do Nachzehrer, Adamastor o grande conseguiu a benção da força, mataram os dois guardas de exploração, e massacraram o grupo de carpinteiros que estava na festa do gnomo, agora os moradores da vila estão assustados, escondidos no casarão da familia Dias, no amanhecer do dia 72 de inverno, frente aquela chacina, a porta da igreja se abre e Lucian está pronto pra enfrentar estes terroristas, no dia do festival do gnomo,$T$, gm)
  on conflict (campaign_id, year, season_index, day, visibility) do nothing;

  -- ===== Notas → anotações gerais do Mestre =====
  insert into master_notes (campaign_id, author_id, title, content, tags) values (camp, gm, 'Notas do Sistema Arcano (doc)', $T$**Bênçãos e Autoridades:** Cada Arcano é o portador de uma **Bênção Completa**, acompanhada da **Autoridade Natural**, que lhe concede domínio sobre esse poder e a capacidade de conceder ou retirar seus fragmentos. O Mago, incapaz de reproduzir essa Autoridade, criou a **Autoridade Artificial**, um ritual que adiciona ao portador a capacidade de conceder **Bênçãos Fragmentadas** e uma hipnose que o submete aos pactos da Capital. Os portadores dessa Autoridade são chamados de **Bispos**. Em regra, apenas quem desperta naturalmente uma Bênção Completa pode tornar-se Bispo, com exceção da **Força**, cuja Igreja canaliza um fluxo natural de fragmentos mesmo sem possuir a Bênção Completa.

Uma Benção Fragmentada tem seu uso muito limitado e padronizado, a Benção Completa pode se desenvolver e ser modelada para atingir uma forma final, sendo diretamente proporcional com maestria e habilidade

Os profanos são o maior perigo desse mundo desde sempre, são separados em níveis de periculosidade, existem alguns simplesmente muito poderosos que foram derrotados pelo clube de tarot, desde então a familia vetra domina arkhavel com mãos de ferro, abominam magia que não podem controlar, os guardas são humanos especializados em lidar com profanos e gente das igrejas, que tentam fazer magia de forma não regular, eles estão por trás do pacto de selamento

As ilhas são grandes profanos domesticados, limitam a saída do território de Arkhavel

Muitos Profanos simplesmente fugiram na época do clube de tarot, e retornaram quando os humanos não eram mais tão poderosos

Nem mesmo o mago suspeita sobre a suficiência de Arkhavel, a existência de terras fora de Arkhavel e as Ilhas serem fronteiras é um segredo dos Vetra que negociaram com navegadores, Arkhavel é na verdade Antartida no século XVI, o destino de Arkhavel é uma grande guerra que trará gelo e obliteração total, o custo pra selar completamente o poder das bençãos, enterrando toda a magia que um dia pisou ali, domesticando e estabilizando essa força incontrolável

A benção do diabo em forma final tem a habilidade de sofismo, qualquer poder que o oponente ou aliado acreditar que ele possa usar, ele consegue usar enquanto essa crença for mantida

a benção do temperança na forma final permite viver duas possibilidades simultâneas de realidade, e ao final escolher qual realidade será a verdadeira

a benção do louco na forma final consegue locomover a alma livremente pelo espaço, enxergando o mundo de forma não euclidiana, e encarnando sua aparência da forma que seus sentimentos estão$T$, array['doc','lore']);
end $$;
