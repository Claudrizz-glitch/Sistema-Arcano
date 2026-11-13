-- 0026 — Itens, Fase 1: poções, Semente da Natureza, Baralho Arcano, Manto Espectral, Olho de Cobra e quebra de armas.

-- ===== Usar item consumível (poções e Semente da Natureza) =====
create or replace function public.use_item(p_char_item uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare ci character_items; ch characters; it items; v v_characters; m text; v_hp int; v_mana int; v_res jsonb;
begin
  select * into ci from character_items where id = p_char_item for update; if not found then raise exception 'item_nao_encontrado'; end if;
  select * into ch from characters where id = ci.character_id for update;
  perform public._need_gm(ch.campaign_id);
  if ch.status = 'morta' then raise exception 'ficha_morta'; end if;
  select * into it from items where id = ci.item_id; m := coalesce(it.properties->>'mechanic', '');
  select * into v from v_characters where id = ch.id;
  if m = 'pocao' then
    if it.properties ? 'heal' then
      if ch.hp_current is null then raise exception 'raca_sem_vida'; end if;
      v_hp := least(v.max_hp, ch.hp_current + (it.properties->>'heal')::int);
      update characters set hp_current = v_hp, version = version + 1 where id = ch.id;
      v_res := jsonb_build_object('item', it.name, 'hp', jsonb_build_array(ch.hp_current, v_hp));
    else
      if ch.mana_current is null then raise exception 'raca_sem_mana'; end if;
      v_mana := least(v.max_mana, ch.mana_current + (it.properties->>'mana')::int);
      update characters set mana_current = v_mana, version = version + 1 where id = ch.id;
      v_res := jsonb_build_object('item', it.name, 'mana', jsonb_build_array(ch.mana_current, v_mana));
    end if;
  elsif m = 'semente' then
    if ch.progression_slug = 'druida_puro' then raise exception 'ja_e_druida_puro: este personagem já é Druída Puro' using errcode = 'P0001'; end if;
    perform public.convert_progression(ch.id, 'druida_puro');
    insert into character_spells(character_id, spell_id, note)
      select ch.id, s.id, 'Semente da Natureza: acesso absoluto aos feitiços druídicos' from spells s where s.campaign_id is null and s.druidic and s.status = 'published'
      on conflict do nothing;
    v_res := jsonb_build_object('item', it.name, 'convertido', 'druida_puro');
  else
    raise exception 'item_nao_consumivel: % não é usado por este botão', it.name using errcode = 'P0001';
  end if;
  if ci.quantity > 1 then update character_items set quantity = quantity - 1 where id = ci.id; else delete from character_items where id = ci.id; end if;
  perform public._log(ch.campaign_id, ch.id, 'usar_item', jsonb_build_object('item', it.name), v_res, null);
  return v_res;
end $$;

-- ===== Quebra de arma: golpe acima de 5× o dano máximo da arma (itens arcanos não quebram) =====
create or replace function public.weapon_hit(p_char_item uuid, p_damage integer)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare ci character_items; ch characters; it items; v_max int; v_broke boolean;
begin
  select * into ci from character_items where id = p_char_item for update; if not found then raise exception 'item_nao_encontrado'; end if;
  select * into ch from characters where id = ci.character_id;
  perform public._need_gm(ch.campaign_id);
  select * into it from items where id = ci.item_id;
  if it.kind <> 'arma' or it.damage_dice_count is null then raise exception 'so_armas: apenas armas comuns se desgastam (itens arcanos são exceção)' using errcode = 'P0001'; end if;
  if p_damage is null or p_damage < 0 then raise exception 'dano_invalido'; end if;
  v_max := it.damage_dice_count * it.damage_dice_sides;
  v_broke := p_damage > 5 * v_max;
  if v_broke then
    if ci.quantity > 1 then update character_items set quantity = quantity - 1, equipped = false where id = ci.id; else delete from character_items where id = ci.id; end if;
    perform public._log(ch.campaign_id, ch.id, 'item_quebrado', jsonb_build_object('item', it.name, 'dano', p_damage, 'limite', 5 * v_max), '{}', null);
  end if;
  return jsonb_build_object('item', it.name, 'damage', p_damage, 'limit', 5 * v_max, 'broke', v_broke);
end $$;

-- ===== Manto Espectral: liga/desliga invisibilidade ou intangibilidade =====
create or replace function public.set_cloak(p_char_item uuid, p_mode text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare ci character_items; ch characters; it items; c campaigns; v_cost int;
begin
  select * into ci from character_items where id = p_char_item for update; if not found then raise exception 'item_nao_encontrado'; end if;
  select * into ch from characters where id = ci.character_id;
  perform public._need_gm(ch.campaign_id);
  select * into it from items where id = ci.item_id;
  if coalesce(it.properties->>'mechanic', '') <> 'manto' then raise exception 'item_sem_mecanica'; end if;
  if p_mode is not null and p_mode not in ('invisivel', 'intangivel') then raise exception 'modo_invalido'; end if;
  if p_mode is null then
    update character_items set state = state - 'mode' where id = ci.id;
  else
    if ch.status = 'morta' then raise exception 'ficha_morta'; end if;
    select * into c from campaigns where id = ch.campaign_id;
    v_cost := (it.properties->>p_mode)::int * c.turn_seconds;
    if coalesce(ch.mana_current, 0) < v_cost then raise exception 'mana_insuficiente: precisa de % de Mana por turno', v_cost using errcode = 'P0001'; end if;
    update character_items set state = jsonb_set(coalesce(state, '{}'), '{mode}', to_jsonb(p_mode)) where id = ci.id;
  end if;
  perform public._log(ch.campaign_id, ch.id, 'manto', jsonb_build_object('modo', p_mode), '{}', null);
  return jsonb_build_object('mode', p_mode, 'cost_per_turn', v_cost);
end $$;

-- ===== Olho de Cobra: Extração de Informação (custo em % da Vida máxima, pela diferença de nível) =====
create or replace function public.eye_extract(p_char_item uuid, p_target uuid default null, p_target_level integer default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare ci character_items; ch characters; it items; v v_characters; tl int; ul int; diff int; pct int; q text; v_cost int; v_hp int; v_name text; v_res jsonb;
begin
  select * into ci from character_items where id = p_char_item; if not found then raise exception 'item_nao_encontrado'; end if;
  select * into ch from characters where id = ci.character_id for update;
  perform public._need_gm(ch.campaign_id);
  if ch.status = 'morta' then raise exception 'ficha_morta'; end if;
  select * into it from items where id = ci.item_id;
  if coalesce(it.properties->>'mechanic', '') <> 'olho_de_cobra' then raise exception 'item_sem_mecanica'; end if;
  if p_target is not null then
    select level, name into tl, v_name from characters where id = p_target and campaign_id = ch.campaign_id;
    if tl is null then raise exception 'alvo_invalido'; end if;
  else tl := p_target_level; end if;
  if tl is null or tl < 0 or tl > 21 then raise exception 'alvo_obrigatorio: escolha uma ficha ou informe o nível do alvo (0 a 21)' using errcode = 'P0001'; end if;
  ul := case when ch.level = 0 then 22 else ch.level end; tl := case when tl = 0 then 22 else tl end; diff := tl - ul;
  pct := case when diff <= -5 then 8 when diff <= -3 then 10 when diff <= -1 then 12 when diff = 0 then 15 when diff <= 2 then 18 when diff <= 4 then 22 else 30 end;
  q := case when diff <= -5 then 'informação total' when diff <= -3 then 'informação profunda' when diff <= -1 then 'informação relevante' when diff = 0 then 'informação parcial'
            when diff <= 2 then 'fragmentos confusos' when diff <= 4 then 'intenções vagas' else 'quase nenhuma informação' end;
  select * into v from v_characters where id = ch.id;
  if v.max_hp is null or ch.hp_current is null then raise exception 'raca_sem_vida'; end if;
  v_cost := ceil(v.max_hp * pct / 100.0)::int; v_hp := greatest(0, ch.hp_current - v_cost);
  update characters set hp_current = v_hp, version = version + 1 where id = ch.id;
  v_res := jsonb_build_object('alvo', coalesce(v_name, 'nível ' || p_target_level), 'diferenca', diff, 'percentual', pct, 'custo', v_cost, 'hp', jsonb_build_array(ch.hp_current, v_hp), 'qualidade', q);
  perform public._log(ch.campaign_id, ch.id, 'olho_de_cobra', jsonb_build_object('alvo', p_target, 'nivel_alvo', p_target_level), v_res, null);
  return v_res;
end $$;

-- ===== Baralho Arcano: tirar carta (sorteio ou carta escolhida) =====
create or replace function public.draw_omen(p_char_item uuid, p_card text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare ci character_items; ch characters; it items; n int; o jsonb;
begin
  select * into ci from character_items where id = p_char_item; if not found then raise exception 'item_nao_encontrado'; end if;
  select * into ch from characters where id = ci.character_id;
  perform public._need_gm(ch.campaign_id);
  select * into it from items where id = ci.item_id;
  if coalesce(it.properties->>'mechanic', '') <> 'baralho_arcano' then raise exception 'item_sem_mecanica'; end if;
  n := jsonb_array_length(it.properties->'omens');
  if p_card is null then o := (it.properties->'omens')->(floor(random() * n)::int);
  else select x into o from jsonb_array_elements(it.properties->'omens') x where x->>'card' = p_card; end if;
  if o is null then raise exception 'carta_invalida'; end if;
  perform public._log(ch.campaign_id, ch.id, 'tirar_carta', jsonb_build_object('escolhida', p_card is not null), o, null);
  return o;
end $$;

-- ===== Baralho Arcano: concede Granada, Construtos de Mana e Reforço a quem recebe o baralho =====
create or replace function public.tg_item_grants()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if exists (select 1 from items where id = new.item_id and properties->>'mechanic' = 'baralho_arcano') then
    insert into character_spells(character_id, spell_id, note)
    select new.character_id, s.id, 'Concedido pelo Baralho Arcano' from spells s
    where s.campaign_id is null and s.name in ('Granada', 'Construtos de Mana', 'Reforço') on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists item_grants on public.character_items;
create trigger item_grants after insert on public.character_items for each row execute function public.tg_item_grants();

-- ===== Feitos Mágicos com o Baralho Arcano: o dado é sempre 15 + 1d6 =====
create or replace function public.cast_spell(p_character uuid, p_spell uuid, p_roll integer default null, p_key text default null, p_invested integer default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare ch characters; sp spells; r races; v_blocked boolean; v_res jsonb; v_id uuid; v_prev jsonb; v_block text; v_eff int; v_cost int; v_base int; v_cd int; v_mult numeric; v_deck boolean;
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
  if p_roll is null then raise exception 'resultado_do_dado_obrigatorio: informe o resultado do Teste de Feitos Mágicos' using errcode = 'P0001'; end if;
  v_deck := exists (select 1 from character_items ci join items it on it.id = ci.item_id where ci.character_id = p_character and it.properties->>'mechanic' = 'baralho_arcano');
  r := public._race_of(ch);
  if v_deck then
    if p_roll < 1 or p_roll > 6 then raise exception 'resultado_do_dado_invalido: com o Baralho Arcano informe o 1d6 (1 a 6); o resultado é 15 + 1d6' using errcode = 'P0001'; end if;
    v_eff := 15 + p_roll + r.feat_bonus;
  else
    if p_roll < 1 or p_roll > 20 then raise exception 'resultado_do_dado_invalido: use um inteiro de 1 a 20' using errcode = 'P0001'; end if;
    v_eff := p_roll + r.feat_bonus;
  end if;
  v_cd := sp.cd;
  if v_eff <= 1 then v_cost := v_base * 2;
  elsif v_cd is null or v_cd <= 1 or v_eff >= v_cd then v_cost := v_base;
  else v_cost := least(v_base * 2, ceil(v_base::numeric * (2 * v_cd - 1 - v_eff) / (v_cd - 1))::int);
  end if;
  v_mult := case when v_base = 0 then 1 else round(v_cost::numeric / v_base, 2) end;
  if ch.mana_current < v_cost then raise exception 'mana_insuficiente: tem %, custa % (base %, multiplicador %)', ch.mana_current, v_cost, v_base, v_mult using errcode = 'P0001'; end if;
  update characters set mana_current = mana_current - v_cost, version = version + 1 where id = p_character;
  v_res := jsonb_build_object('spell', sp.name, 'base_cost', v_base, 'cost', v_cost, 'applied', v_cost, 'roll', p_roll, 'roll_bonus', r.feat_bonus, 'effective_roll', v_eff,
    'multiplier', v_mult, 'mana_before', ch.mana_current, 'mana_after', ch.mana_current - v_cost, 'cd', sp.cd, 'invested', p_invested, 'deck', v_deck);
  v_id := public._log(ch.campaign_id, p_character, 'usar_feitico', jsonb_build_object('spell_id', p_spell, 'roll', p_roll, 'invested', p_invested), v_res, p_key);
  return v_res || jsonb_build_object('action_id', v_id);
end $$;

-- ===== Manto Espectral no avanço de turno: desconta a Mana por turno; sem Mana, desliga =====
-- (aplicado por substituição de trechos na função existente, para não reescrever o avanço inteiro)
do $do$
declare d text; a1 text; a2 text; a3 text; a4 text;
begin
  d := pg_get_functiondef('public.advance_turn'::regproc);
  a1 := 'dmg int; lose int; v_row uuid; v_end text;';
  a2 := '    from mana_absorptions m join characters ch on ch.id = m.character_id where ch.campaign_id = p_campaign and m.active;';
  a3 := '    -- 2) absorção de mana do Forjado';
  a4 := '  update character_bleedings set last_applied_turn = v_new';
  if position(a1 in d) = 0 or position(a2 in d) = 0 or position(a3 in d) = 0 or position(a4 in d) = 0 then raise exception 'advance_turn mudou: trechos de referência não encontrados'; end if;
  d := replace(d, a1, a1 || ' cl record;');
  d := replace(d, a2, a2 || E'\n  create temp table if not exists _cloak (ci uuid primary key, char_id uuid, cost int, active boolean, ended bigint) on commit drop;\n  delete from _cloak;\n  insert into _cloak select x.id, x.character_id, (it.properties->>(x.state->>''mode''))::int * c.turn_seconds, true, null\n    from character_items x join items it on it.id = x.item_id join characters ch on ch.id = x.character_id\n    where ch.campaign_id = p_campaign and it.properties->>''mechanic'' = ''manto'' and x.state->>''mode'' in (''invisivel'', ''intangivel'');');
  d := replace(d, a3, E'    -- 1b) Manto Espectral: custo de Mana por turno enquanto ativo; sem Mana, desliga\n    for cl in select * from _cloak where active loop\n      if coalesce((select mana from _acc where char_id = cl.char_id and proc), 0) >= cl.cost then\n        update _acc set mana = mana - cl.cost where char_id = cl.char_id;\n      else\n        update _cloak set active = false, ended = t where ci = cl.ci;\n        update _acc set events = events || jsonb_build_array(jsonb_build_object(''turn'', t, ''evento'', ''manto_desligado'', ''motivo'', ''sem_mana'')) where char_id = cl.char_id;\n      end if;\n    end loop;\n\n' || a3);
  d := replace(d, a4, E'  update character_items x set state = x.state - ''mode'' from _cloak k where k.ci = x.id and not k.active;\n' || a4);
  execute d;
end $do$;

do $do$
declare d text; a1 text;
begin
  d := pg_get_functiondef('public.advance_time'::regproc);
  a1 := 'or (v.hp_current is null and v.mana_current is not null and v.max_mana is not null and v.mana_current < v.max_mana));';
  if position(a1 in d) = 0 then raise exception 'advance_time mudou: trecho de referência não encontrado'; end if;
  d := replace(d, a1, E'or (v.hp_current is null and v.mana_current is not null and v.max_mana is not null and v.mana_current < v.max_mana)\n    or exists (select 1 from character_items x join items it on it.id = x.item_id where x.character_id = v.id and it.properties->>''mechanic'' = ''manto'' and x.state ? ''mode''));');
  d := replace(d, 'tem sangramento, absorção ou barra de Forjado abaixo de 100%%.', 'tem sangramento, absorção, Manto Espectral ligado ou barra de Forjado abaixo de 100%%.');
  execute d;
end $do$;

revoke all on function public.use_item(uuid), public.weapon_hit(uuid, integer), public.set_cloak(uuid, text), public.eye_extract(uuid, uuid, integer), public.draw_omen(uuid, text) from public, anon;
grant execute on function public.use_item(uuid), public.weapon_hit(uuid, integer), public.set_cloak(uuid, text), public.eye_extract(uuid, uuid, integer), public.draw_omen(uuid, text) to authenticated;
