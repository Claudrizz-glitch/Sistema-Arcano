-- Correção do Mestre (2026-11-14): Kael está vivo e é nível 19; dos antigos Arcanos do Clube de Tarot só o Louco e o Mago vivem.
do $$
declare gm constant uuid := 'b2729a3a-03d5-4f48-80a8-4a10e261ba83'; k uuid; l uuid;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', gm, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', gm::text, true);
  select id into k from characters where name = 'Kael' and kind = 'mestre';
  select id into l from characters where name = 'O Louco' and kind = 'mestre';
  perform transition_sheet(k, 'ativa');
  perform set_level(k, 19, null, true);
  perform gm_edit_sheet(k, jsonb_build_object('title_line', 'Cavalheiro do Rei Milo Vetra · nível 19'));
  perform transition_sheet(l, 'ativa');
end $$;
