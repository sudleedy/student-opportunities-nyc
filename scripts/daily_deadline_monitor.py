#!/usr/bin/env python3
"""Daily, conservative official-source application deadline monitoring.

No third-party packages or API keys. Tests: python3 -m unittest discover -s tests.
The workflow writes only unambiguous dates observed on TWO different days.
All other outcomes are reported without publishing guesses. Public administrator
overlays (Supabase) still take precedence over the bundled catalog.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import html
from html.parser import HTMLParser
import ipaddress
import json
import pathlib
import re
import socket
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[1]
CATALOG = ROOT / "programs-data.js"
STATE = ROOT / "data" / "deadline-monitor-state.json"
REPORT = ROOT / "deadline-monitor-report.json"
USER_AGENT = "StudentOpportunitiesNYC-DeadlineMonitor/1.0 (https://student-opportunities-nyc.com/)"
MAX_BYTES = 350_000
MAX_WORKERS = 6
REQUEST_TIMEOUT = 10

DATE = re.compile(
    r"(?<!\d)(20\d{2})-(0[1-9]|1[0-2])-([0-2]\d|3[01])(?!\d)"
    r"|\b(January|February|March|April|May|June|July|August|September|October|November|December|"
    r"Jan\.?|Feb\.?|Mar\.?|Apr\.?|Jun\.?|Jul\.?|Aug\.?|Sep\.?|Sept\.?|Oct\.?|Nov\.?|Dec\.?)"
    r"\s+([0-2]?\d|3[01])(?:st|nd|rd|th)?[,]?\s+(20\d{2})\b",
    re.I,
)
LABEL = re.compile(
    r"\b(?:application\s+deadline|applications?\s+(?:close|closes|closing|end|ends|due)|"
    r"deadline\s+for\s+applications?|application\s+due\s+date|"
    r"registration\s+deadline|submission\s+deadline|"
    r"submit\s+(?:your\s+|the\s+)?application\s+by|apply\s+by)\b",
    re.I,
)
EXCLUDE = re.compile(
    r"\b(?:priority|early-bird|early\s+deadline|recommendation|parent\s+consent|"
    r"letter\s+of|scholarship\s+deadline|nomination|financial\s+aid|"
    r"fee\s+waiver|estimated|tentative|not\s+confirmed|example|sample)\b",
    re.I,
)
STOP = set("the a and for from at with of in to on high school student students youth teen teens program programs internship internships summer spring fall winter new york city nyc academy research science careers scholarship".split())
ACRONYM = re.compile(r"\b[A-Z][A-Z0-9]{3,}\b")


class PageText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.headlines = [], []
        self.blocked = 0
        self.in_heading = 0
        self.heading_parts = []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript", "svg", "template"):
            self.blocked += 1
        if not self.blocked and tag in ("title", "h1"):
            self.in_heading += 1
            self.heading_parts = []

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript", "svg", "template"):
            self.blocked = max(0, self.blocked - 1)
        if tag in ("title", "h1") and self.in_heading:
            value = " ".join(self.heading_parts).strip()
            if value:
                self.headlines.append(value)
            self.in_heading = max(0, self.in_heading - 1)

    def handle_data(self, data):
        if self.blocked:
            return
        if data.strip():
            self.parts.append(data.strip())
            if self.in_heading:
                self.heading_parts.append(data.strip())

    def result(self):
        return re.sub(r"\s+", " ", " ".join(self.parts)), self.headlines


def parse_date(match):
    try:
        if match.group(1):
            return dt.date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        month = match.group(4).rstrip(".").lower()[:3]
        months = {name.lower()[:3]: i for i, name in enumerate(
            ("January", "February", "March", "April", "May", "June", "July", "August",
             "September", "October", "November", "December"), 1)}
        return dt.date(int(match.group(6)), months[month], int(match.group(5)))
    except (KeyError, TypeError, ValueError):
        return None


def has_program_identity(program, headlines):
    tokens = set(t for t in re.findall(r"[a-z]{4,}", program["title"].lower()) if t not in STOP)
    joined = " ".join(headlines).lower()
    headed = set(re.findall(r"[a-z]{4,}", joined))
    acronyms = ACRONYM.findall(program["title"])
    return len(tokens & headed) >= 2 or any(a.lower() in joined for a in acronyms)


def extract_verified_date(program, html_source, today):
    parser = PageText()
    parser.feed(html_source)
    text, headings = parser.result()
    if not has_program_identity(program, headings):
        return None, "program identity not established in page title/heading"
    candidates = set()
    for label in LABEL.finditer(text):
        # Require an explicit full date immediately after a specific application label.
        fragment = text[label.end():label.end() + 110]
        found = DATE.search(fragment)
        if not found or found.start() > 65:
            continue
        context = text[max(0, label.start() - 38):label.end() + found.end()]
        if EXCLUDE.search(context):
            continue
        date = parse_date(found)
        if date and today <= date <= today + dt.timedelta(days=420):
            candidates.add(date.isoformat())
    if len(candidates) != 1:
        return None, "no single unambiguous future application deadline"
    return next(iter(candidates)), "one explicit future application date with matching program heading"


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        old, new = urllib.parse.urlsplit(req.full_url), urllib.parse.urlsplit(newurl)
        if new.scheme != "https" or new.hostname != old.hostname:
            raise ValueError("cross-host or insecure redirect")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def public_url(raw):
    parsed = urllib.parse.urlsplit(raw)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        return False
    if parsed.port and parsed.port != 443:
        return False
    host = parsed.hostname.lower()
    if host in ("localhost",) or host.endswith((".local", ".internal", ".localhost")):
        return False
    try:
        ip = ipaddress.ip_address(host)
        return ip.is_global
    except ValueError:
        return "." in host


def fetch_page(program):
    url = program.get("url", "")
    if not public_url(url):
        return None, "invalid or nonpublic source URL"
    req = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml",
    })
    try:
        opener = urllib.request.build_opener(SafeRedirect())
        with opener.open(req, timeout=REQUEST_TIMEOUT) as resp:
            mime = resp.headers.get_content_type()
            if mime not in ("text/html", "application/xhtml+xml"):
                return None, "page is not HTML"
            raw = resp.read(MAX_BYTES + 1)
            if len(raw) > MAX_BYTES:
                return None, "page exceeds monitored size limit"
            charset = resp.headers.get_content_charset() or "utf-8"
        return raw.decode(charset, errors="replace"), None
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, LookupError) as exc:
        return None, (type(exc).__name__ + ": " + str(exc))[:180]


def monitor_one(program, today):
    page, error = fetch_page(program)
    if error:
        return program["id"], None, "unavailable: " + error
    try:
        found, reason = extract_verified_date(program, page, today)
        return program["id"], found, reason
    except Exception as exc:
        return program["id"], None, "unreadable: " + type(exc).__name__


def expire_dates(programs, today):
    changed = []
    for p in programs:
        old = p.get("deadlineISO")
        try:
            expired = bool(old) and dt.date.fromisoformat(old) < today
        except (ValueError, TypeError):
            continue
        if not expired:
            continue
        if p.get("applicationState") not in ("open", "upcoming"):
            continue
        p["applicationState"] = "unknown"
        p["status"] = "The last listed deadline has passed. Check the organizer for extensions or the next application cycle."
        p["deadline"] = "Last published deadline: " + old + " (passed; next date not confirmed)"
        p["deadlineNote"] = "Automatically flagged as past on " + today.isoformat() + ". This does not confirm the organizer has closed or reopened applications."
        changed.append(p["id"])
    return changed


def apply_evidence(programs, evidence, previous, today):
    """Two distinct days needed, and only if the same official date is seen."""
    updated, newstate, staged = [], dict(previous), []
    by_id = {p["id"]: p for p in programs}
    for pid, (date, reason) in evidence.items():
        if not date:
            # Drop pending one-day evidence if today's successful fetch did not confirm it.
            if pid in newstate and newstate[pid].get("hits", 0) < 2 and not reason.startswith("unavailable:"):
                del newstate[pid]
            continue
        p = by_id[pid]
        if date == p.get("deadlineISO"):
            continue
        old = newstate.get(pid, {})
        consecutive = (old.get("date") == date and
                       old.get("last_seen") != today.isoformat() and
                       0 < (today - dt.date.fromisoformat(old.get("last_seen", "2000-01-01"))).days <= 3)
        hits = min(2, int(old.get("hits", 0)) + 1) if consecutive else 1
        if old.get("date") == date and old.get("hits", 0) >= 2:
            hits = 2
        newstate[pid] = {"date": date, "hits": hits, "first_seen": old.get("first_seen", today.isoformat()) if consecutive else today.isoformat(),
                         "last_seen": today.isoformat() if hits < 2 else old.get("last_seen", today.isoformat())}
        if hits < 2:
            staged.append(pid)
            continue
        d = dt.date.fromisoformat(date)
        p["deadlineISO"] = date
        p["deadline"] = "Application deadline: " + d.strftime("%B %d, %Y").replace(" 0", " ")
        p["deadlineNote"] = ("Automatically confirmed on separate daily checks of the official organizer page, "
                             "most recently " + today.isoformat() + ". Verify time, eligibility and extensions with the organizer.")
        p["applicationState"] = "unknown"  # Deadline alone cannot prove applications are open.
        p["status"] = "Organizer lists this application deadline. Current enrollment availability is not independently confirmed."
        p["sourceStatus"] = "current"
        p["sourceChecked"] = today.isoformat()
        p["verified"] = today.isoformat()
        p["sourceNote"] = ("Deadline independently observed on two days at the listed organizer URL. "
                           "This confirms the published date, not whether applications are open.")
        updated.append(pid)
    return updated, newstate, staged


def main():
    cli = argparse.ArgumentParser()
    cli.add_argument("--dry-run", action="store_true", help="Check sources but never change repository files")
    cli.add_argument("--max-programs", type=int, default=0, help="Limit checks for diagnosis; no catalog publication in this mode")
    cli.add_argument("--report", default=str(REPORT))
    args = cli.parse_args()
    now = dt.datetime.now(dt.timezone.utc).date()
    contents = CATALOG.read_text(encoding="utf-8")
    match = re.search(r"window\.PROGRAMS\s*=\s*(\[.*\])\s*;\s*$", contents, re.S)
    if not match:
        raise SystemExit("Catalog assignment missing")
    programs = json.loads(match.group(1))
    original = json.dumps(programs, sort_keys=True)
    prior = json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}
    subset = programs[:args.max_programs] if args.max_programs > 0 else programs
    rows = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        results = pool.map(lambda p: monitor_one(p, now), subset)
        for pid, date, reason in results:
            rows[pid] = {"date": date, "result": reason}
    data = {pid: (row["date"], row["result"]) for pid, row in rows.items()}
    updates, nextstate, staged = apply_evidence(programs, data, prior, now)
    expired = expire_dates(programs, now)
    report = {
        "utc_date": now.isoformat(), "catalog_total": len(programs), "checked": len(rows),
        "unavailable": sum(v["result"].startswith("unavailable:") for v in rows.values()),
        "provisional": staged, "deadline_changes": updates, "past_deadlines_flagged": expired,
        "mode": "dry-run" if args.dry_run or args.max_programs else "write",
        "results": rows,
    }
    pathlib.Path(args.report).write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if not args.dry_run and not args.max_programs:
        if json.dumps(programs, sort_keys=True) != original:
            CATALOG.write_text(contents[:match.start(1)] + json.dumps(programs, indent=2, ensure_ascii=False) +
                               contents[match.end(1):], encoding="utf-8")
        if nextstate != prior:
            STATE.parent.mkdir(parents=True, exist_ok=True)
            STATE.write_text(json.dumps(nextstate, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Checked {len(rows)}/{len(programs)}: {len(updates)} confirmed updates, "
          f"{len(staged)} pending second observation, {len(expired)} expired labels flagged, "
          f"{report['unavailable']} unavailable. Report: {args.report}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
