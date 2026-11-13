-- 0027 — Itens, Fase 2: Espada Carmesim, Fio Bifurcado, Estigma do Sem-Pele, Coração Rubro e queimadura (dano fixo por turno).
-- Só o Mestre aciona; o jogador apenas vê o painel.

-- ===== Queimadura: dano fixo por turno, como o sangramento =====
alter table public.character_bleedings add column if not exists flat_damage int, add column if not exists turns_left int;
do $do$
declare r record;
begin
  for r in select conname from pg_constraint where conrelid = 'public.character_bleedings'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%kind%' loop
    execute format('alter table public.character_bleedings drop constraint %I', r.conname);
  end loop;
end $do$;
alter table public.character_bleedings add constraint character_bleedings_kind_check check (kind in ('ferimento', 'privacao', 'queimadura'));
alter table public.character_bleedings add constraint character_bleedings_shape_check check (
  (kind = 'ferimento' and grade is not null) or (kind = 'privacao' and grade is null and rate_percent = 5)
  or (kind = 'queimadura' and grade is null and flat_damage > 0 and (turns_left is null or turns_left >= 0)));

create or replace function public.add_burn(p_char uuid, p_damage integer, p_turns integer default null, p_note text default '')
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare ch characters; t bigint; v_id uuid;
begin
  select * into ch from characters where id = p_char for update;
  if not found then raise exception 'ficha_nao_encontrada'; end if;
  perform public._need_gm(ch.campaign_id);
  if ch.status <> 'ativa' then raise exception 'ficha_nao_ativa: a queimadura só é processada em fichas ativas' using errcode = 'P0001'; end if;
  if p_damage is null or p_damage < 1 then raise exception 'dano_invalido'; end if;
  if p_turns is not null and p_turns < 1 then raise exception 'duracao_invalida'; end if;
  select current_turn into t from campaigns where id = ch.campaign_id;
  insert into character_bleedings(character_id, kind, flat_damage, turns_left, note, started_turn, last_applied_turn, started_by)
  values (p_char, 'queimadura', p_damage, p_turns, coalesce(p_note, ''), t, t, auth.uid()) returning id into v_id;
  perform public._log(ch.campaign_id, p_char, 'iniciar_queimadura', jsonb_build_object('dano', p_damage, 'turnos', p_turns, 'nota', p_note), '{}', null);
  return jsonb_build_object('id', v_id, 'damage', p_damage, 'turns', p_turns);
end $$;

-- ===== Auxiliares =====
create or replace function public._heart_mult(p_lost numeric)
returns numeric language sql immutable as $$
  select case when p_lost >= 99 then 5 when p_lost >= 84 then 4 when p_lost >= 67 then 3 when p_lost >= 50 then 2.5
              when p_lost >= 34 then 2 when p_lost >= 17 then 1.5 when p_lost >= 9 then 1.2 else 1 end::numeric $$;

