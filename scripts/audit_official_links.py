#!/usr/bin/env python3
"""Check official link reachability without changing student listings.

A 200 response proves only that a website responds, NOT that the exact
program or its current application is available. 403s, timeouts, and 404s
are flagged for editorial review, never deleted automatically.
"""
from __future__ import annotations

import concurrent.futures
import datetime as dt
import html
from html.parser import HTMLParser
import ipaddress
import json
import pathlib
import re
import socket
import ssl
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[1]
SITE = ROOT / "programs-data.js"
REPORT = ROOT / "audits" / "latest-official-links.json"
SUMMARY = ROOT / "audits" / "latest-official-links.md"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; StudentOpportunitiesNYC-CatalogAudit/1.0; +https://student-opportunities-nyc.com/)",
           "Accept": "text/html,application/xhtml+xml,*/*"}
MAX_WORKERS = 7
TIMEOUT = 10
MAX_HTML_BYTES = 90_000


def good_url(value):
    try:
        url = urllib.parse.urlsplit(value)
        if url.scheme != "https" or not url.hostname or url.username or url.password:
            return False
        if url.port not in (None, 443):
            return False
        name = url.hostname.lower()
        if name.endswith((".localhost", ".local", ".internal")) or name == "localhost":
            return False
        try:
            return ipaddress.ip_address(name).is_global
        except ValueError:
            return "." in name
    except (TypeError, ValueError):
        return False


class GuardedRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        if not good_url(newurl):
            raise ValueError("Redirected to an untrusted location")
        return super().redirect_request(request, fp, code, msg, headers, newurl)


class ExtractTitle(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.parts.append(data)

    def title(self):
        return html.unescape(" ".join(self.parts)).strip()[:170]


def check(p):
    result = {"id": p["id"], "title": p["title"], "url": p["url"],
              "status": "unverified", "http": None, "final_url": "",
              "page_title": "", "reason": ""}
    if not good_url(p["url"]):
        result["status"] = "invalid_url"
        result["reason"] = "URL must use public HTTPS"
        return result
    req = urllib.request.Request(p["url"], headers=HEADERS)
    try:
        with urllib.request.build_opener(GuardedRedirect()).open(req, timeout=TIMEOUT) as response:
            code = response.status
            result["http"] = code
            result["final_url"] = response.geturl()
            if code == 200:
                result["status"] = "responding"
                if response.headers.get_content_type() == "text/html":
                    data = response.read(MAX_HTML_BYTES)
                    parser = ExtractTitle()
                    parser.feed(data.decode("utf-8", errors="replace"))
                    result["page_title"] = parser.title()
            else:
                result["reason"] = "Unexpected status"
    except urllib.error.HTTPError as exc:
        result["http"] = exc.code
        result["status"] = "likely_broken" if exc.code in (404, 410) else "unverified"
        result["reason"] = f"HTTP {exc.code}. May be blocked, moved or require a browser."
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, ssl.SSLError) as exc:
        result["status"] = "unverified"
        result["reason"] = (type(exc).__name__ + ": " + str(exc))[:160]
    return result


def main():
    raw = SITE.read_text(encoding="utf-8")
    found = re.search(r"window\.PROGRAMS\s*=\s*(\[.*\])\s*;\s*$", raw, re.S)
    if not found:
        raise SystemExit("Cannot parse programs-data.js")
    programs = json.loads(found.group(1))
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        links = list(pool.map(check, programs))
    counts = dict(Counter(r["status"] for r in links))
    report = {
        "checked_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "programs": len(programs),
        "summary": counts,
        "explanation": "Responding does not mean enrollment is open; unverified links are NOT automatically removed. A 404 may reflect access restrictions and requires editorial review.",
        "links": links,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md = ["# Official program link audit", "",
          "Checked at " + report["checked_at_utc"] + ". All " + str(len(programs)) + " official URLs were attempted.", "",
          "**These checks do not confirm current enrollment, program details, or whether a website blocks bots.**", "",
          "## Results", ""]
    for label in ("responding", "likely_broken", "unverified", "invalid_url"):
        md.append(f"- {label.replace('_',' ').capitalize()}: **{counts.get(label, 0)}**")
    md += ["", "## Links requiring editorial attention", "",
           "Do not remove programs or automatically replace official URLs based on a single network result.", ""]
    for result in links:
        if result["status"] != "responding":
            md.append("- **" + result["id"] + "** | " + result["status"] +
                      " | HTTP " + str(result["http"] or "not available") +
                      " | " + result["reason"].replace("\n", " "))
    md += ["", "Full per-program results are in latest-official-links.json.", ""]
    SUMMARY.write_text("\n".join(md), encoding="utf-8")
    print("Checked " + str(len(programs)) + " links: " + str(counts))
    print("Review list: " + str(SUMMARY.relative_to(ROOT)))


if __name__ == "__main__":
    main()
