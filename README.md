# Student Opportunities NYC — site setup

The GitHub Pages website is hosted at:
https://sudleedy.github.io/student-opportunities-nyc/

## Features already working without an account
- Save/remove favorites (heart icon on cards or program pages).
- Browse just your saved programs.
- Filter by subject, category, location and known grade eligibility.
- Sort by upcoming **known** deadlines, putting unknown dates after upcoming dated items.
- On individual program pages, save an application status and personal notes.
- All guest data stays in the browser on the current device and may disappear if browser data is cleared.

## Enable real sign-in and cross-device saving (site owner only)
**Sign-in is intentionally disabled until the following setup is completed.** Do not share accounts with students before checking security and privacy.

1. Create a project at https://supabase.com/ and open its SQL Editor.
2. Review and run the statements in `supabase-setup.sql`. They create a `student_saves` table and enable per-user Row Level Security so students cannot read each other's saves.
3. Under **Authentication → URL Configuration**, set the Site URL to:
   `https://sudleedy.github.io/student-opportunities-nyc/`
   Add this allowed Redirect URL:
   `https://sudleedy.github.io/student-opportunities-nyc/**`
4. Under **Authentication → Providers**, check that Email sign-in is enabled. Passwordless email links can be rate-limited by Supabase's built-in mail service; configure an approved sending service before a large launch.
5. From your Supabase project, copy the **Project URL** and the public **publishable / anon key**. Put them in `auth-config.js`:
   ```js
   window.SOB_AUTH_CONFIG = {
     supabaseUrl: "https://YOUR-PROJECT.supabase.co",
     publishableKey: "YOUR-PUBLIC-PUBLISHABLE-KEY"
   };
   ```
   A publishable/anon key is meant for public clients **only when RLS is enforced**. **Never publish a service_role key, database password or private API secret**.
6. Commit that file to GitHub; GitHub Pages will rebuild the site.
7. Test the experience with two different test accounts. Each should see only its own notes and favorites.
8. Before inviting minors to create accounts, have a responsible adult review the privacy notice, third-party service terms, and applicable legal requirements.

The Sign in control is present but will show **Sign in (soon)** until configuration is complete. Students can use guest storage meanwhile. Existing guest saves do not automatically become account data; this avoids copying data from shared computers into someone else's account.

## Manage deadlines without editing code

The private administrator interface is at `admin.html` → **Program Timelines**.

1. Complete the existing administrator account setup in `supabase-admin-setup.sql` (do not add new admin users unless authorized).
2. **Once**, run `supabase-program-timelines.sql` in Supabase SQL Editor. It creates an RLS-controlled table, `public.program_updates`.
3. Sign in with your authorized Google account, open **Account → Manage reports & program timelines**, then choose **Program Timelines**.
4. Find a program, open its official organizer website, update the exact date (if announced), deadline wording, application status, and review note.
5. Click **Save & mark reviewed**. Refresh the public directory or program page to see the changes. Public readers can view dates but cannot modify them.
6. Choose **Restore catalog dates** to remove an override. This restores the original GitHub catalog value, which might be older.

**Review cues:** Deadlines within 30 days, passed dates, unconfirmed dates, and information not reviewed for at least 60 days are flagged in the dashboard. These warnings use stored dates; **they do not automatically check the organizer's website or guarantee availability**.

The public site retains its bundled catalog if Supabase cannot be reached. Check administrator edits with a second, ordinary test account before wider launch. Do not place account passwords or secret keys in the browser scripts.

## Edit all program descriptions from the admin dashboard

Go to `admin.html#descriptions` (or choose **Program Descriptions** from the authorized Admin Dashboard).

**One-time setup:** Run `supabase-program-descriptions.sql` in your existing Supabase project's SQL Editor. The SQL adds a new `program_descriptions` table with Row-Level Security: visitors can read published content; only approved administrators can save or restore it. Your existing admin authorization works. No new login or GitHub code changes are needed for regular edits.

In the Program Descriptions tab you can:
- Search programs by name, organization, subject, and type; paginate six programs at a time.
- Edit the **short description** (homepage cards, up to 500 characters) and **full description** (program detail pages, up to 4,000 characters).
- Click **Save descriptions** to publish immediately. Public visitors see the changes on page load or refresh.
- Choose **Restore originals** to delete a customized description and show the bundled catalog wording again.
- Filter to show which programs have custom descriptions.

Description edits do **not** modify deadline overrides in `program_updates`. The public site falls back to the bundled `programs-data.js` text if the description database is unavailable. Check official organizer information before editing factual claims.

## Automatically delete declined program suggestions

In **Admin Dashboard → Student Suggestions**, **Approve** keeps a submission available for reference. **Decline & remove** asks for confirmation, then permanently deletes that suggestion from Supabase. Pending and Approved suggestions are unaffected. Declined suggestions do not automatically become listings.

