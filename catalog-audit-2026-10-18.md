# Source-by-source audit: all 41 programs
**Review date: October 18, 2026**  
**Site:** [Student Opportunities NYC](https://sudleedy.github.io/student-opportunities-nyc/)

## Scope and meanings

I inspected the program's official organizer URL (or a program-specific official replacement) for **all 41 original directory listings** and compared it with the current bundled description. The review identifies which facts are supported by official program information, and deliberately avoids claiming that every upcoming application is open.

- **24 — Dated or current information on organizer page:** recent cycle, announced enrollment, last known application dates, or a recurring live program. This does **not** mean applications are open right now.
- **13 — Organizer confirms program, next intake unconfirmed:** legitimate program or resource, but no reliable current application date available on the reviewed page.
- **4 — Limited verification:** organizer evidence was a historical article, an inaccessible/empty website, or a general page that could not confirm a current intake.

The `sourceChecked` field documents **when a page was inspected**, **not** when admissions were independently confirmed. The directory uses `sourceStatus`, `sourceNote`, `applicationState` and a known `deadlineISO` to display appropriately cautious filters and labels.

## Specific corrections made

1. **Technovation Challenge:** The official 2026–27 rules now clearly specify registration by **March 11, 2027 at 23:59 UTC** and project submission by **May 5, 2027 at 5 p.m. PDT**. Restored the verified registration countdown.
2. **Princeton Summer Journalism Program:** Updated to the organizer's mid-November 2026 opening and the *last Monday in January* application cutoff (no guessed clock time).
3. **CUNY STEM Research Academy:** Recorded grades 10–11 as the usual target and considered ninth graders as exceptional cases; also clarified student stipends.
4. **MoMA Teens-in-Residence:** Corrected the 2026–27 stipend ($1,000), September 14, 2026 application closing, and session commitments.
5. **Futures and Options Urban Leadership Fellows:** Switched from an old application form to the official program overview, which marks applications closed.
6. **The Metropolitan Museum of Art:** Linked to the current central internships directory instead of its redirected historic URL; noted spring/summer applications have separate timelines.
7. **New York Public Library:** Replaced broad teens homepage links with organizer-authored explanations for Teen Reading Ambassadors and Teen Civics Ambassadors. Recruitment for a current cycle is **not verified**.
8. **NYAS Junior Academy:** Confirmed the July 9, 2026 Fall application cutoff, free remote format, and ages 13–17.
9. **Cooper Hewitt, NYU ARISE, Rockefeller Jumpstart, AMNH SRMP, Whitney and many others:** Rechecked present published requirements, historic/current application deadlines and program status against organizer pages.
10. **Filters and student-facing accuracy:** Added a source-review confidence filter, evidence notes on each detail page, and conservative structured fee, compensation, and attendance metadata where verified; resolved a JavaScript shadowing bug that could crash the format filter.

## Full official-source review

| # | Program / organizer evidence | Level | Source findings |
|---|---|---|---|
| 1 | [Cooper Hewitt Design Hive](https://www.cooperhewitt.org/design-hive/) | Dated/current organizer information | 2027 Design Hive accepts juniors and seniors in NYC area; apply by October 25, 2026 at 11:59 p.m. $1,250 stipend. |
| 2 | [Brooklyn Botanic Garden — Garden Apprentice Program](https://www.bbg.org/learn/gap) | Dated/current organizer information | 2027 GAP applications have an early December 4, 2026 interview-invitation cutoff; it is not stated as the final deadline. Grades 9–11. |
| 3 | [MoMA Open Art Space](https://www.moma.org/calendar/programs/199) | Dated/current organizer information | Free Thursday 4–6 p.m. drop-in for high-school-age students; no internship application required. |
| 4 | [Rockefeller University Jumpstart](https://www.rockefeller.edu/outreach/lab-jumpstart/) | Dated/current organizer information | Jumpstart 2027 applications open; due January 4, 2027 at 5 p.m. ET including recommendation. NYC juniors/seniors age 16+. |
| 5 | [Science Research Mentoring Program (SRMP)](https://www.amnh.org/learn-teach/teens/science-research-mentoring-program/join-srmp) | Dated/current organizer information | AMNH states Class of 2028 applications expected winter 2027, but no exact date is posted. |
| 6 | [CUNY STEM Research Academy](https://www.cuny.edu/academics/current-initiatives/p20/stem-research-academy/) | Program exists; intake unconfirmed | CUNY confirms STEM Research Academy for primarily grades 10–11 NYCPS students; select ninth graders considered. Dates differ by campus. |
| 7 | [Summer Youth Employment Program (SYEP)](https://www.nyc.gov/site/dycd/services/jobs-internships/summer-youth-employment-program-syep.page) | Dated/current organizer information | NYC DYCD confirms 2026 SYEP submissions closed March 13; next summer application dates not published. |
| 8 | [NYC Ladders for Leaders](https://www.nyc.gov/site/dycd/services/jobs-internships/nyc-ladders-for-leaders-students.page) | Program exists; intake unconfirmed | DYCD confirms paid summer internships and career training; the page has no current application deadline. |
| 9 | [AMNH Science Communication Internship (SCIP)](https://www.amnh.org/learn-teach/teens/science-communication-internship-program) | Dated/current organizer information | AMNH still displays the March 1, 2026 deadline for its paid 2026 SCIP cohort; future intake not announced. |
| 10 | [NYU Precollege](https://join.nyu.edu/precollege/) | Program exists; intake unconfirmed | NYU confirms Precollege for rising juniors/seniors, but the landing page provides no 2027 deadline. Check cost/course details. |
| 11 | [NYU College Access Leadership Institute](https://meet.nyu.edu/advice/get-to-know-the-nyu-college-access-leadership-institute/) | Current info not verified | NYU's overview article explains the free summer program for rising seniors, but 2027 application dates are not confirmed; primary article blocked live extraction. |
| 12 | [NYC Service in Schools](https://www.schools.nyc.gov/learning/student-journey/experiential-learning/service-in-schools) | Program exists; intake unconfirmed | NYC Public Schools describes Service in Schools resources; participation depends on each school's projects, not one application. |
| 13 | [AMNH Science Alliance](https://www.amnh.org/learn-teach/teens/science-alliance-high-school) | Dated/current organizer information | AMNH lists 2026–27 paid Science Alliance courses for grades 9–12, at $1,000 per course with tuition assistance and session availability. |
| 14 | [NYU High School Art & Design Programs](https://steinhardt.nyu.edu/programs/programs-high-school-students) | Program exists; intake unconfirmed | NYU Steinhardt has different summer art/design programs and enrollment rules; check the individual course. |
| 15 | [Futures and Options Internship Program](https://futuresandoptions.org/our-programs/the-internship-program/) | Dated/current organizer information | Futures and Options explicitly marks its internship application closed; next opening not given. |
| 16 | [Futures and Options Urban Leadership Fellows](https://futuresandoptions.org/our-programs/urban-leadership-fellows-program/) | Dated/current organizer information | Futures and Options states the six-week paid Urban Leadership Fellows program is closed, and its 2026 form had a February 25 deadline. |
| 17 | [The Met High School Internships](https://www.metmuseum.org/opportunities/internships) | Program exists; intake unconfirmed | The Met confirms spring and summer high-school internships but currently lists different cohorts; use the official specific session page. |
| 18 | [Whitney Youth Insights Artists](https://whitney.org/education/teens/youth-insights) | Dated/current organizer information | Whitney's most recent Youth Insights Artists application deadline was September 9, 2026; next semester not published. |
| 19 | [Scholastic Art & Writing Awards](https://www.artandwriting.org/awards/how-to-enter/) | Dated/current organizer information | The 2027 Scholastic awards accept fall entries, with regional closing dates starting in December; check region-specific cutoff. |
| 20 | [YoungArts National Arts Competition](https://youngarts.org/apply/) | Dated/current organizer information | YoungArts' 2027 cycle closed October 6, 2026 at 8 p.m. ET; 2028 applications open summer 2027. |
| 21 | [WNYC Radio Rookies](https://wnyc.org/browse/shows/rookies) | Dated/current organizer information | WNYC still posts Fall 2026 Radio Rookies recruitment for NYC public/charter students in grades 9–12; the form deadline is not published. |
| 22 | [Princeton Summer Journalism Program](https://psjp.princeton.edu/apply/application-process) | Dated/current organizer information | Princeton states 2027–28 application opens mid-November 2026 and closes the last Monday in January; juniors only. |
| 23 | [Girls Who Code Pathways](https://girlswhocode.com/programs/pathways) | Dated/current organizer information | Girls Who Code's free virtual Pathways program has an Apply Now link; grade 9–12 girls/nonbinary students; self-paced projects. |
| 24 | [Technovation Challenge](https://technovationchallenge.org/competition/) | Dated/current organizer information | 2027 Technovation team registration closes March 11, 2027 at 23:59 UTC; final project submission May 5, 2027 at 5 p.m. PDT. |
| 25 | [Congressional App Challenge](https://www.congressionalappchallenge.us/students/rules/) | Dated/current organizer information | Congressional App Challenge 2026 closes October 26; check district participation and exact local cutoff with the official rules. |
| 26 | [Diamond Challenge](https://diamondchallenge.org/competition/) | Dated/current organizer information | Diamond Challenge 2027 submission deadline is January 14 at 5 p.m. Eastern; teams of 2–4 students with adult advisor. |
| 27 | [NYC Student Advisory Councils](https://www.schools.nyc.gov/get-involved/students/student-advisory-councils) | Program exists; intake unconfirmed | NYCPS describes advisory councils; each local council or school has a separate selection process. |
| 28 | [Mayor's Youth Leadership Council](https://www.nyc.gov/site/ymi/initiatives/youth-leadership-council.page) | Program exists; intake unconfirmed | NYC government describes the Mayor's Youth Leadership Council, but no current recruitment date appears on its overview. |
| 29 | [NYC Parks Ranger Conservation Corps](https://www.nyc.gov/jobs/internships.page) | Program exists; intake unconfirmed | NYC government confirms Ranger Conservation Corps high-school conservation internships, but the linked internship directory does not publish a current cohort application date. |
| 30 | [NYU Tandon ARISE Summer Research](https://k12stem.engineering.nyu.edu/programs/arise) | Dated/current organizer information | NYU ARISE website still gives the February 27, 2026 closing date from the 2026 cycle; 2027 cycle is not posted. |
| 31 | [Columbia University Science Honors Program](https://outreach.engineering.columbia.edu/SHP) | Dated/current organizer information | Columbia lists 2026–27 Saturday classes for grades 10–12, but a new admissions deadline is not published. |
| 32 | [Urban Barcode Research Program (UBRP)](https://dnalc.cshl.edu/programs/studentresearch.html) | Program exists; intake unconfirmed | CSHL DNA Learning Center confirms Urban Barcode Research Program grades 9–12; applications generally in spring; next exact date not posted. |
| 33 | [Urban Barcode Project](https://dnalc.cshl.edu/programs/studentresearch.html) | Program exists; intake unconfirmed | CSHL confirms Urban Barcode Project for teams of 2–4 high-school students with trained mentors; upcoming competition dates not specified. |
| 34 | [MoMA Teens-in-Residence](https://www.moma.org/calendar/programs/253) | Dated/current organizer information | MoMA lists 2026–27 paid Teens-in-Residence cohort (grades 10–12), September 14, 2026 application deadline and $1,000 stipend. |
| 35 | [MoMA In the Making](https://www.moma.org/calendar/programs/86) | Dated/current organizer information | MoMA lists In the Making summer arts courses as free, with no upcoming event or 2027 application window. |
| 36 | [Cooper Hewitt Teen Drop-In Workshops](https://www.cooperhewitt.org/teen-programs/) | Program exists; intake unconfirmed | Cooper Hewitt confirms free monthly teen drop-in workshops; individual event dates and reservations vary. |
| 37 | [New York Academy of Sciences — Junior Academy](https://www.nyas.org/learning/high-school-research-programs/the-junior-academy/) | Dated/current organizer information | NYAS states Junior Academy Fall 2026 recruitment closed July 9, 2026; future recruitment dates not confirmed. |
| 38 | [Memorial Sloan Kettering HOPP Summer Student Program](https://www.mskcc.org/research-programs/human-oncology-pathogenesis/education) | Program exists; intake unconfirmed | MSK HOPP confirms high-school Summer Student Program cancer research placements; no current 2027 deadline on this overview. |
| 39 | [MIT THINK Scholars Program](https://think.mit.edu/) | Current info not verified | MIT THINK's official homepage could not be fully read in this check; a 2026–27 application deadline cannot be independently confirmed. |
| 40 | [NYPL Teen Reading Ambassadors](https://www.nypl.org/blog/2023/07/31/kick-summer-great-book-teen-reading-ambassadors-favorite-reads-kids) | Current info not verified | NYPL confirms Teen Reading Ambassadors for grades 10–12 in organizer articles, but no current internship application page or deadline was verified. |
| 41 | [NYPL Teen Civics Ambassadors](https://www.nypl.org/blog/2025/09/29/teen-civics-ambassadors-report-ai-media-bias) | Current info not verified | NYPL confirms Teen Civics Ambassadors grades 10–12 in organizer articles, but no current application deadline was verified. |

## Open questions, limitations and follow-up

- **Always verify exact opening status before applying.** An older published application can remain on a website even after its cutoff. Missing dates are not converted into a predicted deadline.
- A handful of programs are verified through official background materials rather than current-year recruitment announcements: NYU CALI, MIT THINK, and the two NYPL Ambassador programs particularly need a more recent official application announcement.
- Some opportunities, such as NYC Service in Schools, MoMA's Open Art Space, and Cooper Hewitt's free drop-in workshops, do **not** operate like a yearly internship application. Their deadlines should not be invented.
- **Database caveat:** A live administrator edit stored in Supabase `catalog_programs`, `program_updates`, or `program_descriptions` may override the **bundled** values shown in this report. Compare changes in the Admin Dashboard when reconciling public information.
- URL format checks do not guarantee that every third-party form accepts applications. The review used accessible organizer pages and search-indexed organizer statements where direct extraction was unavailable; those cases are explicitly marked as limited.
- Program descriptions should be reviewed after each organizer's new cohort announcement, especially for costs, geographic restrictions, recommendations, age requirements, work authorization, and fees.

## Suggested ongoing review cycle

Check dated applications weekly during application season; mark entries for rechecking after 60 days. For a new official notice, update the relevant listing via **Admin Dashboard → Manage Programs**, and use the **Program Timelines** tab for verified exact date changes. Keep source links and clear date wording on every update.

**Review methodology:** Official organizer sources checked October 18, 2026. This is a source-content audit, not a real-time applicant-portal test, an endorsement from any organizer, or a guarantee of admission eligibility.
