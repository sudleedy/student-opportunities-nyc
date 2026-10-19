#!/usr/bin/env python3
"""Read-only quality checks for reviewed Student Opportunities NYC listings.

Usage: python3 scripts/catalog_audit.py
Run after every catalog expansion and weekly. Warnings flag organizer rechecks;
they do NOT imply a program is closed or automatically update published facts.
"""
import datetime as dt
import json
import pathlib
import re
import sys
from collections import Counter
from urllib.parse import urlsplit

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "programs-data.js"
FIELDS = (
    "id", "title", "org", "type", "subject", "url", "whatYouDo",
    "details", "eligibility", "cost", "preparation", "applicationNote",
    "sourceChecked", "sourceStatus", "deadline"
)
today = dt.datetime.now(dt.timezone.utc).date()
errors, warnings = [], []

def warn(text):
    warnings.append(text)
    print("::warning::" + text)

def error(text):
    errors.append(text)
    print("::error::" + text)

def main():
    contents = SRC.read_text(encoding="utf-8")
    match = re.search(r"window\.PROGRAMS\s*=\s*(\[.*\])\s*;\s*$", contents, re.S)
    if not match:
        error("Catalog must be a JSON array assigned to window.PROGRAMS.")
        return finish(0)
    try:
        programs = json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        error("Catalog JSON is invalid: " + str(exc))
        return finish(0)
    if not isinstance(programs, list):
        error("Program catalog must be a list.")
        return finish(0)
    ids, seen_urls = Counter(), {}
    for index, p in enumerate(programs):
        if not isinstance(p, dict):
            error("Entry " + str(index + 1) + " is not an object.")
            continue
        identifier = str(p.get("id") or "")
        ids[identifier] += 1
        tag = identifier or ("entry " + str(index + 1))
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]{2,119}", identifier):
            error(tag + ": invalid URL-safe program ID.")
        for field in FIELDS:
            if not isinstance(p.get(field), str) or not p[field].strip():
                error(tag + ": missing " + field)
        u = urlsplit(str(p.get("url", "")))
        if u.scheme != "https" or not u.netloc:
            error(tag + ": official URL must use HTTPS.")
        canonical = (u.netloc.lower() + u.path.rstrip("/")).lower()
        if canonical in seen_urls:
            warn(tag + ": same official URL as " + seen_urls[canonical] + "; confirm distinct programs.")
        else:
            seen_urls[canonical] = tag
        checked = str(p.get("sourceChecked", ""))
        try:
            checked_date = dt.date.fromisoformat(checked)
            age = (today - checked_date).days
            if age > 60:
                warn(tag + ": source last checked " + str(age) + " days ago; recheck organizer.")
            elif age < -1:
                error(tag + ": source review date is in the future.")
        except ValueError:
            error(tag + ": invalid sourceChecked date.")
        state = p.get("applicationState")
        if state not in ("open", "upcoming", "closed", "unknown"):
            error(tag + ": invalid applicationState.")
        status_text = str(p.get("status") or "")
        if state != "open" and re.search(r"\b(?:applications? (?:are |now )?open|entries open|registration open)\b", status_text, re.I):
            warn(tag + ": published status says open but applicationState is not open.")
        if state == "open":
            if p.get("sourceStatus") != "current":
                warn(tag + ": marked open without a current organizer check.")
            if p.get("deadlineISO"):
                try:
                    if dt.date.fromisoformat(p["deadlineISO"]) < today:
                        warn(tag + ": listed as open although stated deadline is past.")
                except ValueError:
                    error(tag + ": invalid deadlineISO.")
            else:
                warn(tag + ": marked open without an exact deadline; confirm availability.")
        elif p.get("deadlineISO"):
            try:
                dt.date.fromisoformat(p["deadlineISO"])
            except ValueError:
                error(tag + ": invalid deadlineISO.")
        if not p.get("grades"):
            warn(tag + ": grade eligibility is not categorized; student must read full criteria.")
    for name, n in ids.items():
        if n > 1:
            error("Duplicate ID " + name + " appears " + str(n) + " times.")
    return finish(len(programs))

def finish(count):
    print("\nCatalog audit: " + str(count) + " entries, "
          + str(len(errors)) + " error(s), " + str(len(warnings)) + " warning(s).")
    print("Stale or missing application information needs human review; "
          "this script does not check live enrollment, fees, eligibility or links.")
    return 1 if errors else 0

if __name__ == "__main__":
    sys.exit(main())
