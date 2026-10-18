-- Student Opportunities NYC: admin-editable program descriptions.
-- Run ONCE in your Supabase SQL Editor after supabase-admin-setup.sql.
-- Public website visitors can read approved changes, but only existing
-- administrators can create, modify, or remove them.
create table if not exists public.program_descriptions (
  program_id text primary key check (char_length(program_id) between 1 and 120),
  summary_text text not null check (char_length(trim(summary_text)) between 1 and 500),
  details_text text not null check (char_length(trim(details_text)) between 1 and 4000),
  reviewed_at date not null default current_date,
  updated_at timestamptz not null default now()
);

alter table public.program_descriptions enable row level security;
revoke all on public.program_descriptions from public, anon, authenticated;
grant select on public.program_descriptions to anon, authenticated;
grant insert, update, delete on public.program_descriptions to authenticated;

drop policy if exists "Public can read program descriptions" on public.program_descriptions;
create policy "Public can read program descriptions"
 on public.program_descriptions for select to anon, authenticated using (true);

drop policy if exists "Admins can add program descriptions" on public.program_descriptions;
create policy "Admins can add program descriptions"
 on public.program_descriptions for insert to authenticated
 with check ((select public.is_report_admin()));

drop policy if exists "Admins can edit program descriptions" on public.program_descriptions;
create policy "Admins can edit program descriptions"
 on public.program_descriptions for update to authenticated
 using ((select public.is_report_admin()))
 with check ((select public.is_report_admin()));

drop policy if exists "Admins can restore program descriptions" on public.program_descriptions;
create policy "Admins can restore program descriptions"
 on public.program_descriptions for delete to authenticated
 using ((select public.is_report_admin()));

-- This table is independent of the program_updates deadline table.
-- Do not use service_role credentials in website JavaScript.
