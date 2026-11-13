-- Fichas de NPC do doc (seção Personagens), decisões do Mestre em 2026-11-14:
-- raça faltante = humano; todos nível 0; todos mortos, exceto o Mago; Arcanos com a própria Bênção Completa;
-- o Mago com todos os feitiços; Kael com as 22 bênçãos fragmentadas (usa 5 por dia).
do $$
declare camp constant uuid := 'f6c37a06-d1b0-4f54-b66d-aae1e4fde7e3'; gm constant uuid := 'b2729a3a-03d5-4f48-80a8-4a10e261ba83'; v uuid; b record;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', gm, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', gm::text, true);
  -- O Mago
  v := create_npc_sheet(camp, $T$O Mago$T$, 'humano', null, 0, $T$Arcano do Mago$T$, '');
  perform gm_edit_sheet(v, jsonb_build_object('portrait_url', '/img/retratos/npc-mago.webp', 'narrative_notes', $T$O mago compreende perfeitamente a magia, dominando todos os feitiços e suas formas e uma eficiencia de mana absurda, despreza contratos e bençãos, se aproveita de seu poder natural que é de onde vem a sua benção que é a eficiencia de mana, reduzindo ou anulando absurdamente os custos, criou feitiços, usados por ele e pelos militares. Há 44 anos, o Mago executou o Grande Selamento dos Arcanos durante um Eclipse. Na época, acreditou que o fenômeno era uma reação da própria natureza ao rompimento da ordem do mundo, uma espécie de punição pelo selamento. Vinte e dois anos depois, um novo Eclipse ocorreu. Dessa vez, preparado para observá-lo, o Mago percebeu que até mesmo ele perdeu temporariamente sua Bênção e que inúmeras manifestações mágicas aconteceram espontaneamente por toda Arkhavel. Após anos de estudo, concluiu que o Eclipse é um ciclo natural em que todas as Bênçãos se desprendem momentaneamente de seus portadores e retornam ao seu estado primordial. Desde então, passou os últimos 22 anos preparando seu plano: quando o próximo Eclipse acontecer, daqui a 22 dias, ele libertará os Arcanos selados, impedirá que recuperem suas Bênçãos e tentará reivindicar todas elas no instante de maior instabilidade, alcançando a perfeição que buscou durante toda a vida.$T$));
  perform grant_blessing(v, (select id from blessings where name = $T$O Mago$T$ and campaign_id is null), 'Arcano: Bênção Completa', false, true);
  insert into character_spells(character_id, spell_id, note) select v, s.id, 'O Mago domina todos os feitiços' from spells s where s.campaign_id is null and s.kind = 'feitico' and s.status = 'published' on conflict do nothing;
  -- Kael
  v := create_npc_sheet(camp, $T$Kael$T$, 'forjado', null, 0, $T$Cavalheiro do Rei Milo Vetra$T$, '');
  perform gm_edit_sheet(v, jsonb_build_object('portrait_url', '/img/retratos/npc-kael.webp', 'narrative_notes', $T$Kael, Cavalheiro do Rei Milo Vetra, de sequência 19, um ser ingênuo de poder absurdo, imune a dano mágico, é um Forjado, uma forma de vida artificial criada pelo Mago a partir do cadáver de um homem. Diferente dos demais Forjados, que normalmente são objetos animados, Kael foi concebido para aparentar ser um ser humano. Criado há apenas três anos, acredita ser um jovem nobre que sobreviveu a um acidente responsável por sua amnésia. Sua personalidade, memórias e trajetória foram cuidadosamente planejadas para fazê-lo desenvolver um caráter virtuoso e tornar-se digno das Bênçãos. Seguindo as orientações da Capital, Kael percorreu todas as Igrejas de Arkhavel e realizou os rituais de cada Bênção. Enquanto um indivíduo comum pode ancorar permanentemente apenas cinco Bênçãos, Kael revelou uma afinidade única, sendo capaz de alternar entre qualquer uma das vinte e duas Bênçãos existentes, respeitando o limite de cinco Bênçãos ativas simultaneamente e as restrições individuais de cada uma. Essa característica faz parte do plano do Mago. Como as Bênçãos procuram naturalmente o indivíduo mais novo e mais digno quando ficam sem portador, Kael foi criado para se tornar o receptáculo ideal. Durante o Eclipse Arcano, após a morte dos Arcanos, todas as Bênçãos tenderiam a convergir para sua alma. Desde sua criação, runas ocultas foram gravadas em seu corpo pelo Mago. Permanecendo inativas por três anos, essas marcas foram projetadas para reagir ao Eclipse Arcano, induzindo Kael a um estado de inconsciência profunda. Nesse momento, o Mago pretende utilizar o Salto de Fé para transferir permanentemente sua consciência ao corpo de Kael, reprimindo sua mente sem destruir sua alma. A permanência da alma de Kael é indispensável, pois ela é a verdadeira âncora reconhecida pelas Bênçãos, permitindo que todas convirjam para seu corpo durante o Eclipse.$T$));
  for b in select id from blessings where campaign_id is null and not is_extra loop perform grant_blessing(v, b.id, 'Kael alterna entre as 22 bênçãos (até 5 por dia, respeitando o cooldown de cada uma)', true, false); end loop;
  perform gm_edit_sheet(v, jsonb_build_object('special_combat_notes', 'Possui as 22 bênçãos fragmentadas, mas só usa até 5 por dia (escolhidas durante o combate) e respeita o cooldown de cada uma. Imune a dano mágico.'));
  perform transition_sheet(v, 'morta');
  -- O Morte
  v := create_npc_sheet(camp, $T$O Morte$T$, 'druida', null, 0, $T$Arcano da Morte · druída bestial de ovelha$T$, '');
  perform gm_edit_sheet(v, jsonb_build_object('portrait_url', '/img/retratos/npc-morte.webp', 'narrative_notes', $T$O Morte é Um druída bestial de ovelha, exilado por sua tribo, criou um profano, se tornou a encarnação da morte, encerrando ciclos, podia ver quando todos estavam perto da morte, e sua principal habilidade era encerrar acontecimentos antes de acontecerem, dessa forma manipulava a causalidade pra adiantar essa visão, um caçador imparável, não pôde ver a própria marca e foi punido pela causalidade$T$));
  perform grant_blessing(v, (select id from blessings where name = $T$A Morte$T$ and campaign_id is null), 'Arcano: Bênção Completa', false, true);
  perform transition_sheet(v, 'morta');
  -- O Força
  v := create_npc_sheet(camp, $T$O Força$T$, 'humano', null, 0, $T$Arcano da Força · príncipe da família Vetra$T$, '');
  perform gm_edit_sheet(v, jsonb_build_object('portrait_url', '/img/retratos/npc-forca.webp', 'narrative_notes', $T$O Força é um Humano sem magia alguma, o príncipe da família Vetra, ele deu poder a sua família e foi traído por ela quando os arcanos começaram a se dividir, em uma punição de seu invejoso irmão foi colocado em uma armadura que o torturava constantemente e foi exilado para longe da capital, viveu ajudando vilas afastadas, até a chegada dos Arcanos Torre, Enamorados, Morte e Louco, que queriam a ajuda dele pra selar os outros Arcanos, ele se revoltou com a ideia e disse que ia avisar os outros e os proteger, os Arcanos então se juntaram pra matar ele, em um confronto que gerou a destruição de toda a vila, 3 arcanos morreram, e o Força foi selado pelo Louco, o único sobrevivente. a vila então se tornou a igreja da força, com a criação da benção, usa uma arma, o arsenal da familia vetra, pode se transformar em qualquer objeto no arsenal do castelo, na luta, enamorados inutilizou o arsenal mesmo após decapitado, então na cena que tirarem o força do selo, ele lutará usando sua espada clássica apenas de forma defensiva, sem revelar que não dá dano$T$));
  perform grant_blessing(v, (select id from blessings where name = $T$A Força$T$ and campaign_id is null), 'Arcano: Bênção Completa', false, true);
  perform transition_sheet(v, 'morta');
  -- O Torre
  v := create_npc_sheet(camp, $T$O Torre$T$, 'anao', 'ogro', 0, $T$Arcano da Torre · ogro de 3 metros$T$, '');
  perform gm_edit_sheet(v, jsonb_build_object('portrait_url', '/img/retratos/npc-torre.webp', 'narrative_notes', $T$O Torre é um ogro de 3 metros que causa colapso com sua presença, ruína encarnada, desestabiliza todas as defesas e estruturas$T$));
  perform grant_blessing(v, (select id from blessings where name = $T$A Torre$T$ and campaign_id is null), 'Arcano: Bênção Completa', false, true);
  perform transition_sheet(v, 'morta');
  -- Enamorados
  v := create_npc_sheet(camp, $T$Enamorados$T$, 'humano', null, 0, $T$Arcana dos Enamorados$T$, '');
  perform gm_edit_sheet(v, jsonb_build_object('portrait_url', '/img/retratos/npc-enamorados.webp', 'narrative_notes', $T$Enamorados, uma mulher sedutora que força devoção, roubando poderes e inutilizando original$T$));
  perform grant_blessing(v, (select id from blessings where name = $T$Os Enamorados$T$ and campaign_id is null), 'Arcano: Bênção Completa', false, true);
  perform transition_sheet(v, 'morta');
  -- O Julgamento
  v := create_npc_sheet(camp, $T$O Julgamento$T$, 'druida', 'centauro', 0, $T$Arcano do Julgamento · centauro$T$, '');
  perform gm_edit_sheet(v, jsonb_build_object('portrait_url', '/img/retratos/npc-julgamento.webp', 'narrative_notes', $T$O julgamento é um centauro, seu compasso moral é diferente, pouco se importa com os humanos, e a punição de sua benção segue seu compasso moral, máximo de dano da sua benção é 10d20, que é agredir um unicórnio$T$));
  perform grant_blessing(v, (select id from blessings where name = $T$O Julgamento$T$ and campaign_id is null), 'Arcano: Bênção Completa', false, true);
  perform transition_sheet(v, 'morta');
  -- O Louco
  v := create_npc_sheet(camp, $T$O Louco$T$, 'humano', null, 0, $T$Arcano do Louco$T$, '');
  perform gm_edit_sheet(v, jsonb_build_object('portrait_url', '/img/retratos/npc-louco-1.webp', 'narrative_notes', $T$Louco tem locomoção livre, pode navegar o espaço de forma não euclidiana e recusa a morte e prisões convencionais, o único jeito de vencer o louco é o tapeando em um contrato, protege sua igreja$T$));
  perform grant_blessing(v, (select id from blessings where name = $T$O Louco$T$ and campaign_id is null), 'Arcano: Bênção Completa', false, true);
  perform transition_sheet(v, 'morta');
end $$;
