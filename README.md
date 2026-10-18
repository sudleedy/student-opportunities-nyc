# Student Opportunities NYC — site setup

The production website uses a custom domain (still hosted on GitHub Pages):
https://student-opportunities-nyc.com/

The former GitHub Pages address, `https://sudleedy.github.io/student-opportunities-nyc/`, is a historical address and should not be published as the primary website link.

## Custom domain checklist

- **Official public URL:** https://student-opportunities-nyc.com/; repository's `CNAME` must contain `student-opportunities-nyc.com`.
- **DNS:** Cloudflare apex A records use GitHub Pages' four published addresses; the `www` CNAME targets `sudleedy.github.io` (the GitHub-hosted destination, **not** the public URL). Keep those records DNS-only when letting GitHub serve HTTPS.
- **HTTPS:** Keep **Enforce HTTPS** enabled under repository **Settings → Pages**.
- **Auth URL configuration (manual, outside GitHub):** Update the *existing* Supabase project's **Authentication → URL Configuration** Site URL and allowed redirect URLs to the new origin as documented below. Changing `auth-config.js` alone is not a substitute for this dashboard setting. Do not create a new Supabase project or change its public key just because the domain changed.
- **GitHub repository homepage (manual):** Under repository **About → Edit**, change the website URL to `https://student-opportunities-nyc.com/`. This is a GitHub repository metadata setting, separate from Pages configuration.
- **Smoke tests:** In a private/incognito window, visit the home directory, choose a borough, combine interest filters, paginate through nine cards per page, open a program page, and check the student dashboard. Test **Google** and **email-link** sign-in on the new domain and confirm that a saved program syncs to the same account. Test the admin dashboard only with an authorized admin account. Test `https://www.student-opportunities-nyc.com/` redirects to the preferred non-`www` address.
- **Storage limitation:** Browser-local guest saves, notes and sessions do not migrate between hostnames; this is a browser security boundary. Do not promise automatic migration.
- **No database migration required:** Keep the existing Supabase project and tables; no SQL script is needed *just for the domain change*.

## October 18, 2026: 120 reviewed student opportunities

Added 30 official-source-reviewed high school opportunities across STEM, design, mentoring, career preparation, scholarships and competitions. The catalog now has 120 entries, with 123 sitemap URLs (120 detail pages, homepage, privacy and the static program directory). Each new entry explains activities, precise grade or other eligibility limitations, known tuition or scholarship terms, and official organizer source notes. Unless an organizer confirmed a specific active intake, application dates are marked unknown rather than assumed open. The free, crawlable `program-directory.html` page groups all 120 reviewed listings by subject with HTML links. The site retains nine-card pagination and student saved-program tools.

## October 2026: Search visibility, security review, and planning tools

**Search engines:** `robots.txt` advertises `https://student-opportunities-nyc.com/sitemap.xml`, which lists the homepage, privacy page, and reviewed catalog program URLs. Program detail pages set descriptions, canonical addresses, Open Graph metadata, and basic structured data when JavaScript renders a program. The admin and personal dashboard pages are not intended for search indexing. **Google indexing is not guaranteed**: this is a client-rendered GitHub Pages site; crawlers must successfully render JavaScript to obtain per-program content and metadata. Search Console performance requires a verified account.

**One-time owner action in Google Search Console:**
1. Visit https://search.google.com/search-console and **Add property → Domain**. Enter `student-opportunities-nyc.com` without the protocol.
2. Copy Google's **own** verification TXT value. In Cloudflare DNS, add a TXT record with name `@` and Google's exact value. Do not modify GitHub Pages A or `www` CNAME records.
3. Return to Search Console and choose Verify. Keep the TXT record to retain verification.
4. Open **Sitemaps**, enter `https://student-opportunities-nyc.com/sitemap.xml`, and submit. Allow time for discovery; check URL Inspection for crawl/indexing issues.

**Review, not false assurance:** `scripts/catalog_audit.py` validates required descriptions, application guidance, cost fields, URLs, unique IDs, review dates, and stale information. `.github/workflows/catalog-audit.yml` runs it after catalog changes and weekly. A passed automated run does NOT verify current program availability, financial eligibility, fees, official link contents, or real-world opening/closing dates.

**Read-only security inspection:** `supabase-security-audit-readonly.sql` may be run by the Supabase project owner to display policies and grants, without fetching user content or making changes. The checked-in setup SQL specifies owner-only `student_saves` policies, administrators-only report and suggestion review, and Row Level Security on private student tables. **We have not verified the live Supabase permissions** until those SQL results and two separate non-admin test accounts are checked. No new admin accounts are created by this work. Review privacy practices, retention, account deletion requests, and third-party provider terms with a responsible adult before expanding account sign-ups.

