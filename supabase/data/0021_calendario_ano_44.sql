-- Campanha "O Eclipse": ano 44 desde o Clube de Tarot / criação da Capital; o ano começa no Inverno.
-- start_seconds_of_day mantém o tempo já jogado (amanhecer do dia 72 + o que foi avançado depois).
update campaigns set calendar_config = calendar_config
  || '{"seasons": ["Inverno", "Primavera", "Verão", "Outono"], "first_eclipse_year": 0, "eclipse_season": "Primavera"}'::jsonb
  || jsonb_build_object('start', jsonb_build_object('season', 'Inverno', 'day', 69, 'year', 44))
where id = 'f6c37a06-d1b0-4f54-b66d-aae1e4fde7e3';

-- Diário: o Inverno era a estação 3 (ano 1) e passa a ser a estação 0 (ano 44).
update day_notes set year = 44, season_index = 0
where campaign_id = 'f6c37a06-d1b0-4f54-b66d-aae1e4fde7e3' and year = 1 and season_index = 3;

update rule_gaps set status = 'resolvida' where campaign_id is null and topic in
  ('Feitos Mágicos: frase × tabela', 'Calendário: números dos anos', 'Druída comum e feitiços não druídicos');
