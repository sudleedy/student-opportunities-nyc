# Student Opportunity Beacon — site setup

The GitHub Pages website is hosted at:
https://sudleedy.github.io/student-opportunity-beacon/

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
   `https://sudleedy.github.io/student-opportunity-beacon/`
   Add this allowed Redirect URL:
   `https://sudleedy.github.io/student-opportunity-beacon/**`
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

## Files
- `index.html` — searchable directory
- `program.html` — shareable program pages and tracker
- `programs-data.js` — programs, eligibility, verified date metadata
- `directory-ui.js`, `program-tracker.js` — UI behavior
- `beacon-store.js` — guest storage and optional Supabase sync
- `auth-config.js` — public project configuration
- `supabase-setup.sql` — private per-account database rules

Review deadlines and program eligibility against organizer pages regularly. Program details are information, not confirmation that an application is currently open.