**Student dashboard planning features:** compare up to 3 saved programs; view a subject-based shortlist (not a grade or eligibility decision); download one `.ics` file for future saved deadlines with optional 7-day and 1-day calendar alerts. Imports and reminder delivery depend on the student's calendar app. The site does not send email, SMS, or push notifications. All comparison choices stay in the browser tab; the tool does not collect additional student profile fields.

**New researched catalog entries:** Rockefeller SSRP 2027, Rockefeller Summer Neuroscience Program (next application unconfirmed), NYC DYCD Learn & Earn, and CareerReady Work/Learn/Grow (restricted eligibility); always check the organizer page. The bundled catalog now contains **120** reviewed listings, including 30 additional opportunities checked against official organizer pages on October 18, 2026. Newly added current-cycle application deadlines are not generalized to other cycles.

## Navigation and calendar usability fixes (October 18, 2026)

- Home-page searches are preserved as `?q=` in the directory URL. Browser Back, reload, and program details’ **Back** links restore the search text; the page query is preserved as well. The return address is temporarily remembered per browser tab (not sent to Supabase).
- After sign-in, the account button shows the authenticated email address, and the account panel displays the full address. Long addresses are visually shortened in the header; users can open the panel to confirm which account is active.
- The student dashboard and individual program trackers offer **Add to Google Calendar** links for known future deadlines, avoiding the operating system’s automatic Outlook file association. Each link opens a pre-filled Google Calendar draft that the student must save; it does not add events automatically or create alerts. The existing multi-deadline `.ics` download remains available, with manual Google Calendar import instructions for students who want all events at once. Calendar app association is controlled by the user's device, not by this website.
- Deadline times, application availability and eligibility still must be checked directly with organizers. Students may need to sign in to Google Calendar. Calendar links share the chosen program name and cutoff with Google when clicked.

## Features already working without an account
- Save/remove favorites (heart icon on cards or program pages).
- Browse just your saved programs.
- Filter by multiple interests and grades, plus optional borough and advanced checkboxes.
- Sort by upcoming **known** deadlines, putting unknown dates after upcoming dated items.
- On individual program pages, save an application status and personal notes.
- All guest data stays in the browser on the current device and may disappear if browser data is cleared.

## Enable real sign-in and cross-device saving (site owner only)
**The site already contains optional Supabase sign-in code.** Check the active project's configuration, redirects, Row Level Security, and privacy requirements before inviting students to create accounts.

