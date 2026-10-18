# Phase 2 catalog expansion audit — October 18, 2026

**Repository:** [Student Opportunities NYC](https://github.com/sudleedy/student-opportunities-nyc).
**Previous bundled catalog:** 71. **New bundled catalog:** 86 (15 additions).

## Method and limitations

Program descriptions and eligibility notes were reviewed against program-organizer pages or official organizer search results on October 18, 2026. These entries are not live tests of organizers' application forms. Application windows, age limits, payment details, meeting dates and enrollment capacity may change without notice. `sourceStatus` distinguishes current published cycle information from background pages and limited access. `sourceChecked` records the last organizer review date, not a guarantee that places remain available. Known exact published dates are recorded in `deadlineISO`; unspecified closing dates are not guessed.

**Location policy:** Only a single established program attendance borough is assigned. The New York Cares multi-borough opportunities and two national Carnegie Hall youth orchestras are not misclassified as a local borough. The Carnegie programs have New York performances but 2027 residential training occurs outside NYC.

## Fifteen additions

| Program (organizer source) | NYC borough (physical program) | Listed state | Latest published deadline, intake, or event note |
|---|---|---|---|
| [Museum of the Moving Image — Teen Council](https://movingimage.org/education/teen-council/) | Queens | open | October 23, 2026 (2026–27 Teen Council) |
| [Museum of the Moving Image — Media Game Lab](https://movingimage.org/education/tween-teen-programs/) | Queens | unknown | No single program deadline; dates posted by the museum. |
| [Bronx Documentary Center — Youth Photo League](https://www.bronxdoc.org/bronx-documentary-center/education/bdc-youth-photo-league/) | Bronx | open | 2026–27 high-school applications advertised as open; no closing date published. |
| [NYSCI — Science Career Ladder Explainer](https://www.nysci.org/become-a-nysci-explainer) | Queens | upcoming | Recurring organizer windows: December 1–January 2 and April 1–May 1; confirm next cycle. |
| [NYSCI — STEM Nights and Teen Career Events](https://www.nysci.org/stem-career-events) | Queens | unknown | Event-by-event registrations; November 18, 2026 AI in Action event listed. |
| [Brooklyn Museum — Museum Apprentice Program](https://www.brooklynmuseum.org/careers/internships-fellowships/museum-apprentice-program) | Brooklyn | closed | 2026–27 deadline passed; organizer says to revisit in June 2027. |
| [Brooklyn Museum — Teen Night Planning Committee](https://www.brooklynmuseum.org/careers/internships-fellowships/teen-night-planning-committee) | Brooklyn | closed | 2026–27 deadline passed; museum suggests returning in June 2027. |
| [DOROT — Summer Teen Internship](https://www.dorotusa.org/volunteer/summer-teen-internship/) | Manhattan | upcoming | Applications closed; organizer expects fall/winter 2026 reopening without an exact date. |
| [DOROT — Academic Year Teen Internship](https://www.dorotusa.org/volunteer/academic-year-teen-internship/) | Manhattan | open | Fall 2026 program October 19–December 10; no final application cutoff stated. |
| [New York Cares — Teen-Friendly Volunteer Projects](https://www.newyorkcares.org/youth-friendly) | Citywide / national | unknown | Rolling volunteer shifts; project registration varies. |
| [Carnegie Hall — National Youth Orchestra (NYO-USA)](https://www.carnegiehall.org/Education/Programs/National-Youth-Ensembles/NYO-USA/Apply/Orchestra) | Citywide / national | open | December 3, 2026; recommendation deadline December 17. |
| [Carnegie Hall — National Youth Orchestra Jazz (NYO Jazz)](https://www.carnegiehall.org/Education/Programs/National-Youth-Ensembles/NYO-Jazz/Apply) | Citywide / national | open | January 18, 2027; recommendation deadline February 1. |
| [Reel Works — Narrative Lab](https://www.reelworks.org/afterschool) | Brooklyn | open | November 1, 2026 on the 2026–27 after-school overview. |
| [Reel Works — Film School Friday](https://www.reelworks.org/film-school-friday) | Brooklyn | unknown | Workshop-by-workshop registration; sessions listed October 23 and 30, 2026. |
| [Reel Works — Documentary Lab (Doc Lab)](https://www.reelworks.org/afterschool) | Brooklyn | closed | October 12, 2026 for the 2026–27 cohort (passed). |

## Important reviewer cautions

- **Museum of the Moving Image Teen Council:** The October 23, 2026 application date applies to the 2026–27 student leadership cohort; participants have age, grade and meeting-schedule requirements. The Media Game Lab is a separate free recurring activity, not the same internship.
- **Bronx Documentary Center Youth Photo League:** The official organizer has promoted 2026–27 applications as open without an explicit closing date. Eligibility extends to eligible teens across NYC, although Bronx applicants receive preference.
- **NYSCI Science Career Ladder:** December 1–January 2 and April 1–May 1 are organizer-listed hiring windows, not a guaranteed offer or confirmed 2027-specific opening. The STEM Nights events are separate one-off career events.
- **Brooklyn Museum Museum Apprentice and Teen Night Planning Committee:** Source review was limited to organizer search excerpts because the direct page restricted automated access. Verify age, compensation, and June 2027 follow-up on the museum's official site; this audit does not claim current applications are open.
- **DOROT:** The Summer Teen Internship and Academic Year Teen Internship are separate. The organizer lists a fall/winter expected next summer opening without a specific cutoff, whereas the Fall 2026 academic-year cohort is advertised as open.
- **New York Cares:** Teen Friendly projects vary by event and borough. Teens ages 14–17 register through guardian-led processes and do not have a single guaranteed placement.
- **Carnegie Hall youth orchestras:** NYO-USA and NYO Jazz are national audition-based ensembles. Participant tuition is free but 2027 applications carry a $30 fee with possible need-based waivers; those are correctly tagged as fee in the filtering model. The national residential venue is not represented as Manhattan.
- **Reel Works Narrative Lab:** Its current after-school overview shows November 1, 2026 while an older standalone program page retains older dates. Verify the active form and current eligibility before applying. The Documentary Lab's October 12 deadline is past. Film School Friday workshops have event-level RSVP requirements rather than one cohort deadline.

## Catalog and UI integrity

- Data saved in `programs-data.js` as `window.PROGRAMS` on the default `main` branch.
- Every new entry has a unique `id`, an HTTPS organizer link, grade data, a clear `whatYouDo` summary, full details, source status, checked date, eligible physical borough or none, and application-state metadata.
- Existing multi-select filters, 9-result pages, and borough filtering are implemented in `directory-ui.js` and were left unchanged.
- The catalog is a bundled fallback; any configured admin/Supabase updates may override certain details in the public UI.
- **Testing limitation:** Catalog JSON and relevant static source logic were inspected; no end-to-end browser tests or live third-party application submissions were run.

## Ongoing maintenance

Reopen dated listings near cutoffs, check the organizer's exact clock-time and timezone, and re-review undated programs for the next intake. The earlier [41-program](catalog-audit-2026-10-18.md) and [30-program](catalog-expansion-audit-2026-10-18.md) audits provide historical context.
