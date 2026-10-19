# Application status follow-up — October 18, 2026

The existing 161-program quality audit reduced the catalog to 159 individually listed programs after removing two generic resource directories. It logged 131 responding source URLs and 28 links that require additional review. This follow-up corrects 3 application-status records; it is not a manual application verification of all 159 programs.

## Verified changes

- Rockefeller University Jumpstart: confirmed applications open for 2027, due January 4, 2027 at 5 p.m. Eastern. Internal applicationState changed from unknown to open. Official page: https://www.rockefeller.edu/outreach/lab-jumpstart/
- Scholastic Art & Writing Awards: 2027 entries opened October 1, 2026. Internal applicationState changed from unknown to open; no universal deadlineISO was created because regional deadlines vary. Official calendar: https://cms.artandwriting.org/awards/how-to-enter/calendar/
- Girls Write Now Mentorship on Demand: official program page confirms mentees ages 14–24 from the United States can sign up year-round. Internal applicationState changed from unknown to open, with accurate account/book-a-mentor guidance. Appointment availability and fees are not guaranteed. Source: https://girlswritenow.org/mentoring-type/mentorship-on-demand/

## Other checked official pages

- Queens Museum 2026–27 Queens Teens Institute: published October 25, 2026 application deadline and $1,000 stipend. https://queensmuseum.org/2026/09/14/queens-teens-institute-2026-2027-applications-now-open-deadline-10-25-26/
- Cooper Hewitt Design Hive: October 25, 2026 deadline; $1,250 stipend. https://www.cooperhewitt.org/design-hive/
- NYBG High School Explainer: November 14, 2026 spring 2027 application deadline. https://www.nybg.org/education/childrens-education/kids-teens/explainers/
- Bronx Documentary Center Youth Photo League: high-school applications open, future closing date not posted. https://www.bronxdoc.org/bronx-documentary-center/education/bdc-youth-photo-league/
- Reel Works academic-year Doc Lab and five-week Summer Doc Lab are separate, not duplicate, tracks. https://www.reelworks.org/afterschool and https://www.reelworks.org/summer-doc-lab

## Quality controls and limits

- Static catalog count remains 159. Program IDs and sitemap and A–Z directory were not modified.
- Internal application-state inconsistency now generates warnings in scripts/catalog_audit.py.
- Four website pages now load programs-data.js?v=14 to avoid stale browser-cached status fields.
- Existing daily deadline checks and monthly link checks were not changed.
- The original audit still lists 28 organizer pages that require manual verification. An HTTP 200 response does not confirm current eligibility, applications, costs or deadlines. Supabase overrides can also differ from the bundled catalog.
