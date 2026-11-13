-- 0028 — Itens, Fase 3: Elmo Imortal (Ponto de Retorno, volta no tempo), A Ovelha e o Lobo (Caçada e Marcas) e Baú de Mirral.

-- Bônus fixo de Vida máxima (Marcas consumidas e a média da Caçada).
alter table public.character_modifiers add column if not exists hp_bonus int not null default 0;

create or replace view public.v_characters with (security_invoker = true) as
 SELECT c.id, c.campaign_id, c.kind, c.owner_id, c.created_by, c.name, c.title_line, c.description, c.inventory_text,
    c.narrative_notes, c.portrait_url, c.race_slug, c.variant_slug, c.origin_race_slug, c.progression_slug, c.level, c.xp,
    c.hp_current, c.mana_current, c.sanity_current, c.reach_m, c.special_combat_notes, c.status, c.last_regen_turn, c.version,
    c.created_at, c.updated_at, c.bar_not_full_since,
    pr.max_hp AS base_max_hp, pr.max_mana AS base_max_mana,
    CASE WHEN pr.max_hp IS NULL THEN NULL::integer ELSE greatest(1, round(pr.max_hp::numeric * m.hp_mult * z.f::numeric)::integer + m.hp_bonus) END AS max_hp,
    CASE WHEN pr.max_mana IS NULL THEN NULL::integer ELSE pr.max_mana * z.f END AS max_mana,
    pr.aa_dice_count * m.aa_mult * z.f AS aa_dice_count,
    pr.aa_dice_sides, m.mana_blocked,
    CASE WHEN pt.mass_force_base IS NULL OR pt.mass_force_levels_per_point IS NULL THEN NULL::integer
         ELSE (pt.mass_force_base + floor((el.lvl - 1)::numeric / pt.mass_force_levels_per_point::numeric)::integer) * z.f END AS mass_force,
    (pt.speed_base + floor((el.lvl - 1)::numeric / pt.speed_levels_per_point::numeric)::integer) * z.f AS speed_mps,
    c.player_template
   FROM characters c
     CROSS JOIN LATERAL (SELECT CASE WHEN c.level = 0 THEN 21 ELSE c.level END AS lvl) el
     CROSS JOIN LATERAL (SELECT CASE WHEN c.level = 0 THEN 2 ELSE 1 END AS f) z
     JOIN progression_rows pr ON pr.table_slug = c.progression_slug AND pr.level = el.lvl
     JOIN progression_tables pt ON pt.slug = c.progression_slug
     CROSS JOIN LATERAL (SELECT COALESCE(exp(sum(ln(character_modifiers.hp_multiplier))), 1::numeric) AS hp_mult,
            COALESCE(round(exp(sum(ln(character_modifiers.aa_dice_count_multiplier::double precision)))), 1::double precision)::integer AS aa_mult,
            COALESCE(bool_or(character_modifiers.blocks_mana), false) AS mana_blocked,
            COALESCE(sum(character_modifiers.hp_bonus), 0)::integer AS hp_bonus
           FROM character_modifiers
          WHERE character_modifiers.character_id = c.id AND character_modifiers.active) m;

-- "Fotos" de fichas (só as funções do banco leem e escrevem).
create table if not exists public.sheet_snapshots (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  kind text not null check (kind in ('elmo', 'bau')),
  turn bigint not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.sheet_snapshots enable row level security;

create or replace function public._snapshot_char(p_char uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object('row', to_jsonb(c),
    'items', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from character_items x where x.character_id = c.id),
    'mods', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from character_modifiers x where x.character_id = c.id),
    'bleeds', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from character_bleedings x where x.character_id = c.id),
    'abs', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from mana_absorptions x where x.character_id = c.id),
    'spells', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from character_spells x where x.character_id = c.id),
    'blessings', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from character_blessings x where x.character_id = c.id),
    'contracts', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from character_contracts x where x.character_id = c.id))
  from characters c where c.id = p_char $$;

