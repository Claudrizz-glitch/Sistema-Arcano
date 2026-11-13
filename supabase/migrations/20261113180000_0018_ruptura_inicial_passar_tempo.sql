-- 0018 — Ruptura como feitiço inicial (todas as raças, exceto anão) e passar tempo em horas/dias.

-- Ruptura deixa de ser "regra passiva" e vira feitiço (Manipulação de Mana), concedido automaticamente.
update public.spells set passive = false, category = 'Técnica fundamental'
where name = 'Ruptura' and campaign_id is null;

create or replace function public.tg_grant_ruptura()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.race_slug <> 'anao' then
    insert into character_spells(character_id, spell_id, note)
    select new.id, s.id, 'Liberação inicial: toda raça, exceto anão, nasce com Ruptura'
    from spells s where s.name = 'Ruptura' and s.campaign_id is null
    on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists grant_ruptura on public.characters;
create trigger grant_ruptura after insert on public.characters for each row execute function public.tg_grant_ruptura();

-- Fichas já existentes (exceto anões) recebem Ruptura.
insert into public.character_spells(character_id, spell_id, note)
select c.id, s.id, 'Liberação inicial: toda raça, exceto anão, nasce com Ruptura'
from public.characters c cross join public.spells s
where s.name = 'Ruptura' and s.campaign_id is null and c.race_slug <> 'anao'
on conflict do nothing;

-- Passar tempo (horas/dias). Até 1000 turnos usa o avanço normal, turno a turno.
-- Acima disso, aplica a regeneração de uma vez — só quando não há efeitos que dependem de cada turno
-- (sangramento, absorção de mana ou Forjado abaixo de 100%); nesses casos o Mestre avança em turnos.
create or replace function public.advance_time(p_campaign uuid, p_expected_turn bigint, p_turns integer, p_key text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare c campaigns; v_new bigint; v_prev jsonb; v_res jsonb; v_id uuid; v_regen jsonb; v_date jsonb; v_block text;
begin
  perform public._need_gm(p_campaign);
  if p_turns is null or p_turns < 1 or p_turns > 14400 * 30 then raise exception 'avanco_invalido: use de 1 turno a 30 dias'; end if;
  if p_turns <= 1000 then return public.advance_turn(p_campaign, p_expected_turn, p_turns, p_key); end if;
  select * into c from campaigns where id = p_campaign for update;
  if p_key is not null then v_prev := public._idem(p_campaign, p_key); if v_prev is not null then return v_prev || '{"replayed":true}'; end if; end if;
  if c.current_turn <> p_expected_turn then raise exception 'conflito_turno: o turno atual é %', c.current_turn using errcode = 'P0001'; end if;

  select string_agg(distinct v.name, ', ') into v_block from v_characters v
  where v.campaign_id = p_campaign and v.status = 'ativa' and (
    exists (select 1 from character_bleedings b where b.character_id = v.id and b.active)
    or exists (select 1 from mana_absorptions m where m.active and (m.character_id = v.id or m.source_character_id = v.id))
    or (v.hp_current is null and v.mana_current is not null and v.max_mana is not null and v.mana_current < v.max_mana));
  if v_block is not null then
    raise exception 'tempo_bloqueado: % tem sangramento, absorção ou barra de Forjado abaixo de 100%%. Resolva isso ou avance em turnos (até 1000).', v_block using errcode = 'P0001';
  end if;

  v_new := c.current_turn + p_turns;
  perform 1 from characters where campaign_id = p_campaign and status = 'ativa' order by id for update;

  with calc as (
    select v.id, v.name, v.hp_current as hp0, v.mana_current as mana0,
      greatest(0, floor((v_new - v.last_regen_turn)::numeric / c.regen_interval_turns))::bigint as k,
      v.max_hp, v.max_mana, v.last_regen_turn
    from v_characters v where v.campaign_id = p_campaign and v.status = 'ativa'
  ), upd as (
    update characters ch set
      hp_current = case when x.hp0 is not null and x.max_hp is not null then least(x.max_hp, x.hp0 + x.k * c.regen_hp)::int else ch.hp_current end,
      mana_current = case when x.mana0 is not null and x.max_mana is not null then least(x.max_mana, x.mana0 + x.k * c.regen_mana)::int else ch.mana_current end,
      last_regen_turn = x.last_regen_turn + x.k * c.regen_interval_turns,
      version = ch.version + 1
    from calc x where x.id = ch.id
    returning ch.id, x.name, x.hp0, ch.hp_current, x.mana0, ch.mana_current, x.k
  )
  select coalesce(jsonb_agg(jsonb_build_object('character_id', id, 'name', name, 'ticks', k, 'hp', jsonb_build_array(hp0, hp_current),
    'mana', jsonb_build_array(mana0, mana_current), 'bleed', 0, 'absorbed_in', 0, 'absorbed_out', 0, 'events', '[]'::jsonb))
    filter (where hp0 is distinct from hp_current or mana0 is distinct from mana_current), '[]'::jsonb)
  into v_regen from upd;

  update campaigns set current_turn = v_new where id = p_campaign;
  v_date := public.calendar_date(p_campaign);
  v_res := jsonb_build_object('from_turn', c.current_turn, 'to_turn', v_new, 'elapsed_seconds', v_new * c.turn_seconds, 'regen', v_regen,
    'alerts', '[]'::jsonb, 'date', v_date, 'mode', 'tempo');
  v_id := public._log(p_campaign, null, 'avancar_tempo', jsonb_build_object('de', c.current_turn, 'para', v_new, 'turnos', p_turns), v_res, p_key);
  return v_res || jsonb_build_object('action_id', v_id);
end $$;
revoke all on function public.advance_time(uuid, bigint, integer, text) from public, anon;
grant execute on function public.advance_time(uuid, bigint, integer, text) to authenticated;
