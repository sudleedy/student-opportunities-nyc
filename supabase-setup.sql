-- Student Opportunity Beacon: run in your own Supabase project's SQL Editor.
-- Do NOT store API secrets or user emails in this public GitHub repository.
create table if not exists public.student_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id text not null check (char_length(program_id) between 1 and 120),
  favorited boolean not null default false,
  application_status text not null default 'Interested'
    check (application_status in ('Interested','Planning to apply','Applied','Completed')),
  notes text not null default '' check (char_length(notes) <= 1500),
  updated_at timestamptz not null default now(),
  primary key (user_id, program_id)
);
create index if not exists student_saves_user_id_idx on public.student_saves(user_id);
alter table public.student_saves enable row level security;
revoke all on public.student_saves from anon, authenticated;
grant select, insert, update, delete on public.student_saves to authenticated;
drop policy if exists "Users view only their own saves" on public.student_saves;
drop policy if exists "Users insert only their own saves" on public.student_saves;
drop policy if exists "Users update only their own saves" on public.student_saves;
drop policy if exists "Users delete only their own saves" on public.student_saves;
create policy "Users view only their own saves" on public.student_saves for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users insert only their own saves" on public.student_saves for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users update only their own saves" on public.student_saves for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete only their own saves" on public.student_saves for delete to authenticated
using ((select auth.uid()) = user_id);
