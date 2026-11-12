-- 0014 — retrato por ficha (upload), fichas de jogador reservadas pelo Mestre e anotações por dia do calendário.

-- 1) Fichas de jogador reservadas: o Mestre guarda a ficha (kind='mestre', sem dono) e a importa para um jogador quando quiser.
alter table public.characters add column if not exists player_template boolean not null default false;

create or replace view public.v_characters with (security_invoker = true) as
 SELECT c.id, c.campaign_id, c.kind, c.owner_id, c.created_by, c.name, c.title_line, c.description, c.inventory_text,
    c.narrative_notes, c.portrait_url, c.race_slug, c.variant_slug, c.origin_race_slug, c.progression_slug, c.level, c.xp,
    c.hp_current, c.mana_current, c.sanity_current, c.reach_m, c.special_combat_notes, c.status, c.last_regen_turn, c.version,
    c.created_at, c.updated_at, c.bar_not_full_since,
    pr.max_hp AS base_max_hp, pr.max_mana AS base_max_mana,
    CASE WHEN pr.max_hp IS NULL THEN NULL::integer ELSE round(pr.max_hp::numeric * m.hp_mult * z.f::numeric)::integer END AS max_hp,
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
            COALESCE(bool_or(character_modifiers.blocks_mana), false) AS mana_blocked
           FROM character_modifiers
          WHERE character_modifiers.character_id = c.id AND character_modifiers.active) m;

create or replace function public.set_player_template(p_char uuid, p_flag boolean)
returns void language plpgsql security definer set search_path to 'public' as $$
declare ch characters;
begin
  select * into ch from characters where id = p_char for update;
  if not found then raise exception 'ficha_nao_encontrada'; end if;
  perform public._need_gm(ch.campaign_id);
  if ch.kind <> 'mestre' then raise exception 'so_fichas_do_mestre: devolva a ficha ao Mestre antes' using errcode = 'P0001'; end if;
  update characters set player_template = p_flag, version = version + 1 where id = p_char;
  perform public._log(ch.campaign_id, p_char, 'reservar_ficha', jsonb_build_object('reservada', p_flag), '{}', null);
end $$;

-- Importa uma ficha do Mestre para a conta de um jogador da campanha (respeita o limite de fichas e a ficha ativa única).
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
    v_status := 'inativa';
  end if;
  update characters set kind = 'jogador', owner_id = p_user, player_template = false, status = v_status, version = version + 1 where id = p_char;
  perform public._log(ch.campaign_id, p_char, 'importar_para_jogador', jsonb_build_object('jogador', p_user), jsonb_build_object('status', v_status), null);
  return jsonb_build_object('status', v_status);
end $$;

-- Devolve a ficha de um jogador ao Mestre (volta a ficar reservada).
create or replace function public.return_sheet_to_gm(p_char uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare ch characters;
begin
  select * into ch from characters where id = p_char for update;
  if not found then raise exception 'ficha_nao_encontrada'; end if;
  perform public._need_gm(ch.campaign_id);
  if ch.kind <> 'jogador' then raise exception 'ficha_ja_e_do_mestre' using errcode = 'P0001'; end if;
  update characters set kind = 'mestre', owner_id = null, player_template = true, version = version + 1 where id = p_char;
  perform public._log(ch.campaign_id, p_char, 'devolver_ao_mestre', jsonb_build_object('jogador', ch.owner_id), '{}', null);
end $$;

revoke all on function public.set_player_template(uuid, boolean), public.assign_sheet_to_player(uuid, uuid), public.return_sheet_to_gm(uuid) from public, anon;
grant execute on function public.set_player_template(uuid, boolean), public.assign_sheet_to_player(uuid, uuid), public.return_sheet_to_gm(uuid) to authenticated;

-- 2) Retratos: bucket público para leitura; envio por membros da campanha, na pasta <campaign_id>/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portraits', 'portraits', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;

create policy portraits_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'portraits' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy portraits_update on storage.objects for update to authenticated
  using (bucket_id = 'portraits' and owner = auth.uid());
create policy portraits_delete on storage.objects for delete to authenticated
  using (bucket_id = 'portraits' and (owner = auth.uid() or public.is_gm(((storage.foldername(name))[1])::uuid)));

-- 3) Anotações por dia do calendário: uma pública (jogadores e Mestre editam) e uma privada (só o Mestre).
create table if not exists public.day_notes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  year int not null, season_index int not null check (season_index between 0 and 3), day int not null check (day between 1 and 366),
  visibility text not null check (visibility in ('publica','privada')),
  content text not null default '',
  updated_by uuid references auth.users(id) default auth.uid(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, year, season_index, day, visibility)
);
alter table public.day_notes enable row level security;
create policy day_notes_select on public.day_notes for select to authenticated
  using (public.is_gm(campaign_id) or (visibility = 'publica' and public.is_member(campaign_id)));
create policy day_notes_insert on public.day_notes for insert to authenticated
  with check (public.is_gm(campaign_id) or (visibility = 'publica' and public.is_member(campaign_id)));
create policy day_notes_update on public.day_notes for update to authenticated
  using (public.is_gm(campaign_id) or (visibility = 'publica' and public.is_member(campaign_id)))
  with check (public.is_gm(campaign_id) or (visibility = 'publica' and public.is_member(campaign_id)));
create policy day_notes_delete on public.day_notes for delete to authenticated using (public.is_gm(campaign_id));
create trigger touch_day_notes before update on public.day_notes for each row execute function public.tg_touch();
grant select, insert, update, delete on public.day_notes to authenticated;

-- 4) Calendário padrão de novas campanhas: começa no dia 69 do Inverno (22 dias até o 1º da Primavera).
alter table public.campaigns alter column calendar_config set default
  '{"start": {"day": 69, "year": 1, "season": "Inverno"}, "seasons": ["Primavera", "Verão", "Outono", "Inverno"], "days_per_season": 90, "first_eclipse_year": 2, "eclipse_every_years": 22, "start_seconds_of_day": 0}'::jsonb;
