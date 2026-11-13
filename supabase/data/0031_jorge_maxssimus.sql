-- 2026-11-16: devolve A Ovelha e o Lobo ao Jorge; Maxssimus consta como Druída Puro (variante) com a Semente consumida.
do $$
declare gm constant uuid := 'b2729a3a-03d5-4f48-80a8-4a10e261ba83'; j uuid; mx uuid;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', gm, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', gm::text, true);
  select id into j from characters where name = 'Jorge'; select id into mx from characters where name like 'Maxssimus%';
  if not exists (select 1 from character_items x join items i on i.id = x.item_id where x.character_id = j and i.name = 'A Ovelha e o Lobo') then
    perform grant_item(j, (select id from items where name = 'A Ovelha e o Lobo'), 1, 'Devolvida (ficha do doc)');
  end if;
  update characters set variant_slug = 'druida_puro', version = version + 1 where id = mx;
  update character_items x set state = coalesce(x.state, '{}'::jsonb) || '{"consumed": true}'::jsonb from items i where i.id = x.item_id and x.character_id = mx and i.name = 'Semente da Natureza';
end $$;
