-- 0023 — (1) Feitos Mágicos: o +5 do Profano vale ao pé da letra (o pior resultado dele é 6; o 2× só existe com resultado 1).
--        (2) Bênção Completa: diferente da fragmentada, só para Arcanos e Bispos; não ocupa slot nem tem limite.

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
  -- Tudo pelo resultado EFETIVO (dado + bônus racial). 1 → 2×; abaixo da CD → proporcional; na CD ou acima → 1×.
  if v_eff <= 1 then v_cost := v_base * 2;
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

-- Bênção Completa
alter table public.character_blessings add column if not exists complete boolean not null default false;

drop function if exists public.grant_blessing(uuid, uuid, text, boolean);
create or replace function public.grant_blessing(p_char uuid, p_blessing uuid, p_note text default '', p_override boolean default false, p_complete boolean default false)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare ch characters; c campaigns; b blessings; v_rights int; v_owned int;
begin
  select * into ch from characters where id = p_char for update;
  if not found then raise exception 'ficha_nao_encontrada'; end if;
  perform public._need_gm(ch.campaign_id);
  select * into c from campaigns where id = ch.campaign_id;
  select * into b from blessings where id = p_blessing and (campaign_id is null or campaign_id = ch.campaign_id) and status <> 'archived';
  if not found then raise exception 'bencao_nao_encontrada'; end if;
  if exists (select 1 from character_blessings where character_id = p_char and blessing_id = p_blessing) then raise exception 'bencao_ja_concedida'; end if;
  if p_complete then
    -- Completa: Arcanos e Bispos. Sem limite, não ocupa slot e vale também para a bênção do emoji.
    insert into character_blessings(character_id, blessing_id, granted_by, exception_override, note, complete) values (p_char, p_blessing, auth.uid(), false, coalesce(p_note,''), true);
    perform public._log(ch.campaign_id, p_char, 'conceder_bencao', jsonb_build_object('bencao', b.name, 'completa', true), '{}', null);
    return jsonb_build_object('blessing', b.name, 'complete', true);
  end if;
  if b.is_extra then raise exception 'extra_automatica: a bênção extra é concedida automaticamente ao completar todas as comuns do grupo' using errcode = 'P0001'; end if;
  if not p_override then
    select count(*) into v_rights from unnest(c.blessing_levels) l where l <= ch.level;
    v_rights := least(v_rights, c.max_common_blessings);
    select count(*) into v_owned from character_blessings cb join blessings x on x.id = cb.blessing_id where cb.character_id = p_char and not x.is_extra and not cb.complete;
    if v_owned >= v_rights then raise exception 'sem_direito_de_bencao: % de % direitos usados (niveis especiais)', v_owned, v_rights using errcode = 'P0001'; end if;
  end if;
  insert into character_blessings(character_id, blessing_id, granted_by, exception_override, note) values (p_char, p_blessing, auth.uid(), p_override, coalesce(p_note,''));
  perform public._log(ch.campaign_id, p_char, 'conceder_bencao', jsonb_build_object('bencao', b.name, 'override', p_override), '{}', null);
  perform public._sync_extras(p_char);
  return jsonb_build_object('blessing', b.name, 'extra', false);
end $$;
revoke all on function public.grant_blessing(uuid, uuid, text, boolean, boolean) from public, anon;
grant execute on function public.grant_blessing(uuid, uuid, text, boolean, boolean) to authenticated;

create or replace function public.revoke_blessing(p_char uuid, p_blessing uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare ch characters; b blessings; v_complete boolean;
begin
  select * into ch from characters where id = p_char for update;
  if not found then raise exception 'ficha_nao_encontrada'; end if;
  perform public._need_gm(ch.campaign_id);
  select * into b from blessings where id = p_blessing;
  select complete into v_complete from character_blessings where character_id = p_char and blessing_id = p_blessing;
  if b.is_extra and not coalesce(v_complete, false) then raise exception 'extra_automatica: a bênção extra é removida automaticamente quando o grupo deixa de estar completo' using errcode = 'P0001'; end if;
  delete from character_blessings where character_id = p_char and blessing_id = p_blessing;
  perform public._log(ch.campaign_id, p_char, 'remover_bencao', jsonb_build_object('blessing_id', p_blessing), '{}', null);
  perform public._sync_extras(p_char);
end $$;
