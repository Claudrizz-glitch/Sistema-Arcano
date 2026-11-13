-- 0021 — Decisões do Mestre (2026-11-14):
-- 1) Teste de Feitos Mágicos: abaixo da CD do feitiço, o custo de Mana sobe proporcionalmente até 2× quando se tira 1 no dado.
-- 2) Calendário contado desde o Clube de Tarot / criação da Capital (ano 0). Eclipses nos anos 0, 22, 44…, no 1º dia da Primavera.
--    O ano começa no Inverno, para o Eclipse do ano 44 cair dentro do próprio ano 44.
-- 3) Druída comum: feitiços druídicos harmônicos + técnicas de manipulação de mana. Druída Puro: tudo.

create or replace function public.cast_spell(p_character uuid, p_spell uuid, p_roll integer default null, p_key text default null, p_invested integer default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare ch characters; sp spells; r races; v_blocked boolean; v_res jsonb; v_id uuid; v_prev jsonb; v_block text; v_eff int; v_cost int; v_base int; v_cd int; v_mult numeric;
begin
  select * into ch from characters where id = p_character for update;
  if not found then raise exception 'ficha_nao_encontrada'; end if;
  perform public._need_gm(ch.campaign_id);
  if p_key is not null then v_prev := public._idem(ch.campaign_id, p_key); if v_prev is not null then return v_prev || '{"replayed":true}'; end if; end if;
  if ch.status = 'morta' then raise exception 'ficha_morta'; end if;
  select * into sp from spells where id = p_spell;
  if not found then raise exception 'feitico_nao_encontrado'; end if;
  if sp.passive then raise exception 'feitico_nao_castavel: % é uma regra passiva resolvida manualmente pelo Mestre', sp.name using errcode = 'P0001'; end if;
  if not exists (select 1 from character_spells where character_id = p_character and spell_id = p_spell) then raise exception 'feitico_nao_pertence_a_ficha'; end if;
  v_block := public._spell_block(ch, sp);
  if v_block is not null then raise exception '%', v_block using errcode = 'P0001'; end if;
  if ch.mana_current is null then raise exception 'raca_sem_mana'; end if;
  select coalesce(bool_or(blocks_mana), false) into v_blocked from character_modifiers where character_id = p_character and active;
  if v_blocked then raise exception 'mana_bloqueada'; end if;
  if sp.cost_step is not null then
    if p_invested is null then raise exception 'mana_investida_obrigatoria: informe a Mana investida (múltiplos de %)', sp.cost_step using errcode = 'P0001'; end if;
    if p_invested < sp.cost_step or p_invested % sp.cost_step <> 0 then raise exception 'mana_investida_invalida: use múltiplos de %', sp.cost_step using errcode = 'P0001'; end if;
    v_base := p_invested;
  else v_base := sp.mana_cost; end if;
  if v_base is null then raise exception 'custo_ausente: %', sp.mana_cost_note using errcode = 'P0001'; end if;
  if p_roll is null then raise exception 'resultado_do_dado_obrigatorio: informe o resultado do d20 do Teste de Feitos Mágicos' using errcode = 'P0001'; end if;
  if p_roll < 1 or p_roll > 20 then raise exception 'resultado_do_dado_invalido: use um inteiro de 1 a 20' using errcode = 'P0001'; end if;
  r := public._race_of(ch);
  v_eff := p_roll + r.feat_bonus; v_cd := sp.cd;
  -- 1 no dado = 2×; abaixo da CD = proporcional (CD−1 → quase 1×, 1 → 2×); na CD ou acima = 1×.
  if p_roll = 1 then v_cost := v_base * 2;
  elsif v_cd is null or v_cd <= 1 or v_eff >= v_cd then v_cost := v_base;
  else v_cost := least(v_base * 2, ceil(v_base::numeric * (2 * v_cd - 1 - v_eff) / (v_cd - 1))::int);
  end if;
  v_mult := case when v_base = 0 then 1 else round(v_cost::numeric / v_base, 2) end;
  if ch.mana_current < v_cost then raise exception 'mana_insuficiente: tem %, custa % (base %, multiplicador %)', ch.mana_current, v_cost, v_base, v_mult using errcode = 'P0001'; end if;
  update characters set mana_current = mana_current - v_cost, version = version + 1 where id = p_character;
  v_res := jsonb_build_object('spell', sp.name, 'base_cost', v_base, 'cost', v_cost, 'applied', v_cost, 'roll', p_roll, 'roll_bonus', r.feat_bonus, 'effective_roll', v_eff,
    'multiplier', v_mult, 'mana_before', ch.mana_current, 'mana_after', ch.mana_current - v_cost, 'cd', sp.cd, 'invested', p_invested);
  v_id := public._log(ch.campaign_id, p_character, 'usar_feitico', jsonb_build_object('spell_id', p_spell, 'roll', p_roll, 'invested', p_invested), v_res, p_key);
  return v_res || jsonb_build_object('action_id', v_id);
end $$;

create or replace function public._spell_block(p_char characters, p_spell spells)
returns text language plpgsql stable security definer set search_path to 'public' as $$
declare r races;
begin
  if p_spell.kind = 'contrato' then return 'contrato_nao_e_feitico: ' || p_spell.name || ' é um contrato geral — registre-o na seção Contratos da ficha'; end if;
  if p_spell.passive then return 'feitico_nao_concedivel: ' || p_spell.name || ' é uma regra passiva, não um feitiço conjurável'; end if;
  r := public._race_of(p_char);
  if not r.can_cast then return 'raca_nao_conjura: ' || r.name || ' não pode realizar magia'; end if;
  if p_char.progression_slug = 'druida_puro' then return null; end if;           -- Druída Puro: qualquer feitiço
  if p_spell.druidic then
    if p_char.race_slug = 'druida' and p_spell.harmonic is true then return null; end if;
    if p_char.race_slug = 'druida' then return 'feitico_inelegivel: Druídas comuns acessam apenas feitiços druídicos harmônicos e a manipulação de mana'; end if;
    return 'feitico_inelegivel: feitiços druídicos exigem Druída ou Druída Puro';
  end if;
  if p_char.race_slug = 'druida' and p_spell.category <> 'Técnica fundamental' then
    return 'feitico_inelegivel: Druídas comuns acessam apenas feitiços druídicos harmônicos e a manipulação de mana';
  end if;
  return null;
end $$;

-- Calendário: estação do Eclipse configurável (padrão: a primeira estação, como antes).
create or replace function public.calendar_date(p_campaign uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare c campaigns; cfg jsonb; dps int; ns int; ylen int; seasons jsonb; sidx int; esi int; eoff int; start_year bigint; start_idx bigint; total bigint; abs_idx bigint; yr bigint; in_year int; si int;
        first_e int; every int; k bigint; e_year bigint; e_abs bigint; sod int;
begin
  if auth.uid() is null or not public.is_member(p_campaign) then raise exception 'sem_permissao' using errcode = '42501'; end if;
  select * into c from campaigns where id = p_campaign;
  cfg := c.calendar_config; dps := (cfg->>'days_per_season')::int; seasons := cfg->'seasons'; ns := jsonb_array_length(seasons); ylen := ns * dps;
  select (t.n - 1)::int into sidx from jsonb_array_elements_text(seasons) with ordinality as t(val, n) where t.val = cfg->'start'->>'season';
  select (t.n - 1)::int into esi from jsonb_array_elements_text(seasons) with ordinality as t(val, n) where t.val = coalesce(cfg->>'eclipse_season', seasons->>0);
  eoff := coalesce(esi, 0) * dps;
  start_year := (cfg->'start'->>'year')::bigint;
  start_idx := sidx * dps + ((cfg->'start'->>'day')::int - 1);
  total := coalesce((cfg->>'start_seconds_of_day')::bigint, 0) + c.current_turn * c.turn_seconds;
  abs_idx := start_idx + total / 86400; sod := (total % 86400)::int;
  yr := start_year + abs_idx / ylen; in_year := (abs_idx % ylen)::int; si := in_year / dps;
  first_e := (cfg->>'first_eclipse_year')::int; every := (cfg->>'eclipse_every_years')::int;
  k := greatest(0, ceil((((abs_idx - eoff)::numeric / ylen) + start_year - first_e) / every));
  e_year := first_e + k * every; e_abs := (e_year - start_year) * ylen + eoff;
  return jsonb_build_object('year', yr, 'season', seasons->>si, 'season_index', si, 'day', in_year % dps + 1, 'day_of_year', in_year + 1,
    'seconds_of_day', sod, 'time', lpad((sod / 3600)::text, 2, '0') || ':' || lpad(((sod % 3600) / 60)::text, 2, '0') || ':' || lpad((sod % 60)::text, 2, '0'),
    'eclipse', jsonb_build_object('year', e_year, 'days_until', e_abs - abs_idx, 'is_today', e_abs = abs_idx, 'every_years', every));
end $$;

alter table public.campaigns alter column calendar_config set default
  '{"start": {"day": 69, "year": 44, "season": "Inverno"}, "seasons": ["Inverno", "Primavera", "Verão", "Outono"], "days_per_season": 90, "first_eclipse_year": 0, "eclipse_every_years": 22, "eclipse_season": "Primavera", "start_seconds_of_day": 0}'::jsonb;
