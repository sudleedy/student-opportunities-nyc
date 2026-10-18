#!/usr/bin/env python3
"""Ensure the crawlable program directory and sitemap match programs-data.js.

Read-only: python3 scripts/check_program_directory.py
Run after editing the reviewed catalog. This checks links and names, not
real-time applications, official source accuracy or Google's index status.
"""
import html
import json
import pathlib
import re
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[1]
CATALOG = ROOT / "programs-data.js"
DIRECTORY = ROOT / "program-directory.html"
SITEMAP = ROOT / "sitemap.xml"
SITE = "https://student-opportunities-nyc.com/"
errors = []

raw = CATALOG.read_text(encoding="utf-8")
match = re.search(r"window\.PROGRAMS\s*=\s*(\[.*\])\s*;\s*$", raw, re.S)
if not match:
    raise SystemExit("Cannot parse the reviewed program catalog")
programs = json.loads(match.group(1))
expected = {p["id"]: p["title"] for p in programs}
directory = DIRECTORY.read_text(encoding="utf-8")
found = re.findall(r'<h3><a href="\./program\.html\?id=([a-z0-9-]+)">([^<]*)</a></h3>', directory)
ids = Counter(pid for pid, _title in found)

for pid, title in expected.items():
    if ids[pid] != 1:
        errors.append(f"{pid}: expected exactly one directory link, got {ids[pid]}")
    actual = [value for key, value in found if key == pid]
    if actual and html.unescape(actual[0]) != title:
        errors.append(f"{pid}: directory program title is out of date")
for pid in ids:
    if pid not in expected:
        errors.append(f"{pid}: directory link is not in the reviewed catalog")

sitemap = SITEMAP.read_text(encoding="utf-8")
for pid in expected:
    loc = f"<loc>{SITE}program.html?id={pid}</loc>"
    if sitemap.count(loc) != 1:
        errors.append(f"{pid}: sitemap entry must appear exactly once")
index_loc = f"<loc>{SITE}program-directory.html</loc>"
if sitemap.count(index_loc) != 1:
    errors.append("Crawlable directory must appear exactly once in sitemap")
if not re.search(r'<link rel="canonical" href="' + re.escape(SITE) + r'program-directory\.html"', directory):
    errors.append("Directory page must have its own canonical URL")

for problem in errors:
    print("::error::" + problem)
if errors:
    print(f"Program directory check FAILED with {len(errors)} error(s).")
    raise SystemExit(1)
print(f"Program directory check passed: {len(programs)} catalog programs have discoverable HTML links and sitemap entries.")
