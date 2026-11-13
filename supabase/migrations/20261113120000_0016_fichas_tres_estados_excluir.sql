-- 0016 — Fichas com 3 estados (pendente, ativa, morta). "Desativar" deu lugar a "Excluir" (apaga a ficha de vez)
-- e fichas mortas podem ser revividas.

-- Qualquer ficha que ainda esteja inativa volta a pendente (o Mestre decide se ativa ou exclui).
update public.characters set status = 'pendente' where status = 'inativa';
alter table public.characters drop constraint characters_status_check;
alter table public.characters add constraint characters_status_check check (status = any (array['pendente','ativa','morta']));

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

-- Ao importar para um jogador que já tem ficha ativa, a ficha entra como pendente.
create or replace function public.assign_sheet_to_player(p_char uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare ch characters; v_limit int; v_count int; v_status text;
begin
  select * into ch from characters where id = p_char for update;
  if not found then raise exception 'ficha_nao_encontrada'; end if;
  perform public._need_gm(ch.campaign_id);
  if ch.kind <> 'mestre' then raise exception 'ficha_ja_pertence_a_jogador' using errcode = 'P0001'; end if;
  if not exists (select 1 from campaign_members where campaign_id = ch.campaign_id and user_id = p_user and role = 'jogador') then
    raise exception 'jogador_nao_e_membro: o jogador precisa ter entrado na campanha' using errcode = 'P0001';
  end if;
  select max_sheets_per_player into v_limit from campaigns where id = ch.campaign_id;
  select count(*) into v_count from characters where campaign_id = ch.campaign_id and owner_id = p_user;
  if v_count >= v_limit then raise exception 'limite_de_fichas: máximo de % fichas por jogador nesta campanha', v_limit using errcode = 'P0001'; end if;
  v_status := ch.status;
  if v_status = 'ativa' and exists (select 1 from characters where campaign_id = ch.campaign_id and owner_id = p_user and status = 'ativa') then
    v_status := 'pendente';
  end if;
  update characters set kind = 'jogador', owner_id = p_user, player_template = false, status = v_status, version = version + 1 where id = p_char;
  perform public._log(ch.campaign_id, p_char, 'importar_para_jogador', jsonb_build_object('jogador', p_user), jsonb_build_object('status', v_status), null);
  return jsonb_build_object('status', v_status);
end $$;

-- Excluir ficha: só o Mestre. Apaga a ficha e o que é dela (feitiços, itens, bênçãos, efeitos, combate);
-- o histórico de ações é preservado sem o vínculo com a ficha.
create or replace function public.delete_sheet(p_char uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare ch characters;
begin
  select * into ch from characters where id = p_char for update;
  if not found then raise exception 'ficha_nao_encontrada'; end if;
  perform public._need_gm(ch.campaign_id);
  perform public._log(ch.campaign_id, p_char, 'excluir_ficha', jsonb_build_object('nome', ch.name, 'status', ch.status, 'dono', ch.owner_id), '{}', null);
  delete from characters where id = p_char;
end $$;
revoke all on function public.delete_sheet(uuid) from public, anon;
grant execute on function public.delete_sheet(uuid) to authenticated;
