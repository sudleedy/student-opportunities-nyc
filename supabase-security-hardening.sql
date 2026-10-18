-- Student Opportunities NYC: small, idempotent permission hardening.
-- Run once in Supabase SQL Editor as project owner.
-- This does not delete reports, saved programs, notes or student accounts.
begin;

-- A signed-in student may submit a report but must NOT be able to provide a
-- pre-reviewed status (Pending / In Progress / Resolved) in a direct API call.
-- The existing table default (Pending) continues to apply to new reports.
revoke insert on table public.student_reports from public, anon, authenticated;
grant insert (user_id, category, details, program_id, page_url)
 on table public.student_reports to authenticated;

-- Keep RLS active even if setup scripts have been rerun.
alter table public.student_reports enable row level security;
alter table public.student_saves enable row level security;
alter table public.program_suggestions enable row level security;
alter table public.catalog_programs enable row level security;
alter table public.program_updates enable row level security;
alter table public.program_descriptions enable row level security;
alter table public.site_page_counts enable row level security;

commit;

-- Optional read-only permissions checks; should return:
-- student_can_insert_report=true
-- student_can_insert_report_status=false
-- student_can_read_reports=false
-- student_can_edit_catalog=false
-- anonymous_can_read_saves=false
select
 has_column_privilege('authenticated','public.student_reports','user_id','INSERT') as student_can_insert_report,
 has_column_privilege('authenticated','public.student_reports','status','INSERT') as student_can_insert_report_status,
 has_table_privilege('authenticated','public.student_reports','SELECT') as student_can_read_reports_grant, -- may be true but RLS still restricts rows to authorized admins
 has_table_privilege('authenticated','public.catalog_programs','UPDATE') as student_can_edit_catalog_grant, -- may be true but admin-only RLS blocks it
 has_table_privilege('anon','public.student_saves','SELECT') as anonymous_can_read_saves;
-- Note: SQL grants and RLS are BOTH required. A table-level grant marked true
-- does not mean an ordinary student can access rows through an admin-only policy.
