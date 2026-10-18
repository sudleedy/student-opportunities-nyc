-- Student Opportunities NYC: READ-ONLY live permission inspection.
-- Run in the existing Supabase project's SQL Editor. This script never
-- reads student notes, reports, email addresses, or user IDs and writes nothing.
-- A green-looking result is not a substitute for testing two ordinary accounts.

-- Check that each private/public table has RLS enabled.
select schemaname, tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname='public'
  and tablename in ('student_saves','student_reports','program_suggestions',
    'program_updates','program_descriptions','catalog_programs','site_page_counts')
order by tablename;

-- Show roles and USING/WITH CHECK conditions on each security policy.
-- Confirm student_saves policies compare user_id with auth.uid();
-- student_reports and program_suggestions SELECT/UPDATE are admin-only;
-- the catalog is public-read, admin-write; site_page_counts is admin-read.
select schemaname, tablename, policyname, cmd,
       roles::text as roles, qual as using_expression, with_check
from pg_policies
where schemaname='public'
  and tablename in ('student_saves','student_reports','program_suggestions',
    'program_updates','program_descriptions','catalog_programs','site_page_counts')
order by tablename, cmd, policyname;

-- SQL grants: some authenticated grants are broad by design; RLS is the
-- separate row-level boundary. Check BOTH the grants above and the RLS policies.
select
 has_table_privilege('anon','public.student_saves','SELECT') as anon_can_select_saves_grant,
 has_column_privilege('authenticated','public.student_reports','user_id','INSERT') as signed_in_can_submit_report,
 has_column_privilege('authenticated','public.student_reports','status','INSERT') as signed_in_can_set_report_status,
 has_table_privilege('anon','public.student_reports','SELECT') as anon_can_select_reports_grant,
 has_table_privilege('anon','public.program_suggestions','SELECT') as anon_can_select_suggestions_grant;

-- Never infer from the SQL Editor's elevated access that ordinary users
-- can read data. Test two disposable non-admin accounts via the live site/API.
