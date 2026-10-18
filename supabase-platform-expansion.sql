-- Student Opportunities NYC: management, suggestions and privacy-preserving aggregate statistics.
-- Run once in Supabase SQL Editor AFTER existing supabase-admin-setup.sql,
-- supabase-program-timelines.sql and supabase-program-descriptions.sql.
-- This is additive: it does not remove existing student saves or report records.
create table if not exists public.catalog_programs (
  program_id text primary key check (length(program_id) between 3 and 120 and program_id ~ '^[a-z0-9][a-z0-9-]*$'),
  program_data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(program_data)='object' and octet_length(program_data::text)<=24000),
  is_archived boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.catalog_programs enable row level security;
revoke all on public.catalog_programs from public,anon,authenticated;
grant select on public.catalog_programs to anon,authenticated;
grant insert,update,delete on public.catalog_programs to authenticated;
drop policy if exists "Visitors read public catalog" on public.catalog_programs;
create policy "Visitors read public catalog" on public.catalog_programs for select to anon,authenticated using(true);
drop policy if exists "Admins create catalog items" on public.catalog_programs;
create policy "Admins create catalog items" on public.catalog_programs for insert to authenticated with check ((select public.is_report_admin()));
drop policy if exists "Admins edit catalog items" on public.catalog_programs;
create policy "Admins edit catalog items" on public.catalog_programs for update to authenticated
 using((select public.is_report_admin())) with check ((select public.is_report_admin()));
drop policy if exists "Admins delete catalog overrides" on public.catalog_programs;
create policy "Admins delete catalog overrides" on public.catalog_programs for delete to authenticated
 using((select public.is_report_admin()));

create table if not exists public.program_suggestions (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 program_name text not null check(length(trim(program_name)) between 3 and 140),
 organization text not null check(length(trim(organization)) between 2 and 140),
 official_url text not null check(length(official_url)<=500 and official_url ~* '^https://[^ ]+$'),
 details text not null default '' check(length(details)<=2000),
 review_status text not null default 'Pending' check(review_status in ('Pending','Approved','Declined')),
 created_at timestamptz not null default now(), reviewed_at timestamptz
);
create index if not exists program_suggestions_created_idx on public.program_suggestions(created_at desc);
alter table public.program_suggestions enable row level security;
revoke all on public.program_suggestions from public,anon,authenticated;
grant insert(user_id,program_name,organization,official_url,details) on public.program_suggestions to authenticated;
grant select on public.program_suggestions to authenticated;
grant update(review_status,reviewed_at) on public.program_suggestions to authenticated;
drop policy if exists "Students suggest programs" on public.program_suggestions;
create policy "Students suggest programs" on public.program_suggestions for insert to authenticated
 with check ((select auth.uid())=user_id);
drop policy if exists "Admins read suggestions" on public.program_suggestions;
create policy "Admins read suggestions" on public.program_suggestions for select to authenticated
 using ((select public.is_report_admin()));
drop policy if exists "Admins review suggestions" on public.program_suggestions;
create policy "Admins review suggestions" on public.program_suggestions for update to authenticated
 using ((select public.is_report_admin())) with check ((select public.is_report_admin()));
-- Submissions are private to admins; suggestion writers cannot see others' information.

-- Counts only: no IP address, account ID, cookie, full URL, or referrer stored.
create table if not exists public.site_page_counts (
 day date not null, page_kind text not null check(page_kind in ('home','program','dashboard')),
 views bigint not null default 0 check(views>=0),
 primary key(day,page_kind)
);
alter table public.site_page_counts enable row level security;
revoke all on public.site_page_counts from public,anon,authenticated;
grant select on public.site_page_counts to authenticated;
drop policy if exists "Admins read aggregate page counts" on public.site_page_counts;
create policy "Admins read aggregate page counts" on public.site_page_counts for select to authenticated
 using ((select public.is_report_admin()));

create or replace function public.record_site_page_view(kind text)
returns void language plpgsql security definer set search_path=''
as $fn$
begin
 if kind is null or kind not in ('home','program','dashboard') then
  raise exception 'Invalid page type';
 end if;
 insert into public.site_page_counts(day,page_kind,views)
 values ((now() at time zone 'America/New_York')::date,kind,1)
 on conflict (day,page_kind)
 do update set views=public.site_page_counts.views+1;
end
$fn$;
revoke all on function public.record_site_page_view(text) from public;
grant execute on function public.record_site_page_view(text) to anon,authenticated;
-- Counts are approximate page loads, not unique people and can include repeat visits.
