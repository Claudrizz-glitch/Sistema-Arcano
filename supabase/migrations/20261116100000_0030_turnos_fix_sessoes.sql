-- 0030 — (1) Correção: passar turno falhava pelo site ("DELETE requires a WHERE clause") por causa de DELETE sem filtro
--        nas tabelas temporárias do Manto e da queimadura. (2) Semente da Natureza fica na ficha como "consumida".
--        (3) Diário por sessão, com roteiro da próxima sessão.

do $do$
declare d text;
begin
  d := pg_get_functiondef('public.advance_turn'::regproc);
  d := replace(d, 'delete from _cloak;', 'delete from _cloak where true;');
  d := replace(d, 'delete from _burn;', 'delete from _burn where true;');
  d := replace(d, 'delete from _acc; delete from _abs;', 'delete from _acc where true; delete from _abs where true;');
  execute d;
end $do$;

do $do$
declare d text; a text;
begin
  d := pg_get_functiondef('public.use_item'::regproc);
  a := 'if ci.quantity > 1 then update character_items set quantity = quantity - 1 where id = ci.id; else delete from character_items where id = ci.id; end if;';
  if position(a in d) > 0 then
    d := replace(d, a, E'if m = ''semente'' then update character_items set state = coalesce(state, ''{}''::jsonb) || ''{"consumed": true}''::jsonb where id = ci.id;\n  elsif ci.quantity > 1 then update character_items set quantity = quantity - 1 where id = ci.id; else delete from character_items where id = ci.id; end if;');
    execute d;
  end if;
end $do$;

-- ===== Sessões =====
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  number int,                       -- definido ao iniciar; nulo = próxima sessão (rascunho do roteiro)
  title text not null default '',
  date_label text not null default '',   -- data de Arkhavel no início da sessão
  public_notes text not null default '',
  started_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists sessions_one_draft on public.sessions (campaign_id) where started_at is null;
create table if not exists public.session_gm (
  session_id uuid primary key references public.sessions(id) on delete cascade,
  script text not null default '',
  gm_notes text not null default ''
);
alter table public.sessions enable row level security;
alter table public.session_gm enable row level security;
create policy sessions_select on public.sessions for select to authenticated
  using (public.is_gm(campaign_id) or (started_at is not null and public.is_member(campaign_id)));
create policy session_gm_select on public.session_gm for select to authenticated
  using (exists (select 1 from public.sessions s where s.id = session_id and public.is_gm(s.campaign_id)));
grant select on public.sessions, public.session_gm to authenticated;

-- Roteiro da próxima sessão (rascunho único por campanha).
create or replace function public.session_draft_save(p_campaign uuid, p_title text, p_script text)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v uuid;
begin
  perform public._need_gm(p_campaign);
  select id into v from sessions where campaign_id = p_campaign and started_at is null;
  if v is null then insert into sessions(campaign_id, title) values (p_campaign, coalesce(p_title, '')) returning id into v;
  else update sessions set title = coalesce(p_title, title) where id = v; end if;
  insert into session_gm(session_id, script) values (v, coalesce(p_script, ''))
    on conflict (session_id) do update set script = excluded.script;
  return v;
end $$;

-- Inicia a próxima sessão: o rascunho vira a sessão N e abre as anotações.
create or replace function public.session_start(p_campaign uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v uuid; n int; d jsonb;
begin
  perform public._need_gm(p_campaign);
  select id into v from sessions where campaign_id = p_campaign and started_at is null for update;
  if v is null then insert into sessions(campaign_id) values (p_campaign) returning id into v; end if;
  insert into session_gm(session_id) values (v) on conflict do nothing;
  select coalesce(max(number), 0) + 1 into n from sessions where campaign_id = p_campaign;
  d := public.calendar_date(p_campaign);
  update sessions set number = n, started_at = now(), date_label = (d->>'day') || ' de ' || (d->>'season') || ' · Ano ' || (d->>'year') where id = v;
  perform public._log(p_campaign, null, 'iniciar_sessao', jsonb_build_object('sessao', n), '{}', null);
  return jsonb_build_object('id', v, 'number', n);
end $$;

create or replace function public.session_gm_save(p_session uuid, p_field text, p_text text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare c uuid;
begin
  select campaign_id into c from sessions where id = p_session; if c is null then raise exception 'sessao_nao_encontrada'; end if;
  perform public._need_gm(c);
  insert into session_gm(session_id) values (p_session) on conflict do nothing;
  if p_field = 'script' then update session_gm set script = coalesce(p_text, '') where session_id = p_session;
  elsif p_field = 'gm_notes' then update session_gm set gm_notes = coalesce(p_text, '') where session_id = p_session;
  elsif p_field = 'title' then update sessions set title = coalesce(p_text, '') where id = p_session;
  else raise exception 'campo_invalido'; end if;
end $$;

-- Anotações do grupo: qualquer membro da campanha edita, depois que a sessão começou.
create or replace function public.session_public_save(p_session uuid, p_text text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare s sessions;
begin
  select * into s from sessions where id = p_session; if not found then raise exception 'sessao_nao_encontrada'; end if;
  if auth.uid() is null or not public.is_member(s.campaign_id) then raise exception 'sem_permissao' using errcode = '42501'; end if;
  if s.started_at is null then raise exception 'sessao_nao_iniciada'; end if;
  update sessions set public_notes = coalesce(p_text, '') where id = p_session;
end $$;

revoke all on function public.session_draft_save(uuid, text, text), public.session_start(uuid), public.session_gm_save(uuid, text, text), public.session_public_save(uuid, text) from public, anon;
grant execute on function public.session_draft_save(uuid, text, text), public.session_start(uuid), public.session_gm_save(uuid, text, text), public.session_public_save(uuid, text) to authenticated;

-- Leva o que já estava no diário por dia para as sessões 1 e 2 da campanha "O Eclipse".
do $do$
declare camp constant uuid := 'f6c37a06-d1b0-4f54-b66d-aae1e4fde7e3'; v uuid;
begin
  if exists (select 1 from campaigns where id = camp) and not exists (select 1 from sessions where campaign_id = camp) then
    insert into sessions(campaign_id, number, title, date_label, started_at) values (camp, 1, '', '69 de Inverno · Ano 44', now()) returning id into v;
    insert into session_gm(session_id, script) values (v, coalesce((select content from day_notes where campaign_id = camp and day = 69 and visibility = 'privada' limit 1), ''));
    update sessions set public_notes = coalesce((select content from day_notes where campaign_id = camp and day = 69 and visibility = 'publica' limit 1), '') where id = v;
    insert into sessions(campaign_id, number, title, date_label, started_at) values (camp, 2, '', '71 de Inverno · Ano 44', now()) returning id into v;
    insert into session_gm(session_id, script) values (v, coalesce((select content from day_notes where campaign_id = camp and day = 71 and visibility = 'privada' limit 1), ''));
    update sessions set public_notes = coalesce((select string_agg(content, E'\n\n' order by day) from day_notes where campaign_id = camp and day >= 71 and visibility = 'publica'), '') where id = v;
  end if;
end $do$;
