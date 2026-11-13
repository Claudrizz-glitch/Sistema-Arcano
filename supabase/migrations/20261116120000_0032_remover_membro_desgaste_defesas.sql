-- 0032 — Remover jogador da campanha (as fichas dele voltam ao Mestre como reservadas) e desgaste das defesas
-- ("Defesas perdem 1d4 por mitigação e não acumulam"). Fecha a última lacuna de regra (efeitos dos itens).
create or replace function public.remove_member(p_campaign uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_role text; v_n int;
begin
  perform public._need_gm(p_campaign);
  select role into v_role from campaign_members where campaign_id = p_campaign and user_id = p_user;
  if v_role is null then raise exception 'membro_nao_encontrado'; end if;
  if v_role = 'mestre' or p_user = auth.uid() then raise exception 'nao_remove_mestre: o Mestre não pode ser removido da campanha' using errcode = 'P0001'; end if;
  update characters set kind = 'mestre', owner_id = null, player_template = true, version = version + 1
    where campaign_id = p_campaign and owner_id = p_user;
  get diagnostics v_n = row_count;
  delete from campaign_members where campaign_id = p_campaign and user_id = p_user;
  perform public._log(p_campaign, null, 'remover_membro', jsonb_build_object('jogador', p_user, 'fichas_devolvidas', v_n), '{}', null);
  return jsonb_build_object('sheets_returned', v_n);
end $$;

create or replace function public.defense_wear(p_char_item uuid, p_loss integer)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare ci character_items; ch characters; it items; mx int; cur int;
begin
  select * into ci from character_items where id = p_char_item for update; if not found then raise exception 'item_nao_encontrado'; end if;
  select * into ch from characters where id = ci.character_id;
  perform public._need_gm(ch.campaign_id);
  select * into it from items where id = ci.item_id;
  if it.kind not in ('armadura', 'escudo') or it.mitigation_dice_count is null then raise exception 'so_defesas: apenas armaduras e escudos comuns se desgastam' using errcode = 'P0001'; end if;
  mx := it.mitigation_dice_count * it.mitigation_dice_sides;
  if p_loss is null then cur := mx;
  else
    if p_loss < 1 or p_loss > 4 then raise exception 'valor_invalido: informe o 1d4 perdido (1 a 4)' using errcode = 'P0001'; end if;
    cur := greatest(0, coalesce((ci.state->>'mit')::int, mx) - p_loss);
  end if;
  update character_items set state = coalesce(state, '{}'::jsonb) || jsonb_build_object('mit', cur) where id = p_char_item;
  return jsonb_build_object('item', it.name, 'mit', cur, 'max', mx);
end $$;

revoke all on function public.remove_member(uuid, uuid), public.defense_wear(uuid, integer) from public, anon;
grant execute on function public.remove_member(uuid, uuid), public.defense_wear(uuid, integer) to authenticated;

update rule_gaps set status = 'resolvida' where campaign_id is null and topic = 'Itens arcanos: efeitos mecânicos';
