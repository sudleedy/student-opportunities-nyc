-- Student Opportunities NYC: automatically remove declined program suggestions.
-- Run once in your Supabase SQL Editor using the same project as your website.
-- Existing Pending and Approved suggestions are preserved.
-- Existing Declined suggestions are permanently deleted when this SQL runs.
begin;

revoke delete on public.program_suggestions from anon;
grant delete on public.program_suggestions to authenticated;

alter table public.program_suggestions enable row level security;
drop policy if exists "Site admins can delete suggestions" on public.program_suggestions;
create policy "Site admins can delete suggestions"
 on public.program_suggestions for delete to authenticated
 using ((select public.is_report_admin()));

-- Clean up suggestions declined before this feature existed.
delete from public.program_suggestions
where review_status = 'Declined';

commit;
-- After setup, clicking "Decline & remove" deletes the selected suggestion
-- through the authenticated administrator account. Ordinary students cannot
-- delete suggestions because they fail the administrator-only RLS policy.
