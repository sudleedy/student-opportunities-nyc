# Student Opportunities NYC program quality review

Review date: October 18, 2026 (NYC). Scope: all **161 original catalog records**; 159 remain after corrections.

## What was checked

- All 161 individual program IDs for duplicate identifiers, organizer links, structured fields, dates and status handling. Checked public directory and sitemap alignment.
- Attempted a live HTTP request to **each of the 161 official-source URLs** from a GitHub Actions runner; this checks server reachability, not current application validity.
- Reviewed the seven groups of entries sharing the same official organizer URL to determine whether they are genuinely separate programs or duplicated listings.
- Inspected program-description quality and whether grade eligibility was explicitly tagged. Entries with a documented age requirement but no validated grade equivalent were **not** assigned guessed grades.
- Independently investigated suspicious or ambiguous listings and link failures against official organizer pages.

## First-pass external-link results

**131** URLs returned HTTP 200; **28** returned restricted, indeterminate or otherwise unverified responses; **2** returned HTTP 404. Network errors or automated-access restrictions should not be interpreted as confirmation that the program is discontinued.

The detailed per-program link snapshot is available in [latest official link audit](latest-official-links.json) (which is refreshed by the independent monthly link workflow). It records the actual HTTP result for every item.

## Post-correction second full link check

After the catalog corrections, the full HTTP audit was rerun against the **159 remaining programs** on October 18, 2026 (New York local date). Results: **131** returned HTTP 200, **28** could not be independently verified because of blocked requests (mostly HTTP 403/429) or certificate-chain problems, and **0** returned the earlier HTTP 404 error. The replacement Google, CyberPatriot and English-language Bronx Museum organizer references all responded successfully.

The newest [per-program source-link report](latest-official-links.json) now corresponds to the final 159-program catalog. This is still a *reachability audit*, not a guarantee of live enrollment or a complete manual recheck of every historical program description.

## Corrections made

1. **Removed two resources that are not single application opportunities:** NYU Steinhardt's general "High School Art & Design Programs" directory, and NYCPS "Service in Schools" resource initiative. Each linked page describes multiple activities rather than a distinct program with a single application. This change prioritizes the website's stated goal of listing actual programs.
2. **Google Code Next, Chelsea Lab:** the old `codenext.withgoogle.com` official website returned HTTP 404. Retained the documented named program but linked to an accessible **official Google historical article** that discusses Code Next and the Chelsea lab. The listing now explicitly says that this is not a current application page and that active recruiting has not been verified. It is not marked open.
3. **CyberPatriot competition:** its old `uscyberpatriot.org` competition URL returned HTTP 404 during the audit. Changed the link to the official **Air & Space Forces Association** CyberPatriot overview page, which explains the program. Updated instructions to note that high school participants join school-led teams via a coach; the new-team registration deadline and existing-team roster deadline differ. No current open status was invented.
4. **Bronx Museum Teen Council and Teen Summer:** old common link redirected automated visitors to a Spanish-language page. Both separate paid teen programs now link directly to the museum's official English-language teen-program page.
5. **Regenerated** the A-to-Z directory and sitemap, preserving IDs, location metadata, nine-results-per-page pagination, and existing student account storage. Updated catalog cache versions across the four website pages.

**Final catalog: 159 individual listings, 159 program detail links in the static directory, 162 sitemap URLs.**

## Shared links are not always duplicate programs

Seven sets of listings initially shared an official organizer page, including BRIC's two teen fellowships, CSHL's Urban Barcode Project and Urban Barcode Research Program, the Staten Island Zoo's Junior Docent and teen volunteering tracks, Reel Works' separate labs, Bronx Museum's two teen programs, and ELP Bx internships versus alumni mentorship. The entries describe different student activities or eligibility rules, so the audit did **not** delete any of these just because their official URLs matched. CSHL explicitly distinguishes its teacher-led Urban Barcode Project from its independent, scientist-mentored Urban Barcode Research Program.

## Remaining limitations and editorial queue

- An HTTP 200 response does **not** confirm that the application is currently available, that all eligibility rules remain correct, or that an organizer will offer a later cohort.
- Pages that block automated requests (often HTTP 403/429) need a browser/manual review; they must not be automatically deleted. Some official pages respond with nonstandard status HTTP 202.
- Some 18 catalog listings did not carry grade-array filters in the initial scan; many have age-based eligibility or varying grades. Keep the exact age requirement in the visible eligibility field rather than guessing a grade range. Additional case-by-case organizer reviews can fill confirmed grade tags later.
- **Current applications and admissions:** the site already has a separate conservative daily deadline monitor. It checks explicit deadlines and refuses to invent active enrollment; its output does not replace the need to confirm availability on official organizer sites.
- Programs described on old articles, including Google Code Next and the NYPL Teen Ambassador references, require later primary application-page verification before claiming a new cohort or open applications.

## Ongoing quality checks

- Monthly **official link audit**: `.github/workflows/official-link-audit.yml`, script `scripts/audit_official_links.py`.
- Weekly **catalog quality and HTML/sitemap consistency**: `.github/workflows/catalog-audit.yml`.
- Daily **conservative application deadline monitoring**: `.github/workflows/daily-program-deadlines.yml`.

All automated probes are intentionally non-destructive. Only confirmed editorial changes should alter what opportunities students see.
