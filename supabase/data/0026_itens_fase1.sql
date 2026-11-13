-- Itens, Fase 1 (2026-11-14): mecânicas nas propriedades dos itens, regra de desgaste e decisões do Mestre.
update items set properties = properties || v.p from (values
 ('Poção de Vida Menor', '{"mechanic":"pocao","heal":10}'::jsonb),
 ('Poção de Vida Maior', '{"mechanic":"pocao","heal":50}'::jsonb),
 ('Poção de Mana Menor', '{"mechanic":"pocao","mana":20}'::jsonb),
 ('Poção de Mana Maior', '{"mechanic":"pocao","mana":80}'::jsonb),
 ('Semente da Natureza', '{"mechanic":"semente","implemented":true}'::jsonb),
 ('Manto Espectral', '{"mechanic":"manto","invisivel":10,"intangivel":30,"implemented":true}'::jsonb),
 ('Olho de Cobra', '{"mechanic":"olho_de_cobra","implemented":true}'::jsonb),
 ('Baralho Arcano', jsonb_build_object('mechanic','baralho_arcano','implemented',true,'omens', jsonb_build_array(
   jsonb_build_object('card','O Louco','text','Recuar é o seguro, Avançar é recompensador.'),
   jsonb_build_object('card','O Mago','text','Você tem os meios, mas errar a execução custará caro.'),
   jsonb_build_object('card','A Sacerdotisa','text','Há algo oculto observando esta escolha.'),
   jsonb_build_object('card','A Imperatriz','text','O que você proteger agora pode se tornar um problema depois.'),
   jsonb_build_object('card','O Imperador','text','Assumir o controle evita o caos, mas prende você à responsabilidade.'),
   jsonb_build_object('card','O Hierofante','text','Seguir o caminho esperado é seguro.'),
   jsonb_build_object('card','Os Enamorados','text','Uma escolha verdadeira será exigida, e não haverá volta.'),
   jsonb_build_object('card','O Carro','text','Se hesitar agora, perderá a vantagem.'),
   jsonb_build_object('card','A Justiça','text','Este ato terá consequências proporcionais, boas ou ruins.'),
   jsonb_build_object('card','O Eremita','text','Forçar respostas agora é pior do que recuar.'),
   jsonb_build_object('card','A Roda da Fortuna','text','As coisas vão sair do controle.'),
   jsonb_build_object('card','A Força','text','Excesso de agressividade aqui levará à derrota.'),
   jsonb_build_object('card','O Enforcado','text','Algo deve ser perdido para que o progresso aconteça.'),
   jsonb_build_object('card','A Morte','text','Insistir nisso prolongará o fracasso.'),
   jsonb_build_object('card','A Temperança','text','Ir ao extremo quebrará o equilíbrio necessário.'),
   jsonb_build_object('card','O Diabo','text','O atalho resolve agora, mas cobra depois.'),
   jsonb_build_object('card','A Torre','text','A estrutura não vai aguentar o impacto.'),
   jsonb_build_object('card','A Estrela','text','O que parece perdido ainda pode ser restaurado, se você não abandonar o caminho.'),
   jsonb_build_object('card','A Lua','text','Confiar nas aparências aqui é um erro.'),
   jsonb_build_object('card','O Sol','text','Este é o momento certo.'),
   jsonb_build_object('card','O Julgamento','text','Algo do passado será ativado por esta decisão.'),
   jsonb_build_object('card','O Mundo','text','Não há mais ganhos aqui, apenas encerramento.'))))
) as v(n, p) where items.name = v.n and items.campaign_id is null;

update rule_topics set body_md = replace(body_md, '- **Armas cedem a 5× seu dano total base.**', '- **Armas cedem (quebram) quando um único golpe causa mais de 5× o seu dano máximo.** Itens arcanos são exceção. Na ficha, use "Registrar golpe" na arma.')
where slug = 'equipamentos-e-desgaste' and campaign_id is null;

update items set notes = v.n from (values
 ('Olho de Cobra', 'Na ficha: card de Carisma (+5) e botão "Extrair informação". O custo é uma porcentagem da Vida máxima do portador.'),
 ('A Ovelha e o Lobo', 'Decisões do Mestre: na Caçada, os dois ficam com a média da Vida Máxima e do dano máximo por golpe; cancelar o duelo custa 1d10 de sanidade (rolado na mesa).'),
 ('Elmo Imortal', 'Decisão do Mestre: no retorno, tudo volta ao estado do Ponto de Retorno, inclusive o tempo (retrocedendo os turnos).'),
 ('Coração Rubro', 'Decisão do Mestre: o atributo (dano, velocidade ou cura/regeneração) é escolha do jogador.'),
 ('Manto Espectral', 'Na ficha: Invisível (10 de Mana/s = 60 por turno) e Intangível (30/s = 180 por turno), descontados a cada turno; sem Mana, desliga.'),
 ('Baralho Arcano', 'Na ficha: concede Granada, Construtos de Mana e Reforço; teste de Feitos Mágicos sempre 15 + 1d6; botão "Tirar carta" (sorteio ou carta tirada na mesa).'),
 ('Semente da Natureza', 'Na ficha: botão "Consumir" converte em Druída Puro e libera todos os feitiços druídicos.')
) as v(name, n) where items.name = v.name and items.campaign_id is null;
