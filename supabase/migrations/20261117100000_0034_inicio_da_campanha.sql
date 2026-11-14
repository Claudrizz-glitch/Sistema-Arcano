-- 0034 — Criar campanha com data e hora de início no calendário de Arkhavel; eclipses também antes do ano 0.
drop function if exists public.create_campaign(text, text);
create or replace function public.create_campaign(p_name text, p_description text default '', p_season text default 'Inverno', p_day integer default 69,
  p_year integer default 44, p_seconds integer default 0)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v uuid; cfg jsonb;
begin
  if auth.uid() is null then raise exception 'nao_autenticado' using errcode = '28000'; end if;
  if not public.is_master() then raise exception 'somente_mestre_pode_criar_campanha' using errcode = '42501'; end if;
  if p_season not in ('Inverno', 'Primavera', 'Verão', 'Outono') then raise exception 'estacao_invalida: use Inverno, Primavera, Verão ou Outono' using errcode = 'P0001'; end if;
  if p_day is null or p_day < 1 or p_day > 90 then raise exception 'dia_invalido: cada estação tem 90 dias' using errcode = 'P0001'; end if;
  if p_year is null then raise exception 'ano_invalido' using errcode = 'P0001'; end if;
  if p_seconds is null or p_seconds < 0 or p_seconds > 86399 then raise exception 'hora_invalida' using errcode = 'P0001'; end if;
  -- Modelo do sistema: 4 estações de 90 dias começando pelo Inverno; ano 0 = Clube de Tarot e criação de Arkhavel;
  -- Grande Eclipse no 1º dia da Primavera a cada 22 anos, antes e depois do ano 0.
  cfg := jsonb_build_object('seasons', jsonb_build_array('Inverno', 'Primavera', 'Verão', 'Outono'), 'days_per_season', 90,
    'first_eclipse_year', 0, 'eclipse_every_years', 22, 'eclipse_season', 'Primavera',
    'start', jsonb_build_object('season', p_season, 'day', p_day, 'year', p_year), 'start_seconds_of_day', p_seconds);
  insert into campaigns(name, description, owner_id, calendar_config) values (p_name, coalesce(p_description,''), auth.uid(), cfg) returning id into v;
  insert into campaign_members(campaign_id, user_id, role) values (v, auth.uid(), 'mestre');
  return v;
end $$;
revoke all on function public.create_campaign(text, text, text, integer, integer, integer) from public, anon;
grant execute on function public.create_campaign(text, text, text, integer, integer, integer) to authenticated;

do $do$
declare d text;
begin
  d := pg_get_functiondef('public.calendar_date'::regproc);
  d := replace(d, 'k := greatest(0, ceil((((abs_idx - eoff)::numeric / ylen) + start_year - first_e) / every));',
                  'k := ceil((((abs_idx - eoff)::numeric / ylen) + start_year - first_e) / every);');
  execute d;
end $do$;
