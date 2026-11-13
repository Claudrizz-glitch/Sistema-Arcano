-- Itens, Fases 2 e 3 (2026-11-15): mecânicas nas propriedades, brilho de 12 s na Espada Carmesim e notas de uso.
update items set properties = properties || v.p from (values
 ('Espada Carmesim', '{"mechanic":"espada_carmesim","implemented":true}'::jsonb),
 ('Estigma do Sem-Pele', '{"mechanic":"estigma","implemented":true}'::jsonb),
 ('Coração Rubro', '{"mechanic":"coracao_rubro","implemented":true}'::jsonb),
 ('Elmo Imortal', '{"mechanic":"elmo_imortal","implemented":true}'::jsonb),
 ('A Ovelha e o Lobo', '{"mechanic":"ovelha_lobo","implemented":true}'::jsonb),
 ('Baú de Mirral', '{"mechanic":"bau_mirral","implemented":true}'::jsonb),
 ('Fio Bifurcado', jsonb_build_object('mechanic', 'fio_bifurcado', 'implemented', true, 'paths', jsonb_build_object(
   'ignea', jsonb_build_array(
     jsonb_build_object('at', 5, 'text', 'A lâmina assume aspecto vulcânico e causa +1d4 de dano em todo contato físico.'),
     jsonb_build_object('at', 50, 'text', 'A lâmina torna-se fervente: queimadura de 2 de dano por 2 turnos a cada perfuração.'),
     jsonb_build_object('at', 250, 'text', 'O usuário torna-se imune a fogo e calor, incluindo efeitos mágicos e ambientais.'),
     jsonb_build_object('at', 300, 'text', 'Coluna de fogo de 30 cm; tudo que o fogo tocar sofre queimadura de 4 por 3 turnos.'),
     jsonb_build_object('at', 350, 'text', 'Perfuração garantida, atravessando armaduras, ossos densos, endurecimentos e defesas físicas.'),
     jsonb_build_object('at', 400, 'text', 'Toda perfuração gera uma explosão interna de 1d10 de dano no ponto de impacto.'),
     jsonb_build_object('at', 450, 'text', 'Fogo eterno: 4 de dano por turno indefinidamente, até intervenção mágica, selamento ou morte.'),
     jsonb_build_object('at', 500, 'text', 'Forma totalmente flamejante: calor e luz solar, velocidade absurda, contato tratado como fogo extremo.')),
   'boreal', jsonb_build_array(
     jsonb_build_object('at', 5, 'text', 'Forma invernal: pode ser invocada de volta indefinidamente. Lançamento com alcance de 10 m.'),
     jsonb_build_object('at', 50, 'text', 'Nuvem de nitrogênio líquido; o usuário torna-se imune a frio, congelamento e efeitos gélidos.'),
     jsonb_build_object('at', 250, 'text', 'Perfuração garantida no lançamento; o alcance aumenta para 30 m.'),
     jsonb_build_object('at', 300, 'text', 'O trajeto gera explosões climáticas com onda de choque de frio em raio de 3 m; alcance de 50 m.'),
     jsonb_build_object('at', 350, 'text', 'Toda a área atravessada pelo trajeto é instantaneamente congelada.'),
     jsonb_build_object('at', 400, 'text', 'Em qualquer ponto da região congelada, pode surgir uma estaca de gelo de até 2 m.'),
     jsonb_build_object('at', 450, 'text', 'O alcance máximo do lançamento aumenta para 100 m.'),
     jsonb_build_object('at', 500, 'text', 'Teleporte instantâneo para junto da adaga, empunhando-a imediatamente.')))))
) as v(n, p) where items.name = v.n and items.campaign_id is null;

update items set description = replace(description, 'O brilho dura 10 segundos', 'O brilho dura 12 segundos (2 turnos)'),
  notes = 'Na ficha: "Ataque básico" reduz a CD de Ruptura em 1 e renova o brilho por 2 turnos; "Ativar Ruptura" compara o d20 com a CD atual (sem piso). Funciona para anões.'
where name = 'Espada Carmesim' and campaign_id is null;

update items set notes = v.n from (values
 ('Fio Bifurcado', 'Na ficha: caminho, acúmulos e almas ficam guardados no punhal. As queimaduras são aplicadas na ficha do alvo, no painel de Sangramento ("Aplicar queimadura").'),
 ('Estigma do Sem-Pele', 'Na ficha: Encapuzar (30 de Mana), Transmutar (20), camadas extras (20 a cada 5 L) com manutenção de 5 de Mana por turno a cada 5 L; sem Mana, as camadas caem.'),
 ('Coração Rubro', 'Na ficha: depois de consumido, o painel calcula o multiplicador pela Vida perdida. O atributo (dano, velocidade ou cura) é escolha do jogador, aplicada pelo Mestre; a troca exige cura ou novo ferimento.'),
 ('Elmo Imortal', 'Na ficha: "Registrar Ponto de Retorno" guarda todas as fichas e o turno; "Retornar" restaura tudo e todos e volta o tempo (até 2 vezes).'),
 ('A Ovelha e o Lobo', 'Na ficha: marcar alvo, iniciar a Caçada (os dois ficam com a média da Vida máxima e do dano por golpe), matar ou cancelar (1d10 de sanidade) e consumir Marcas (+10% permanente).'),
 ('Baú de Mirral', 'Na ficha: "Selar alma" torna a ficha imortal (não pode ser marcada como morta) e guarda os atributos; depois: Novo corpo, Baú aberto ou Baú destruído.')
) as v(name, n) where items.name = v.name and items.campaign_id is null;
