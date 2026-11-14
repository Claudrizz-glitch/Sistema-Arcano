-- 0035 — "Anotações" deixa de ser da campanha: vira "Enredo", privado do Mestre e independente de campanha (Meu painel → Enredo).
create table if not exists public.plot_notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) default auth.uid(),
  title text not null,
  content text not null default '',
  tags text[] not null default '{}',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.plot_notes enable row level security;
create policy plot_notes_all on public.plot_notes for all to authenticated
  using (author_id = auth.uid() and public.is_master()) with check (author_id = auth.uid() and public.is_master());
create trigger touch_plot_notes before update on public.plot_notes for each row execute function public.tg_touch();
grant select, insert, update, delete on public.plot_notes to authenticated;
insert into public.plot_notes (author_id, title, content, tags, archived, created_at, updated_at)
select author_id, title, content, tags, archived, created_at, updated_at from public.master_notes;
drop table public.master_notes;