-- Restaura só os atributos da ficha (nível, recursos, estado).
create or replace function public._restore_row(j jsonb)
returns void language plpgsql security definer set search_path to 'public' as $$
declare r characters;
begin
  r := jsonb_populate_record(null::characters, j->'row');
  update characters c set hp_current = r.hp_current, mana_current = r.mana_current, sanity_current = r.sanity_current, status = r.status,
    level = r.level, xp = r.xp, progression_slug = r.progression_slug, race_slug = r.race_slug, variant_slug = r.variant_slug,
    last_regen_turn = r.last_regen_turn, bar_not_full_since = r.bar_not_full_since, inventory_text = r.inventory_text, version = c.version + 1
  where c.id = r.id;
end $$;

-- ===== Elmo Imortal =====
create or replace function public.helm_action(p_char_item uuid, p_action text, p_value integer default null, p_text text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare x jsonb; s jsonb; t bigint; camp uuid; v_snap uuid; v_data jsonb; j jsonb; ids uuid[]; mit int; ret int;
begin
  x := public._item_ctx(p_char_item, 'elmo_imortal'); s := x->'state'; t := (x->>'turn')::bigint; camp := (x->>'campaign')::uuid;
  mit := coalesce((s->>'mit')::int, 20); ret := coalesce((s->>'returns')::int, 0);
  if p_action = 'ponto' then
    if s->>'snapshot' is not null then delete from sheet_snapshots where id = (s->>'snapshot')::uuid; end if;
    select coalesce(jsonb_agg(public._snapshot_char(c.id)), '[]') into v_data from characters c where c.campaign_id = camp;
    insert into sheet_snapshots(campaign_id, kind, turn, data) values (camp, 'elmo', t, v_data) returning id into v_snap;
    s := jsonb_build_object('snapshot', v_snap, 'snap_turn', t, 'returns', 0, 'mit', 20);
  elsif p_action = 'mitigar' then
    if p_value is null or p_value < 1 or p_value > 4 then raise exception 'valor_invalido: informe o 1d4 perdido (1 a 4)' using errcode = 'P0001'; end if;
    s := s || jsonb_build_object('mit', greatest(0, mit - p_value));
  elsif p_action = 'revanche' then
    s := s || jsonb_build_object('revanche', p_text);
  elsif p_action = 'encerrar' then
    if s->>'snapshot' is not null then delete from sheet_snapshots where id = (s->>'snapshot')::uuid; end if;
    s := jsonb_build_object('mit', mit);
  elsif p_action = 'retornar' then
    if s->>'snapshot' is null then raise exception 'sem_ponto_de_retorno: registre o Ponto de Retorno ao entrar em combate' using errcode = 'P0001'; end if;
    if ret >= 2 then raise exception 'retornos_esgotados: o Elmo permite até dois retornos por combate' using errcode = 'P0001'; end if;
    select data, turn into v_data, t from sheet_snapshots where id = (s->>'snapshot')::uuid;
    if v_data is null then raise exception 'sem_ponto_de_retorno'; end if;
    -- só as fichas que ainda existem
    select array_agg((e->'row'->>'id')::uuid) into ids from jsonb_array_elements(v_data) e where exists (select 1 from characters c where c.id = (e->'row'->>'id')::uuid);
    delete from character_modifiers where character_id = any(ids);
    delete from character_bleedings where character_id = any(ids);
    delete from mana_absorptions where character_id = any(ids);
    delete from character_items where character_id = any(ids);
    for j in select e from jsonb_array_elements(v_data) e where (e->'row'->>'id')::uuid = any(ids) loop
      perform public._restore_row(j);
      insert into character_items select * from jsonb_populate_recordset(null::character_items, j->'items');
    end loop;
    delete from character_spells where character_id = any(ids);
    delete from character_blessings where character_id = any(ids);
    delete from character_contracts where character_id = any(ids);
    for j in select e from jsonb_array_elements(v_data) e where (e->'row'->>'id')::uuid = any(ids) loop
      insert into character_modifiers select * from jsonb_populate_recordset(null::character_modifiers, j->'mods');
      insert into character_bleedings select * from jsonb_populate_recordset(null::character_bleedings, j->'bleeds');
      insert into mana_absorptions select * from jsonb_populate_recordset(null::mana_absorptions, j->'abs');
      insert into character_spells select * from jsonb_populate_recordset(null::character_spells, j->'spells');
      insert into character_blessings select * from jsonb_populate_recordset(null::character_blessings, j->'blessings');
      insert into character_contracts select * from jsonb_populate_recordset(null::character_contracts, j->'contracts');
    end loop;
    update campaigns set current_turn = t where id = camp;      -- o tempo volta ao Ponto de Retorno
    s := jsonb_build_object('snapshot', s->'snapshot', 'snap_turn', t, 'returns', ret + 1, 'mit', 20);
    perform public._log(camp, (x->>'char')::uuid, 'elmo_retorno', jsonb_build_object('retorno', ret + 1, 'turno', t), '{}', null);
  else raise exception 'acao_invalida'; end if;
  update character_items set state = s where id = p_char_item;
  return s;
end $$;

-- ===== A Ovelha e o Lobo =====
create or replace function public.wolf_action(p_char_item uuid, p_action text, p_args jsonb default '{}')
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare x jsonb; s jsonb; ch uuid; camp uuid; tg jsonb; uhp int; thp int; avg_hp int; avg_dmg int; mk jsonb; bonus int; idx int; src constant text := 'Caçada (A Ovelha e o Lobo)';
begin
  x := public._item_ctx(p_char_item, 'ovelha_lobo'); s := x->'state'; ch := (x->>'char')::uuid; camp := (x->>'campaign')::uuid;
  if p_action = 'ativar' then
    s := s || '{"activated": true}';
  elsif not coalesce((s->>'activated')::boolean, false) then
    raise exception 'flecha_inativa: a flecha precisa ser ativada (contrato irreversível) antes' using errcode = 'P0001';
  elsif p_action = 'marcar' then
    if s ? 'hunt' then raise exception 'cacada_em_andamento'; end if;
    if p_args->>'target' is not null then
      select jsonb_build_object('id', v.id, 'name', v.name, 'hp', v.max_hp) into tg from v_characters v where v.id = (p_args->>'target')::uuid and v.campaign_id = camp;
      if tg is null then raise exception 'alvo_invalido'; end if;
    else
      if trim(coalesce(p_args->>'name', '')) = '' then raise exception 'alvo_obrigatorio: escolha uma ficha ou informe o nome do alvo' using errcode = 'P0001'; end if;
      tg := jsonb_build_object('name', trim(p_args->>'name'), 'hp', (p_args->>'hp')::int);
    end if;
    if (tg->>'hp') is null or (p_args->>'dmg') is null then raise exception 'dados_do_alvo: informe a Vida máxima e o dano máximo por golpe do alvo' using errcode = 'P0001'; end if;
    s := s || jsonb_build_object('target', tg || jsonb_build_object('dmg', (p_args->>'dmg')::int));
  elsif p_action = 'iniciar' then
    if not s ? 'target' then raise exception 'sem_marca: marque um alvo antes' using errcode = 'P0001'; end if;
    if s ? 'hunt' then raise exception 'cacada_em_andamento'; end if;
    if (p_args->>'user_dmg') is null then raise exception 'dano_obrigatorio: informe o dano máximo por golpe do portador' using errcode = 'P0001'; end if;
    select max_hp into uhp from v_characters where id = ch;
    if uhp is null then raise exception 'raca_sem_vida'; end if;
    tg := s->'target'; thp := (tg->>'hp')::int;
    if tg->>'id' is not null then select coalesce(max_hp, thp) into thp from v_characters where id = (tg->>'id')::uuid; end if;
    avg_hp := ceil((uhp + thp) / 2.0)::int; avg_dmg := ceil(((p_args->>'user_dmg')::int + (tg->>'dmg')::int) / 2.0)::int;
    insert into character_modifiers(character_id, source, hp_bonus, kind, char_item_id, note, created_by)
      values (ch, src, avg_hp - uhp, 'condicional', p_char_item, 'Vida máxima igualada à média durante a Caçada', auth.uid());
    perform public._clamp(ch);
    if tg->>'id' is not null and exists (select 1 from characters where id = (tg->>'id')::uuid and hp_current is not null) then
      insert into character_modifiers(character_id, source, hp_bonus, kind, char_item_id, note, created_by)
        values ((tg->>'id')::uuid, src, avg_hp - thp, 'condicional', p_char_item, 'Vida máxima igualada à média durante a Caçada', auth.uid());
      perform public._clamp((tg->>'id')::uuid);
    end if;
    s := s || jsonb_build_object('hunt', jsonb_build_object('avg_hp', avg_hp, 'avg_dmg', avg_dmg), 'hunts', coalesce((s->>'hunts')::int, 0) + 1,
      'target', tg || jsonb_build_object('hp', thp));
  elsif p_action in ('matar', 'cancelar') then
    if not s ? 'hunt' then raise exception 'sem_cacada'; end if;
    delete from character_modifiers where char_item_id = p_char_item and source = src;
    if p_action = 'matar' then
      s := s || jsonb_build_object('marks', coalesce(s->'marks', '[]'::jsonb) || jsonb_build_array((s->'target') - 'id'));
    else
      if (p_args->>'sanity') is null or (p_args->>'sanity')::int < 1 or (p_args->>'sanity')::int > 10 then raise exception 'sanidade_invalida: informe o 1d10 (1 a 10)' using errcode = 'P0001'; end if;
      update characters set sanity_current = greatest(0, sanity_current - (p_args->>'sanity')::int), version = version + 1 where id = ch;
    end if;
    s := s - 'hunt' - 'target';
  elsif p_action = 'consumir' then
    idx := (p_args->>'index')::int; mk := (s->'marks')->idx;
    if mk is null then raise exception 'marca_invalida'; end if;
    if p_args->>'kind' = 'vida' then
      bonus := ceil((mk->>'hp')::int * 0.1)::int;
      insert into character_modifiers(character_id, source, hp_bonus, kind, note, created_by)
        values (ch, 'Marca consumida: ' || (mk->>'name'), bonus, 'manual', '+10% da Vida da marca (permanente)', auth.uid());
    elsif p_args->>'kind' = 'dano' then
      bonus := ceil((mk->>'dmg')::int * 0.1)::int;
      s := s || jsonb_build_object('bonus_dmg', coalesce((s->>'bonus_dmg')::int, 0) + bonus);
    else raise exception 'tipo_invalido'; end if;
    s := s || jsonb_build_object('marks', (s->'marks') - idx);
  else raise exception 'acao_invalida'; end if;
  update character_items set state = s where id = p_char_item;
  perform public._log(camp, ch, 'ovelha_lobo', jsonb_build_object('acao', p_action) || p_args, coalesce(jsonb_build_object('bonus', bonus), '{}'), null);
  return s;
end $$;

-- ===== Baú de Mirral =====
create or replace function public.chest_action(p_char_item uuid, p_action text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare x jsonb; s jsonb; ch uuid; camp uuid; v_snap uuid; v_data jsonb; sealed boolean;
begin
  x := public._item_ctx(p_char_item, 'bau_mirral'); s := x->'state'; ch := (x->>'char')::uuid; camp := (x->>'campaign')::uuid;
  sealed := coalesce((s->>'sealed')::boolean, false);
  if p_action = 'selar' then
    if coalesce((s->>'barred')::boolean, false) then raise exception 'bau_recusa: esta pessoa jamais poderá ser aceita novamente pelo baú' using errcode = 'P0001'; end if;
    if sealed then raise exception 'ja_selado'; end if;
    insert into sheet_snapshots(campaign_id, kind, turn, data) values (camp, 'bau', (x->>'turn')::bigint, public._snapshot_char(ch)) returning id into v_snap;
    s := jsonb_build_object('sealed', true, 'snapshot', v_snap);
  elsif not sealed then
    raise exception 'alma_nao_selada' using errcode = 'P0001';
  else
    select data into v_data from sheet_snapshots where id = (s->>'snapshot')::uuid;
    if p_action = 'novo_corpo' then
      perform public._restore_row(v_data);
    elsif p_action = 'abrir' then
      perform public._restore_row(v_data);
      delete from sheet_snapshots where id = (s->>'snapshot')::uuid;
      s := jsonb_build_object('barred', true);
    elsif p_action = 'destruir' then
      delete from sheet_snapshots where id = (s->>'snapshot')::uuid;
      update characters set status = 'morta', version = version + 1 where id = ch;
      s := jsonb_build_object('barred', true, 'destroyed', true);
    else raise exception 'acao_invalida'; end if;
  end if;
  update character_items set state = s where id = p_char_item;
  perform public._log(camp, ch, 'bau_mirral', jsonb_build_object('acao', p_action), '{}', null);
  return s;
end $$;

-- Alma selada no Baú de Mirral: a ficha não pode ser marcada como morta.
create or replace function public.transition_sheet(p_char uuid, p_to text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare ch characters; t bigint; v_others int; v_action text;
begin
  select * into ch from characters where id = p_char for update;
  if not found then raise exception 'ficha_nao_encontrada'; end if;
  perform public._need_gm(ch.campaign_id);
  if not ((ch.status = 'pendente' and p_to in ('ativa','morta')) or (ch.status = 'ativa' and p_to = 'morta')
          or (ch.status = 'morta' and p_to = 'ativa')) then
    raise exception 'transicao_invalida: % -> %', ch.status, p_to using errcode = 'P0001';
  end if;
  if p_to = 'morta' and exists (select 1 from character_items x join items i on i.id = x.item_id where x.character_id = p_char and i.properties->>'mechanic' = 'bau_mirral' and x.state->>'sealed' = 'true') then
    raise exception 'imortal: a alma está selada no Baú de Mirral — use o painel do baú (novo corpo, abrir ou destruir)' using errcode = 'P0001';
  end if;
  if p_to = 'ativa' and ch.kind = 'jogador' then
    select count(*) into v_others from characters where campaign_id = ch.campaign_id and owner_id = ch.owner_id and status = 'ativa' and id <> p_char;
    if v_others > 0 then raise exception 'ja_existe_ficha_ativa: exclua ou registre a morte da ficha ativa antes' using errcode = 'P0001'; end if;
  end if;
  select current_turn into t from campaigns where id = ch.campaign_id;
  update characters set status = p_to, last_regen_turn = case when p_to = 'ativa' then t else last_regen_turn end,
    bar_not_full_since = case when p_to = 'ativa' then null else bar_not_full_since end, version = version + 1 where id = p_char;
  v_action := case when ch.status = 'morta' then 'ficha_revivida' else 'ficha_' || p_to end;
  perform public._log(ch.campaign_id, p_char, v_action, jsonb_build_object('de', ch.status, 'para', p_to), '{}', null);
  return jsonb_build_object('from', ch.status, 'to', p_to);
end $$;

revoke all on function public._snapshot_char(uuid), public._restore_row(jsonb) from public, anon, authenticated;
revoke all on function public.helm_action(uuid, text, integer, text), public.wolf_action(uuid, text, jsonb), public.chest_action(uuid, text) from public, anon;
grant execute on function public.helm_action(uuid, text, integer, text), public.wolf_action(uuid, text, jsonb), public.chest_action(uuid, text) to authenticated;
