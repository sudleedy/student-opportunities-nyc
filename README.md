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

## Multiple selections per filter (October 2026)

- **Interest**, **Grade**, **Application status**, **Program cost**, **Attendance**, **My progress**, use compact checkbox drop-down menus. Students may select several options in the same category (for example, both Science & Research and Technology & Coding, or both 10th and 11th grade).
- Within a single category, programs matching **any checked option** appear; between categories, the choices narrow results together. The search box combines with the chosen filters, and pagination stays **nine cards per page**.
- Each checkbox stays visibly checked while selected. The closed menu shows either the selected choice or the first choice plus a count (e.g., "Science & Research +2"), while the collapsed **More filters** control displays how many advanced options are selected.
- Each checkbox menu has a **Clear** button and **Done** button. **Clear filters** resets all menu selections, sorting and the optional borough without deleting actual saved programs. Menus can be operated by mouse, touch, or keyboard.
- **Borough and Sort by** remain single-choice controls to keep city loading and sorting predictable. No Supabase migration is required; these filters are client-side and reset when the page is fully reloaded.

## One unified opportunity list (October 2026)

Both the 41 curated entries and opt-in, automatically discovered NYC-funded program sites now appear in **one search result grid**, with a **single nine-card pagination** shared by all results. The standalone "Discover Programs Near You" section and its second set of pages have been retired.

- Visible controls are just **Search**, **Interest**, **Grade**, and optional **Borough**. Additional filters (including Saved, application status, mode, cost and progress) sit under **More filters**.
- Choosing a borough mixes relevant city-funded sites into the curated program list, prioritizing two curated listings then one city program in the default order. All results share searching, interest filtering and the 9-card pager.
- Curated program cards retain **View details** and **Save favorite**. City cards carry a distinctive "NYC-funded site / applications unverified" label, typical activity and age notes, and an official-directory link. They are **not** presented as approved active internships and are not added to synced saved programs without curator verification.
- The borough can be retained in localStorage; the site does not request GPS coordinates. "Clear filters" clears the borough and any saved search filters, while account favorites/notes remain untouched.
- City data fetch failures do not prevent the curated catalog from loading. This is entirely front-end functionality; there is **no Supabase migration**.

## Clear student activity descriptions (October 18, 2026)

- **All 41 bundled curated opportunities** now have a `whatYouDo` field describing the typical day-to-day activity, not only program benefits. The homepage cards show this first; every program detail page has a dedicated **What you'll actually do** section. Activities can vary by cohort, mentor, and placement.
- The **automatic Near You** directory shows a **What you might do** explanation, a general eligibility note, and an official DYCD program-model information link on every local site card. Examples cover SYEP, Ladders for Leaders, COMPASS High/Explore, Beacon/Cornerstone, Learn & Earn, Work/Learn/Grow, and career training. Ambiguous site types explicitly say that their precise activities are unknown.
- NYC Open Data exposes program types and locations **but no per-site daily schedule**. The automatic explanations use official program-model overviews, never pretend to describe a specific provider's verified activities. Confirm at the provider's site before registering.
- Administrators can revise any curated listing's **What students actually do** field in Manage Programs. No additional SQL migration was required because the existing catalog stores a JSON program_data object.
- No saved student notes, favorites, report permissions, or other Supabase records were changed.

## Automatic neighborhood youth program discovery (October 2026)

The same homepage opportunity search includes **optional location-based NYC youth program discovery**:

- Students may choose their NYC borough, and the selection is retained only in browser localStorage.
- On demand, the integrated location filter fetches the latest available NYC Department of Youth and Community Development program sites from the **official NYC Open Data** dataset [DYCD Program Sites](https://data.cityofnewyork.us/Social-Services/DYCD-Program-Sites/ebkm-iyma). Data changes on the city's schedule, not ours; no administrator SQL migration or search API key is required.
- Only relevant youth, internship, workforce and high-school category program sites appear. Results are deduplicated and labeled with borough, ZIP code, provider, program type, source-data year and *application status not verified*. A full discoverDYCD directory link is provided.
- These city **program-site** records are **not** automatically published as separately verified opportunities in the 41-entry curated catalog. Application deadlines, registration and eligibility are not inferred. Any official-data availability failure shows a link to discoverDYCD instead of fabricated results.
- This automatic expansion currently works for **NYC only**, not all of the United States; additional regions would need vetted local public data sources.

For code: `nearby-programs.js` is loaded by `index.html`. For privacy information, see `privacy.html`. This source has an annual update cadence and may include older current-year program sites.

## Complete official-source review (October 18, 2026)

Reviewed the **organizer source for all 41 bundled programs** and recorded per-program `sourceStatus`, `sourceChecked` and `sourceNote` data. [Read the full 41-program audit](catalog-audit-2026-10-18.md).

- **24** entries have dated or current-cycle details on an organizer page (some are already closed).
- **13** are confirmed programs or resources but have no independently verified new intake date.
- **4** have limited evidence of current eligibility or hiring dates (NYU CALI, MIT THINK and the two NYPL Ambassador programs).
- **5** listings have an exact deadline date field; others are deliberately marked uncertain rather than given a speculative countdown.
- Homepage visitors can now filter by confidence level, read clearer source/closing badges and open an evidence note on each program detail page. Fees, compensation, and attendance-mode filters now include structured official information where supported. 
- Fixed a JavaScript variable shadowing error that could break the attendance-mode filter.

**Important:** Reviewing an organizer's page is **not** proof that 2027 applications are open. Public Supabase overrides may supersede bundled program facts; audit newly published admin changes separately.

## October 18, 2026 public launch audit

**Mobile:** Added small-screen layout safeguards to directory, detail pages, dashboard, admin tools, privacy page, and authentication modal; use a real mobile phone for a final visual check.

**Catalog accuracy:** All 41 bundled listings passed ID/HTTPS-field/date-format checks. [Full source review](catalog-audit-2026-10-18.md) documents each organizer check and which 2027 application details remain unconfirmed. Five entries have exact deadline dates; the remaining 36 do not display invented countdowns. Updated AMNH Science Alliance tuition, MoMA Teens-in-Residence stipend, Princeton Journalism intake wording, and Technovation's newly clarified registration deadline.

**Security:** Public-browser keys are expected; Supabase Row Level Security, not the hidden dashboard, is the access boundary. Static review found owner-only student notes and administrator-only policies for reports, suggestions and catalog management. Hardened public external links against unsafe URL schemes.

**Database action needed for already deployed Supabase projects:** Run [`supabase-security-hardening.sql`](supabase-security-hardening.sql) once as the Supabase project owner. It limits students submitting issue reports to *submission* fields instead of allowing them to directly set a report's admin review status. The original `supabase-reports-setup.sql` now uses the narrower grant for future installations.

**Limitations:** Static code inspection and build success cannot prove a non-admin user's actual RLS requests are denied, or that every program's official website is current. Test a separate ordinary student account before a public launch, and continue reviewing unconfirmed program listings.

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