1. Create a project at https://supabase.com/ and open its SQL Editor.
2. Review and run the statements in `supabase-setup.sql`. They create a `student_saves` table and enable per-user Row Level Security so students cannot read each other's saves.
3. Under **Authentication → URL Configuration**, set the **Site URL** to:
   `https://student-opportunities-nyc.com/`
   Add these to the **allowed Redirect URLs**:
   - `https://student-opportunities-nyc.com/`
   - `https://student-opportunities-nyc.com/**` (the current client redirects to the active page, including program URLs with query parameters)
   Use HTTPS and the non-`www` domain for the production site. Optionally keep the former GitHub Pages redirect pattern only during a planned transition; do not point students there. See [Custom domain checklist](#custom-domain-checklist).
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

The Sign in control is present and uses the public Supabase configuration in `auth-config.js` when available; if configuration is missing, it shows **Sign in (soon)**. Students can still save programs as guests. Existing guest saves do not automatically become account data; this avoids copying data from shared computers into someone else's account. **A custom-domain switch also changes the browser storage origin:** guest favorites and notes saved under `sudleedy.github.io` do not automatically appear on `student-opportunities-nyc.com`. Signed-in records stay in the same Supabase database, but users must sign in again on the new hostname.

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

## Catalog expansion: 71 programs (October 18, 2026)

Expanded the reviewed, bundled catalog from **41 to 71 entries** by researching **30 additional opportunities** on organizers' official websites. [See the 30-program expansion audit](catalog-expansion-audit-2026-10-18.md) for all links, eligibility details, organizer deadlines, and limitations. The [original 41-program audit](catalog-audit-2026-10-18.md) is retained as historical documentation.

Highlights include Columbia BRAINYAC, NYBG High School Explainers, Queens Teens Institute, Queens Public Library peer-led service projects, Wave Hill internships, Bronx Zoo Project TRUE, BioBus Junior Scientists, NYU GSTEM, NYSSEF, Brooklyn Public Library and BRIC youth programs, and Staten Island Zoo's actual teen volunteer programs (not its college-only animal-care internships).

- All new entries have **What you'll do** details, full eligibility, source notes and the latest organizer-reported application status. Only verified exact upcoming application deadlines produce deadline countdowns.
- Only programs with an identified specific physical borough have a `borough` field. Citywide/online/multi-site opportunities deliberately remain unassigned in strict borough searches.
- Open and time-sensitive programs are placed near the front of the directory, while other new programs appear interspersed with earlier listings. The layout still uses **9 cards per page** and supports selecting multiple filter values.
- Applicant eligibility is important: Columbia BRAINYAC has designated school/community partner prerequisites; Bronx Zoo Project TRUE requires Bronx residence; tuition-based Columbia/NYU classes are visibly marked as having fees.
- These are **not** 30 programs confirmed to be accepting applications. Some are closed for their 2026 cohorts or await new-year announcements. The organizer link should be rechecked before a student applies.
- The homepage, detail page, student dashboard and admin page all load the expanded catalog using a versioned asset reference. Existing student saves and reports are not modified. No new Supabase SQL required.

## October 18, 2026: Individually listed programs only

At the owner's request, the public homepage now shows **only the 120 specifically described catalog programs**, each with its own details, organizer link, known eligibility and stated application status. The live DYCD NYC-funded **provider/site record feed** was removed from the homepage, together with its refresh button, city-site card type and browser data request. This does **not** remove legitimate named city programs such as SYEP or Learn & Earn from the reviewed catalog. The page remains 9 programs per page with search, multiple filter choices, bookmarks and saved notes.

The **Program borough** filter now searches only curated entries with an explicit physical borough. Its choice is stored locally under `sob-borough-v1` and cleared by **Clear filters**. It does not access location services or request city Open Data. Remote, citywide and unknown-site entries remain available with **All programs · any borough**. `nearby-programs.js` is no longer loaded or used. The privacy page now reflects this behavior.

## Strict borough filtering (October 18, 2026)

Selecting **Brooklyn, Manhattan, Queens, Bronx, or Staten Island** in the home-page borough selector now filters the **entire nine-card opportunity list**. Only items with a matching specific program-site borough are shown. Only reviewed catalog entries with an explicitly verified borough are included in borough-specific results; we do not guess locations.

**Important location rule:** Many individually listed programs are not assigned a fixed borough because they are citywide, virtual, nationwide, across multiple sites, or their exact program venue could not be confidently established. They do **not** appear in a borough-specific search; clearing the borough brings them back. A program being open to residents of a borough does not prove the activity is located there. Avoid guessing venues for administrator-added opportunities until they are verified.

There is no change to favorites, notes, student tracking, or database permissions. The home page explains why citywide and remote options disappear when a borough is selected.

## Multiple selections per filter (October 2026)

- **Interest**, **Grade**, **Application status**, **Program cost**, **Attendance**, **My progress**, use compact checkbox drop-down menus. Students may select several options in the same category (for example, both Science & Research and Technology & Coding, or both 10th and 11th grade).
- Within a single category, programs matching **any checked option** appear; between categories, the choices narrow results together. The search box combines with the chosen filters, and pagination stays **nine cards per page**.
- Each checkbox stays visibly checked while selected. The closed menu shows either the selected choice or the first choice plus a count (e.g., "Science & Research +2"), while the collapsed **More filters** control displays how many advanced options are selected.
- Each checkbox menu has a **Clear** button and **Done** button. **Clear filters** resets all menu selections, sorting and the optional borough without deleting actual saved programs. Menus can be operated by mouse, touch, or keyboard.
- **Borough and Sort by** remain single-choice controls to keep filters and sorting predictable. No Supabase migration is required; these filters are client-side and reset when the page is fully reloaded.

## Current homepage program discovery

- Search, Interest, Grade and Program borough are available in the main directory; additional filters for status, cost, format, favorites and progress are under **More filters**.
- Only individually reviewed catalog entries are displayed. Each has **View details** and **Save favorite**, descriptive activities, and an official organizer link.
- Pagination uses real page links, nine cards per page, and a clear Page X of Y indicator. A separate static A–Z index links to all 120 entries.
- Choosing a borough limits results to entries with a confidently established venue in that borough. It does **not** add more results or contact a city site dataset.
- Students can keep working with their existing saves and synced notes. No Supabase schema changes were required.
- Program descriptions are written as likely activities based on the organizer's information. Application availability must be checked with the organizer.

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
