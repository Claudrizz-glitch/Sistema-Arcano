-- 0029 — Itens de registro: Orbe de Selamento, Máscara da Vitória, Moeda do Retorno e Sapato de Escalada.
create or replace function public.trinket_action(p_char_item uuid, p_action text, p_text text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare ci character_items; ch characters; it items; c campaigns; m text; s jsonb; nm text; sod bigint; wait bigint;
begin
  select * into ci from character_items where id = p_char_item for update; if not found then raise exception 'item_nao_encontrado'; end if;
  select * into ch from characters where id = ci.character_id;
  perform public._need_gm(ch.campaign_id);
  select * into it from items where id = ci.item_id; m := coalesce(it.properties->>'mechanic', '');
  s := coalesce(ci.state, '{}'::jsonb); nm := trim(coalesce(p_text, ''));
  if m = 'orbe' and p_action = 'selar' then
    if nm = '' then raise exception 'nome_obrigatorio: informe o ser selado' using errcode = 'P0001'; end if;
    s := s || jsonb_build_object('sealed', coalesce(s->'sealed', '[]'::jsonb) || to_jsonb(nm));
  elsif m = 'orbe' and p_action = 'libertar' then
    -- p_text = posição na lista (0, 1, 2…)
    if nm !~ '^[0-9]+$' or (s->'sealed')->(nm::int) is null then raise exception 'ser_invalido'; end if;
    s := s || jsonb_build_object('sealed', (s->'sealed') - nm::int);
  elsif m = 'mascara' and p_action = 'abate' then
    if nm = '' then raise exception 'nome_obrigatorio: informe o último ser abatido' using errcode = 'P0001'; end if;
    s := s || jsonb_build_object('face', nm);
  elsif m = 'mascara' and p_action = 'vestir' then
    s := s || jsonb_build_object('worn', not coalesce((s->>'worn')::boolean, false));
  elsif m = 'sapato' and p_action = 'usar' then
    s := s || jsonb_build_object('on', not coalesce((s->>'on')::boolean, false));
  elsif m = 'moeda' and p_action = 'gastar' then
    -- volta ao bolso do dono no próximo amanhecer (06:00)
    select * into c from campaigns where id = ch.campaign_id;
    sod := (coalesce((c.calendar_config->>'start_seconds_of_day')::bigint, 0) + c.current_turn * c.turn_seconds) % 86400;
    wait := (21600 - sod + 86400) % 86400; if wait = 0 then wait := 86400; end if;
    s := s || jsonb_build_object('away_until', c.current_turn + ceil(wait::numeric / c.turn_seconds)::bigint);
  elsif m = 'moeda' and p_action = 'recuperar' then
    s := s - 'away_until';
  else raise exception 'acao_invalida'; end if;
  update character_items set state = s where id = p_char_item;
  perform public._log(ch.campaign_id, ch.id, 'item_registro', jsonb_build_object('item', it.name, 'acao', p_action, 'texto', p_text), '{}', null);
  return s;
end $$;
revoke all on function public.trinket_action(uuid, text, text) from public, anon;
grant execute on function public.trinket_action(uuid, text, text) to authenticated;

update items set properties = properties || v.p from (values
 ('Orbe de Selamento', '{"mechanic":"orbe","implemented":true}'::jsonb),
 ('Máscara da Vitória', '{"mechanic":"mascara","implemented":true}'::jsonb),
 ('Moeda do Retorno', '{"mechanic":"moeda","implemented":true}'::jsonb),
 ('Sapato de Escalada', '{"mechanic":"sapato","implemented":true}'::jsonb)
) as v(n, p) where items.name = v.n and items.campaign_id is null;