**One-time upgrade for existing installations:** Run `supabase-suggestion-deletion.sql` in your Supabase project's SQL Editor. This grants database deletion rights **only to authorized admins** through Row Level Security and **permanently deletes suggestions that had already been marked Declined**. The script does not delete pending or approved suggestions. Subsequent declined submissions are deleted directly when an admin clicks **Decline & remove**; no further SQL runs are necessary.

## Delete unnecessary student reports from the admin dashboard

In **Admin Dashboard → Student Reports**, each report has a **Delete report** button beside **Save status**. Select it and confirm before permanent deletion. On successful deletion the report disappears and the report status counts update automatically. **Deleted reports cannot be restored from this dashboard.**

**One-time permission setup:** Run `supabase-report-deletion.sql` in the existing Supabase project's SQL Editor. This adds a Row Level Security `DELETE` policy that allows deletion **only by authorized admins** already recorded in `private.site_admins`. It does not delete records on its own and it does not grant ordinary students report deletion access. No further Supabase visits are needed for individual report deletions.

## 2026 platform expansion: seven improvements

This version includes all seven planned improvements:

1. **Manage Programs** (admin): create listings, edit full program information (including fees, compensation, participation mode and application status), archive/unarchive listings, or restore catalog records. Archiving leaves each student's saved application data intact.
2. **Suggest a program** (homepage): signed-in students submit a program and its official link for private admin review. In **Student Suggestions**, admins can approve, decline, or prefill an editor via **Create program listing**. Approval alone does not publish an unverified listing.
3. **Application labels** on directory cards: open, opening soon, closed, near deadlines, and unknown/review warnings. "Applications open" is displayed **only** with an explicit status and a review date from the past 60 days. A future deadline alone never establishes that applications are open.
4. **Extra filters** on homepage: fees, paid/unpaid, in-person/remote/hybrid, and verified application status. Legacy catalog entries without reliable structured data show "Not confirmed" instead of guessing. Obvious free/paid wording can inform legacy filters until an admin confirms metadata.
5. **My Dashboard** at `dashboard.html`: saved programs, deadlines within 30 days, application progress, and links to edit notes. Uses the existing favorites/tracker store and sign-in; no additional student data table is required.
6. **Review date/source labels**: visible on program cards, with direct official organizer links. Old or missing review dates generate a warning, not false verification.
7. **Admin Site Statistics**: aggregate homepage/program/dashboard page loads (daily counts, not unique visitors), catalog counts, reviewed deadlines, edited descriptions, and approved student suggestions. **No visitor IPs, cookies, full URLs or IDs are saved by the new counter.** Counts are approximate and repeat loads can inflate totals.

### One-time Supabase migration

From the GitHub repository, copy `supabase-platform-expansion.sql` to your existing Supabase project → SQL Editor → Run **once**. It creates and protects `catalog_programs`, `program_suggestions`, and `site_page_counts` and adds a narrowly scoped page-load counting RPC. The migration is additive and keeps existing accounts, saves, reports, timelines, and descriptions. Existing `public.is_report_admin()` and admin authorization are reused.

Until the migration has succeeded, the original catalog, filters, saved programs and other existing features remain usable; new admin saves, the student suggestion queue, and new statistics may show a setup warning or lack data. Do not put secret or service-role keys in browser scripts.

### Recommended manual smoke test after migration

- Sign in as the site administrator. Check `admin.html#management`: add a **test** program, then edit, archive, unarchive and finally remove the test entry. Verify the public search and new detail page in a separate browser tab.
- On `admin.html#timelines` and `#descriptions`, confirm the new test entry is editable. Do not change a real program deadline without checking the official organizer.
- Using a **different, ordinary signed-in test account**, submit a test suggestion from the homepage. Verify only the administrator can review it at `admin.html#suggestions`; test approve/decline and **Create program listing**.
- Verify filters and saved programs work without sign-in, then sign in and check `dashboard.html` for synced favorites and notes.
- Open the homepage and a program page, then refresh `admin.html#insights` and confirm aggregate views update. The counters are not unique-person statistics.
- Check a small mobile screen as well as desktop for card spacing and form controls.

For rollback: revert the recent site-code commits on GitHub (do not delete user tables). Catalog changes made through admin are in Supabase and are independently reversible through the management dashboard.

## Files
- `index.html` — searchable directory
- `program.html` — shareable program pages and tracker
- `programs-data.js` — programs, eligibility, verified date metadata
- `directory-ui.js`, `program-tracker.js` — UI behavior
- `beacon-store.js` — guest storage and optional Supabase sync
- `auth-config.js` — public project configuration
- `supabase-setup.sql` — private per-account database rules

Review deadlines and program eligibility against organizer pages regularly. Program details are information, not confirmation that an application is currently open.
