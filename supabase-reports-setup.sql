-- Student Opportunities NYC: private issue reports (run once in Supabase SQL Editor).
-- Students must sign in with Google or email; no GitHub account required.
create table if not exists public.student_reports (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 category text not null check (category in (
  'Outdated program information','Incorrect eligibility or deadline',
  'Broken program link','Website bug','Other feedback'
 )),
 details text not null check (char_length(trim(details)) between 10 and 2000),
 program_id text check (program_id is null or char_length(program_id) <= 120),
 page_url text not null check (char_length(page_url) between 1 and 500),
 created_at timestamptz not null default now()
);
create index if not exists student_reports_created_at_idx on public.student_reports(created_at desc);
alter table public.student_reports enable row level security;
revoke all on public.student_reports from anon, authenticated;
grant insert (user_id,category,details,program_id,page_url) on public.student_reports to authenticated;
drop policy if exists "Signed in students can submit their own reports" on public.student_reports;
create policy "Signed in students can submit their own reports"
 on public.student_reports for insert to authenticated
 with check ((select auth.uid()) = user_id);
-- No SELECT, UPDATE, or DELETE granted to site users.
-- Review submitted reports through Supabase Dashboard > Table Editor > student_reports.
