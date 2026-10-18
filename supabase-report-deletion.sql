-- Student Opportunities NYC — permit authorized admins to delete reports.
-- Run ONCE in Supabase SQL Editor, after supabase-admin-setup.sql.
-- This does not delete any reports by itself.
-- Confirm user_id is already enrolled in private.site_admins before using admin tools.

revoke delete on public.student_reports from anon;
grant delete on public.student_reports to authenticated;

alter table public.student_reports enable row level security;

drop policy if exists "Site admin can delete student reports" on public.student_reports;
create policy "Site admin can delete student reports"
  on public.student_reports
  for delete
  to authenticated
  using ((select public.is_report_admin()));

-- Students cannot delete reports: access requires membership in
-- private.site_admins, checked in the database with Row Level Security.
-- SELECT and UPDATE policies, student report submission, saved programs,
-- and program description/timeline tables are unchanged.
