-- 0033 — O contador de turnos mostrado no site recomeça a cada sessão. O turno absoluto (campaigns.current_turn) continua
-- movendo o calendário; cada sessão guarda o turno em que começou.
alter table public.sessions add column if not exists start_turn bigint not null default 0;

create or replace function public.session_start(p_campaign uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v uuid; n int; d jsonb; t bigint;
begin
  perform public._need_gm(p_campaign);
  select id into v from sessions where campaign_id = p_campaign and started_at is null for update;
  if v is null then insert into sessions(campaign_id) values (p_campaign) returning id into v; end if;
  insert into session_gm(session_id) values (v) on conflict do nothing;
  select coalesce(max(number), 0) + 1 into n from sessions where campaign_id = p_campaign;
  select current_turn into t from campaigns where id = p_campaign;
  d := public.calendar_date(p_campaign);
  -- O calendário continua de onde a última sessão parou; só o contador de turnos da sessão recomeça do zero.
  update sessions set number = n, started_at = now(), start_turn = t,
    date_label = (d->>'day') || ' de ' || (d->>'season') || ' · Ano ' || (d->>'year') where id = v;
  perform public._log(p_campaign, null, 'iniciar_sessao', jsonb_build_object('sessao', n), '{}', null);
  return jsonb_build_object('id', v, 'number', n);
end $$;
