-- Student Opportunities NYC: Admin-editable public program deadlines and review history.
-- Run once in Supabase SQL Editor AFTER supabase-admin-setup.sql.
-- Only enrolled administrators can write changes. Visitors can read published dates.
create table if not exists public.program_updates (
 program_id text primary key check (char_length(program_id) between 1 and 120),
 deadline_text text not null check (char_length(deadline_text) between 1 and 240),
 deadline_iso date,
 status_text text not null check (char_length(status_text) between 1 and 180),
 review_note text not null default '' check (char_length(review_note) <= 500),
 verified_at date not null default current_date,
 updated_at timestamptz not null default now()
);
create index if not exists program_updates_deadline_idx on public.program_updates(deadline_iso);
alter table public.program_updates enable row level security;
revoke all on public.program_updates from public, anon, authenticated;
grant select on public.program_updates to anon, authenticated;
grant insert(program_id, deadline_text, deadline_iso, status_text, review_note, verified_at, updated_at)
 on public.program_updates to authenticated;
grant update(deadline_text, deadline_iso, status_text, review_note, verified_at, updated_at)
 on public.program_updates to authenticated;
grant delete on public.program_updates to authenticated;
drop policy if exists "Anyone can read published program timelines" on public.program_updates;
create policy "Anyone can read published program timelines"
 on public.program_updates for select to anon, authenticated using (true);
drop policy if exists "Admins can create program updates" on public.program_updates;
create policy "Admins can create program updates"
 on public.program_updates for insert to authenticated
 with check ((select public.is_report_admin()));
drop policy if exists "Admins can edit program updates" on public.program_updates;
create policy "Admins can edit program updates"
 on public.program_updates for update to authenticated
 using ((select public.is_report_admin())) with check ((select public.is_report_admin()));
drop policy if exists "Admins can reset program updates" on public.program_updates;
create policy "Admins can reset program updates"
 on public.program_updates for delete to authenticated using ((select public.is_report_admin()));
-- Row-level security protects edits: public browser keys cannot grant themselves admin access.
-- Existing reports, users, and student favorites are unaffected.