create or replace function public._item_ctx(p_ci uuid, p_mech text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare ci character_items; ch characters; it items; t bigint;
begin
  select * into ci from character_items where id = p_ci for update; if not found then raise exception 'item_nao_encontrado'; end if;
  select * into ch from characters where id = ci.character_id for update;
  perform public._need_gm(ch.campaign_id);
  select * into it from items where id = ci.item_id;
  if coalesce(it.properties->>'mechanic', '') <> p_mech then raise exception 'item_sem_mecanica'; end if;
  select current_turn into t from campaigns where id = ch.campaign_id;
  return jsonb_build_object('char', ch.id, 'campaign', ch.campaign_id, 'status', ch.status, 'turn', t, 'state', coalesce(ci.state, '{}'::jsonb),
    'hp', ch.hp_current, 'mana', ch.mana_current, 'item', it.name);
end $$;

-- ===== Espada Carmesim =====
create or replace function public.crimson_attack(p_char_item uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare x jsonb; s jsonb; t bigint; hits int; perm int; base int;
begin
  x := public._item_ctx(p_char_item, 'espada_carmesim'); s := x->'state'; t := (x->>'turn')::bigint;
  if x->>'status' = 'morta' then raise exception 'ficha_morta'; end if;
  select coalesce(cd, 18) into base from spells where name = 'Ruptura' and campaign_id is null;
  hits := coalesce((s->>'hits')::int, 0); perm := coalesce((s->>'perm')::int, 0);
  if s->>'glow_until' is null or t > (s->>'glow_until')::bigint then hits := 0; perm := 0; end if;   -- o brilho apagou
  hits := hits + 1;
  s := jsonb_build_object('hits', hits, 'perm', perm, 'glow_until', t + 2);
  update character_items set state = s where id = p_char_item;
  return s || jsonb_build_object('cd', base - perm - hits);
end $$;

create or replace function public.crimson_rupture(p_char_item uuid, p_roll integer)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare x jsonb; s jsonb; t bigint; hits int; perm int; base int; v_cd int; ok boolean; glow boolean; v_res jsonb;
begin
  x := public._item_ctx(p_char_item, 'espada_carmesim'); s := x->'state'; t := (x->>'turn')::bigint;
  if x->>'status' = 'morta' then raise exception 'ficha_morta'; end if;
  if p_roll is null or p_roll < 1 or p_roll > 20 then raise exception 'resultado_do_dado_invalido: use um inteiro de 1 a 20' using errcode = 'P0001'; end if;
  select coalesce(sp.cd, 18) into base from spells sp where sp.name = 'Ruptura' and sp.campaign_id is null;
  hits := coalesce((s->>'hits')::int, 0); perm := coalesce((s->>'perm')::int, 0);
  glow := s->>'glow_until' is not null and t <= (s->>'glow_until')::bigint;
  if not glow then hits := 0; perm := 0; end if;
  v_cd := base - perm - hits; ok := p_roll >= v_cd;
  if ok then hits := 0; if glow then perm := perm + 1; end if; end if;
  s := jsonb_build_object('hits', hits, 'perm', perm, 'glow_until', s->'glow_until');
  update character_items set state = s where id = p_char_item;
  v_res := jsonb_build_object('roll', p_roll, 'cd', v_cd, 'success', ok, 'next_cd', base - perm - hits);
  perform public._log((x->>'campaign')::uuid, (x->>'char')::uuid, 'ruptura_carmesim', jsonb_build_object('roll', p_roll), v_res, null);
  return v_res;
end $$;

-- ===== Fio Bifurcado (os acúmulos são do punhal) =====
create or replace function public.dagger_action(p_char_item uuid, p_action text, p_text text default null, p_value integer default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare x jsonb; s jsonb; souls jsonb; stacks int; nm text;
begin
  x := public._item_ctx(p_char_item, 'fio_bifurcado'); s := x->'state';
  souls := coalesce(s->'souls', '[]'::jsonb); stacks := coalesce((s->>'stacks')::int, 0);
  if p_action = 'caminho' then
    if p_text not in ('ignea', 'boreal') then raise exception 'caminho_invalido'; end if;
    if s->>'path' is distinct from p_text then stacks := 0; end if;      -- alternar zera o progresso
    s := s || jsonb_build_object('path', p_text, 'stacks', stacks);
  elsif p_action = 'alma' then
    if s->>'path' is null then raise exception 'escolha_o_caminho: defina Lâmina Ígnea ou Boreal antes' using errcode = 'P0001'; end if;
    nm := trim(coalesce(p_text, ''));
    if nm = '' then raise exception 'nome_obrigatorio: informe de quem é a alma' using errcode = 'P0001'; end if;
    if exists (select 1 from jsonb_array_elements_text(souls) e where lower(e) = lower(nm)) then raise exception 'alma_repetida: cada alma só concede 1 acúmulo na existência inteira' using errcode = 'P0001'; end if;
    s := s || jsonb_build_object('souls', souls || to_jsonb(nm), 'stacks', least(500, stacks + 1));
  elsif p_action = 'ajustar' then
    if p_value is null or p_value < 0 or p_value > 500 then raise exception 'valor_invalido: use de 0 a 500'; end if;
    s := s || jsonb_build_object('stacks', p_value);
  else raise exception 'acao_invalida'; end if;
  update character_items set state = s where id = p_char_item;
  perform public._log((x->>'campaign')::uuid, (x->>'char')::uuid, 'fio_bifurcado', jsonb_build_object('acao', p_action, 'texto', p_text, 'valor', p_value), s - 'souls', null);
  return s;
end $$;

-- ===== Estigma do Sem-Pele =====
create or replace function public.stigma_action(p_char_item uuid, p_action text, p_material text default null, p_liters integer default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare x jsonb; s jsonb; cost int := 0; mana int; liters int;
begin
  x := public._item_ctx(p_char_item, 'estigma'); s := x->'state'; liters := coalesce((s->>'liters')::int, 0);
  if x->>'status' = 'morta' then raise exception 'ficha_morta'; end if;
  if p_action = 'encapuzar' then
    if trim(coalesce(p_material, '')) = '' then raise exception 'material_obrigatorio: informe o material tocado' using errcode = 'P0001'; end if;
    cost := 30; s := s || jsonb_build_object('skin', trim(p_material));
  elsif p_action = 'transmutar' then
    if s->>'skin' is null then raise exception 'sem_pele_ativa: encapuze um material antes' using errcode = 'P0001'; end if;
    cost := 20;
  elsif p_action = 'camada' then
    if s->>'skin' is null then raise exception 'sem_pele_ativa: encapuze um material antes' using errcode = 'P0001'; end if;
    if p_liters is null or p_liters < 5 or p_liters % 5 <> 0 then raise exception 'litros_invalidos: use múltiplos de 5' using errcode = 'P0001'; end if;
    cost := 20 * (p_liters / 5); s := s || jsonb_build_object('liters', liters + p_liters);
  elsif p_action = 'soltar' then
    s := s - 'liters';
  else raise exception 'acao_invalida'; end if;
  if cost > 0 then
    mana := (x->>'mana')::int;
    if mana is null then raise exception 'raca_sem_mana'; end if;
    if mana < cost then raise exception 'mana_insuficiente: tem %, custa %', mana, cost using errcode = 'P0001'; end if;
    update characters set mana_current = mana_current - cost, version = version + 1 where id = (x->>'char')::uuid;
  end if;
  update character_items set state = s where id = p_char_item;
  perform public._log((x->>'campaign')::uuid, (x->>'char')::uuid, 'estigma', jsonb_build_object('acao', p_action, 'material', p_material, 'litros', p_liters), jsonb_build_object('custo', cost), null);
  return s || jsonb_build_object('cost', cost);
end $$;

-- ===== Coração Rubro =====
create or replace function public.heart_action(p_char_item uuid, p_action text, p_attribute text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare x jsonb; s jsonb; bar int;
begin
  x := public._item_ctx(p_char_item, 'coracao_rubro'); s := x->'state'; bar := coalesce((x->>'hp')::int, (x->>'mana')::int);
  if p_action = 'consumir' then
    if coalesce((s->>'consumed')::boolean, false) then raise exception 'ja_consumido'; end if;
    s := jsonb_build_object('consumed', true);
  elsif p_action = 'atributo' then
    if not coalesce((s->>'consumed')::boolean, false) then raise exception 'nao_consumido: o Coração Rubro precisa ser consumido antes' using errcode = 'P0001'; end if;
    if p_attribute not in ('dano', 'velocidade', 'cura') then raise exception 'atributo_invalido'; end if;
    if s->>'attribute' is not null and (s->>'attr_bar')::int is not distinct from bar then
      raise exception 'troca_bloqueada: trocar o atributo exige cura ou um novo ferimento' using errcode = 'P0001';
    end if;
    s := s || jsonb_build_object('attribute', p_attribute, 'attr_bar', bar);
  else raise exception 'acao_invalida'; end if;
  update character_items set state = s where id = p_char_item;
  perform public._log((x->>'campaign')::uuid, (x->>'char')::uuid, 'coracao_rubro', jsonb_build_object('acao', p_action, 'atributo', p_attribute), '{}', null);
  return s;
end $$;

-- ===== Avanço de turno: queimaduras, manutenção do Estigma e regeneração do Coração Rubro (cura) =====
do $do$
declare d text; a text[]; i int;
begin
  d := pg_get_functiondef('public.advance_turn'::regproc);
  a := array[
    'events jsonb, zero boolean) on commit drop;',
    E'''[]''::jsonb, false\n  from v_characters v',
    'hp = case when hp is not null and mx_hp is not null then least(mx_hp, hp + c.regen_hp) else hp end,',
    '    -- 4) privação do Forjado',
    ' cl record;',
    E'x.state->>''mode'' in (''invisivel'', ''intangivel'');',
    E'update character_items x set state = x.state - ''mode'' from _cloak k where k.ci = x.id and not k.active;',
    '  update character_bleedings set last_applied_turn = v_new'];
  for i in 1..array_length(a, 1) loop if position(a[i] in d) = 0 then raise exception 'advance_turn mudou: trecho % não encontrado', i; end if; end loop;
  d := replace(d, a[1], 'events jsonb, zero boolean, heart boolean) on commit drop;');
  d := replace(d, a[2], E'''[]''::jsonb, false,\n    exists (select 1 from character_items hx join items hi on hi.id = hx.item_id where hx.character_id = v.id and hi.properties->>''mechanic'' = ''coracao_rubro'' and hx.state->>''attribute'' = ''cura'')\n  from v_characters v');
  d := replace(d, a[3], 'hp = case when hp is not null and mx_hp is not null then least(mx_hp, hp + floor(c.regen_hp * case when heart and mx_hp > 0 then public._heart_mult((mx_hp - hp) * 100.0 / mx_hp) else 1 end)::int) else hp end,');
  d := replace(d, a[5], ' cl record; bn record;');
  d := replace(d, a[6], a[6] || E'\n  insert into _cloak select x.id, x.character_id, ((x.state->>''liters'')::int / 5) * 5, true, null\n    from character_items x join items it on it.id = x.item_id join characters ch on ch.id = x.character_id\n    where ch.campaign_id = p_campaign and it.properties->>''mechanic'' = ''estigma'' and coalesce((x.state->>''liters'')::int, 0) >= 5;\n  create temp table if not exists _burn (id uuid primary key, char_id uuid, dmg int, rem int, active boolean, ended bigint) on commit drop;\n  delete from _burn;\n  insert into _burn select b.id, b.character_id, b.flat_damage, b.turns_left, true, null from character_bleedings b join characters ch on ch.id = b.character_id\n    where ch.campaign_id = p_campaign and ch.status = ''ativa'' and b.active and b.kind = ''queimadura'';');
  d := replace(d, a[4], E'    -- 3b) queimaduras: dano fixo por turno, pelo número de turnos definido\n    for bn in select * from _burn where active loop\n      update _acc x set hp = case when not x.is_life then greatest(0, x.hp - bn.dmg) else x.hp end,\n        mana = case when x.is_life then greatest(0, x.mana - bn.dmg) else x.mana end,\n        bleed = x.bleed + least(bn.dmg, case when x.is_life then x.mana else x.hp end)\n      where x.char_id = bn.char_id and x.proc;\n      if bn.rem is not null then\n        update _burn set rem = rem - 1, active = (rem - 1) > 0, ended = case when rem - 1 <= 0 then t else null end where id = bn.id;\n      end if;\n    end loop;\n\n' || a[4]);
  d := replace(d, a[7], E'update character_items x set state = x.state - ''mode'' - ''liters'' from _cloak k where k.ci = x.id and not k.active;');
  d := replace(d, a[8], E'  update character_bleedings b set turns_left = k.rem, active = k.active, ended_turn = k.ended, ended_reason = case when k.active then null else ''duracao_encerrada'' end from _burn k where k.id = b.id;\n' || a[8]);
  d := replace(d, 'manto_desligado', 'manutencao_sem_mana');
  execute d;
end $do$;

do $do$
declare d text; a1 text;
begin
  d := pg_get_functiondef('public.advance_time'::regproc);
  a1 := E'it.properties->>''mechanic'' = ''manto'' and x.state ? ''mode''';
  if position(a1 in d) = 0 then raise exception 'advance_time mudou: trecho de referência não encontrado'; end if;
  d := replace(d, a1, E'((it.properties->>''mechanic'' = ''manto'' and x.state ? ''mode'') or (it.properties->>''mechanic'' = ''estigma'' and coalesce((x.state->>''liters'')::int, 0) >= 5))');
  d := replace(d, 'tem sangramento, absorção, Manto Espectral ligado ou barra', 'tem sangramento, queimadura, absorção, Manto Espectral ligado, camadas do Estigma ou barra');
  execute d;
end $do$;

revoke all on function public._item_ctx(uuid, text) from public, anon, authenticated;
revoke all on function public.add_burn(uuid, integer, integer, text), public.crimson_attack(uuid), public.crimson_rupture(uuid, integer),
  public.dagger_action(uuid, text, text, integer), public.stigma_action(uuid, text, text, integer), public.heart_action(uuid, text, text) from public, anon;
grant execute on function public.add_burn(uuid, integer, integer, text), public.crimson_attack(uuid), public.crimson_rupture(uuid, integer),
  public.dagger_action(uuid, text, text, integer), public.stigma_action(uuid, text, text, integer), public.heart_action(uuid, text, text) to authenticated;
