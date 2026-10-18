-- Student Opportunities NYC — one-time administrator dashboard setup.
-- Run in Supabase SQL Editor as the project owner.
-- This setup does NOT automatically grant admin access to any account.
-- After running, go to Authentication > Users, copy YOUR account's User UID.
-- Then run separately:
-- insert into private.site_admins(user_id) values ('YOUR-USER-UUID') on conflict do nothing;
-- Never commit a real user UUID or service-role secret to GitHub.
create schema if not exists private;
revoke all on schema private from public, anon;
create table if not exists private.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table private.site_admins enable row level security;
revoke all on private.site_admins from public, anon, authenticated;

create or replace function public.is_report_admin()
returns boolean language sql stable security definer set search_path = ''
as $function$
  select exists (
    select 1 from private.site_admins
    where user_id = (select auth.uid())
  );
$function$;
revoke all on function public.is_report_admin() from public, anon;
grant execute on function public.is_report_admin() to authenticated;

alter table public.student_reports
  add column if not exists status text not null default 'Pending';
do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'student_reports_status_check'
      and conrelid = 'public.student_reports'::regclass
  ) then
    alter table public.student_reports
      add constraint student_reports_status_check
      check (status in ('Pending','In Progress','Resolved'));
  end if;
end;
$migration$;

grant select on public.student_reports to authenticated;
grant update(status) on public.student_reports to authenticated;
drop policy if exists "Site admin can review student reports" on public.student_reports;
create policy "Site admin can review student reports"
  on public.student_reports for select to authenticated
  using ((select public.is_report_admin()));

drop policy if exists "Site admin can update report status" on public.student_reports;
create policy "Site admin can update report status"
  on public.student_reports for update to authenticated
  using ((select public.is_report_admin()))
  with check ((select public.is_report_admin()));

-- No site users can view or change reports except the explicitly enrolled admin(s).
-- Existing student report submission policy remains in effect.
